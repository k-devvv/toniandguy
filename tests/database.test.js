import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const uidA = "11111111-1111-4111-8111-111111111111";
const uidB = "22222222-2222-4222-8222-222222222222";
function payload(key = "33333333-3333-4333-8333-333333333333", branch = "s") {
  const date = new Date(Date.now() + 19800000 + 86400000)
    .toISOString()
    .slice(0, 10);
  return {
    branchId: branch,
    serviceId: "cut",
    preferredDate: date,
    preferredWindow: "am",
    customerName: "Integration Customer",
    customerPhone: "+919876543210",
    contactConsent: true,
    idempotencyKey: key,
  };
}
test("migration and database policies/RPCs execute in embedded PostgreSQL", async (t) => {
  const db = new PGlite();
  try {
    await db.exec(`CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
 CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid primary key);
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 GRANT USAGE ON SCHEMA auth TO authenticated; GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;`);
    await db.exec(
      await readFile(
        new URL("../supabase/migrations/001_booking_crm.sql", import.meta.url),
        "utf8",
      ),
    );
    await db.exec(
      `INSERT INTO auth.users VALUES ('${uidA}'),('${uidB}'); INSERT INTO public.staff_memberships VALUES ('${uidA}','s','staff'),('${uidB}','p','staff');`,
    );
    const create = async (p, hash = "hash-one", rate = "rate-one") =>
      (
        await db.query(
          "SELECT public.create_booking($1::jsonb,$2,$3) AS result",
          [JSON.stringify(p), hash, rate],
        )
      ).rows[0].result;
    let saved;
    await t.test(
      "durable insert and duplicate replay produce one booking",
      async () => {
        saved = await create(payload());
        const retry = await create(payload());
        assert.equal(saved.reference, retry.reference);
        assert.equal(retry.replayed, true);
        assert.equal(
          (await db.query("select count(*)::int n from bookings")).rows[0].n,
          1,
        );
      },
    );
    await t.test("changed idempotent payload is rejected", async () => {
      await assert.rejects(
        create({ ...payload(), customerName: "Changed" }, "hash-two"),
        (e) => e.code === "PT409",
      );
    });
    await create(
      payload("44444444-4444-4444-8444-444444444444", "p"),
      "hash-p",
      "rate-p",
    );
    const records = (
      await db.query("select id,branch_id from bookings order by branch_id")
    ).rows;
    const s = records.find((r) => r.branch_id === "s").id,
      p = records.find((r) => r.branch_id === "p").id;
    await t.test(
      "anonymous cannot read bookings or call insert RPC",
      async () => {
        await db.exec("SET ROLE anon");
        try {
          await assert.rejects(
            db.query("select * from public.bookings"),
            (e) => e.code === "42501",
          );
          await assert.rejects(create(payload()), (e) => e.code === "42501");
        } finally {
          await db.exec("RESET ROLE");
        }
      },
    );
    await db.exec(
      `SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${uidA}',false);`,
    );
    await t.test(
      "branch staff can only read own branch and cannot self-promote",
      async () => {
        assert.deepEqual(
          (await db.query("select branch_id from bookings")).rows,
          [{ branch_id: "s" }],
        );
        await assert.rejects(
          db.query(
            `update staff_memberships set role='owner' where user_id=$1`,
            [uidA],
          ),
          (e) => e.code === "42501",
        );
      },
    );
    await t.test(
      "guessed booking IDs cannot be edited across branches",
      async () => {
        await assert.rejects(
          db.query(`select public.update_booking($1,1,'contacted',null,null)`, [
            p,
          ]),
          (e) => e.code === "PT403",
        );
      },
    );
    await t.test(
      "staff edit saves note/audit and stale version fails",
      async () => {
        await db.query(
          `select public.update_booking($1,1,'contacted',null,'Called customer')`,
          [s],
        );
        await assert.rejects(
          db.query(`select public.update_booking($1,1,'cancelled',null,null)`, [
            s,
          ]),
          (e) => e.code === "PT409",
        );
        const events = (
          await db.query(
            `select note from booking_events where booking_id=$1 and note is not null`,
            [s],
          )
        ).rows;
        assert.equal(events[0].note, "Called customer");
      },
    );
    await t.test(
      "confirmation requires agreed timestamp; notes increment version",
      async () => {
        await assert.rejects(
          db.query(`select public.update_booking($1,2,'confirmed',null,null)`, [
            s,
          ]),
          (e) => e.code === "PT400",
        );
        const appointment = new Date(Date.now() + 86400000).toISOString();
        await db.query(
          `select public.update_booking($1,2,'confirmed',$2::timestamptz,'Agreed by phone')`,
          [s, appointment],
        );
        await db.query(
          `select public.update_booking($1,3,null,null,'Customer will arrive early')`,
          [s],
        );
        assert.equal(
          (await db.query("select version from bookings where id=$1", [s]))
            .rows[0].version,
          4,
        );
      },
    );
    await t.test("customer aggregates respect branch RLS", async () => {
      const rows = (await db.query("select * from list_customers(null,'',1)"))
        .rows;
      assert.equal(rows.length, 1);
      assert.equal(Number(rows[0].booking_count), 1);
    });
    await db.exec("RESET ROLE");
    await t.test("durable rate limit rejects sixth new request", async () => {
      for (let i = 0; i < 5; i++)
        await create(
          {
            ...payload(
              `55555555-5555-4555-8555-${String(i).padStart(12, "0")}`,
            ),
            customerPhone: "+919123456789",
          },
          "ratehash" + i,
          "limit-source",
        );
      await assert.rejects(
        create(
          {
            ...payload("55555555-5555-4555-8555-999999999999"),
            customerPhone: "+919123456789",
          },
          "six",
          "limit-source",
        ),
        (e) => e.code === "PT429",
      );
    });
    await t.test("independent IP bucket rejects phone rotation", async () => {
      for (let i = 0; i < 30; i++)
        await create(
          {
            ...payload(
              `66666666-6666-4666-8666-${String(i).padStart(12, "0")}`,
            ),
            customerPhone: "+91" + String(9000000000 + i),
          },
          "iphash" + i,
          "one-ip",
        );
      await assert.rejects(
        create(
          {
            ...payload("66666666-6666-4666-8666-999999999999"),
            customerPhone: "+919000000099",
          },
          "overflow",
          "one-ip",
        ),
        (e) => e.code === "PT429",
      );
    });
    await t.test(
      "rescheduling records old and new appointment times",
      async () => {
        await db.exec(
          `SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${uidA}',false);`,
        );
        const next = new Date(Date.now() + 2 * 86400000).toISOString();
        await db.query(
          "select public.update_booking($1,4,'confirmed',$2::timestamptz,'Rescheduled by phone')",
          [s, next],
        );
        const event = (
          await db.query(
            "select old_appointment_at,new_appointment_at from booking_events where note='Rescheduled by phone'",
          )
        ).rows[0];
        assert.ok(event.old_appointment_at);
        assert.ok(event.new_appointment_at);
        assert.notEqual(
          String(event.old_appointment_at),
          String(event.new_appointment_at),
        );
        await assert.rejects(
          db.query("select public.update_booking($1,5,'confirmed',null,null)", [
            s,
          ]),
          (e) => e.code === "PT400",
        );
        await db.query(
          "select public.update_booking($1,5,'cancelled',null,null)",
          [s],
        );
        assert.equal(
          (
            await db.query("select appointment_at from bookings where id=$1", [
              s,
            ])
          ).rows[0].appointment_at,
          null,
        );
        await db.exec("RESET ROLE");
      },
    );
  } finally {
    await db.close();
  }
});

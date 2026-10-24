import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { createHandler, validateBooking, csvCell } from "../src/worker.js";
if (!globalThis.crypto) globalThis.crypto = webcrypto;
const now = () => Date.parse("2026-10-23T10:00:00Z");
const booking = () => ({
  branchId: "s",
  serviceId: "cut",
  preferredDate: "2026-10-24",
  preferredWindow: "am",
  customerName: "Test Client",
  customerPhone: "9876543210",
  contactConsent: true,
  idempotencyKey: "b38b3a9a-030e-47cd-9da4-7719e9089af7",
  turnstileToken: "challenge",
  website: "",
});
const env = {
  SUPABASE_URL: "https://db.example",
  SUPABASE_ANON_KEY: "anon",
  SUPABASE_SERVICE_ROLE_KEY: "secret",
  TURNSTILE_SECRET_KEY: "bot-secret",
  TURNSTILE_SITE_KEY: "site",
  ASSETS: { fetch: () => new Response("asset") },
};
const request = (path, method = "GET", data, headers = {}) =>
  new Request("https://salon.example" + path, {
    method,
    headers,
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
const reply = (d, status = 200) => new Response(JSON.stringify(d), { status });
test("normalizes strict Indian mobile; disallows invalid phones and branch services", () => {
  assert.equal(
    validateBooking(booking(), now()).customerPhone,
    "+919876543210",
  );
  for (const phone of [
    "1234567890",
    "+14155552671",
    "9876543210123",
    "+9198765432100",
  ])
    assert.throws(() =>
      validateBooking({ ...booking(), customerPhone: phone }, now()),
    );
  assert.throws(() =>
    validateBooking({ ...booking(), serviceId: "express" }, now()),
  );
  assert.throws(() =>
    validateBooking({ ...booking(), customerName: " " }, now()),
  );
  assert.throws(() =>
    validateBooking({ ...booking(), contactConsent: false }, now()),
  );
});
test("IST date boundaries and actual calendar dates", () => {
  assert.throws(() =>
    validateBooking({ ...booking(), preferredDate: "2026-10-23" }, now()),
  );
  assert.throws(() =>
    validateBooking({ ...booking(), preferredDate: "2027-02-30" }, now()),
  );
  assert.throws(() =>
    validateBooking({ ...booking(), preferredDate: "2027-02-01" }, now()),
  );
  assert.throws(() =>
    validateBooking(
      { ...booking(), preferredDate: "2026-10-24" },
      Date.parse("2026-10-23T20:00:00Z"),
    ),
  );
});
test("config fails closed without exposing service secrets; assets fallback", async () => {
  const h = createHandler();
  const r = await h(request("/api/config"), {});
  assert.equal(r.status, 200);
  assert.equal((await r.json()).bookingEnabled, false);
  assert.equal((await h(request("/api/health"), {})).status, 503);
  const c = await (await h(request("/api/config"), env)).text();
  assert.ok(!c.includes("bot-secret"));
  assert.equal(await (await h(request("/"), env)).text(), "asset");
});
test("origin and auth reject before database calls", async () => {
  const h = createHandler(() => {
    throw Error("should not call");
  });
  assert.equal(
    (
      await h(
        request("/api/booking-requests", "POST", booking(), {
          origin: "https://evil.example",
        }),
        env,
      )
    ).status,
    403,
  );
  assert.equal((await h(request("/api/staff/me"), env)).status, 401);
  assert.equal(
    (await h(request("/api/booking-requests", "POST", booking()), {})).status,
    503,
  );
});
test("booking persistence and retry response; hash excludes challenge", async () => {
  let hash;
  let n = 0;
  const h = createHandler(async (url, o) => {
    if (url.includes("turnstile"))
      return reply({ success: true, hostname: "salon.example" });
    const b = JSON.parse(o.body);
    assert.equal(o.headers.apikey, "secret");
    if (hash) assert.equal(hash, b.p_hash);
    hash = b.p_hash;
    return reply({ reference: "TG-123", replayed: n++ > 0 });
  }, now);
  const first = await h(
    request("/api/booking-requests", "POST", booking()),
    env,
  );
  assert.equal(first.status, 201);
  assert.equal(first.headers.get("cache-control"), "no-store");
  assert.deepEqual(await first.json(), {
    reference: "TG-123",
    status: "pending",
  });
  assert.equal(
    (
      await h(
        request("/api/booking-requests", "POST", {
          ...booking(),
          turnstileToken: "new",
        }),
        env,
      )
    ).status,
    200,
  );
});
test("bot failure, database failure and idempotency conflicts never report success", async () => {
  for (const [result, status] of [
    [reply({ code: "PT409" }, 400), 409],
    [reply({}, 500), 503],
  ]) {
    const h = createHandler(
      async (u) =>
        u.includes("turnstile")
          ? reply({ success: true, hostname: "salon.example" })
          : result,
      now,
    );
    assert.equal(
      (await h(request("/api/booking-requests", "POST", booking()), env))
        .status,
      status,
    );
  }
  for (const challenge of [
    { success: false },
    { success: true, hostname: "evil.example" },
  ]) {
    const h = createHandler(async () => reply(challenge), now);
    assert.equal(
      (await h(request("/api/booking-requests", "POST", booking()), env))
        .status,
      400,
    );
  }
});
test("staff uses user JWT and branch restriction; optimistic conflict surfaces", async () => {
  const h = createHandler(async (url, o) => {
    assert.notEqual(o.headers.apikey, "secret");
    if (url.includes("/auth/"))
      return reply({ id: "u", email: "staff@example.com" });
    if (url.includes("staff_memberships"))
      return reply([{ branch_id: "s", role: "staff" }]);
    if (url.includes("update_booking")) return reply({ code: "PT409" }, 400);
    return reply([]);
  }, now);
  const headers = { authorization: "Bearer user-jwt" };
  assert.equal(
    (
      await h(
        request("/api/staff/bookings?branchId=p", "GET", null, headers),
        env,
      )
    ).status,
    403,
  );
  assert.equal(
    (await h(request("/api/staff/bookings", "GET", null, headers), env)).status,
    200,
  );
  assert.equal(
    (
      await h(
        request(
          "/api/staff/bookings/b38b3a9a-030e-47cd-9da4-7719e9089af7",
          "PATCH",
          { version: 1, status: "contacted" },
          headers,
        ),
        env,
      )
    ).status,
    409,
  );
});
test("expired staff auth, oversized request, malformed JSON and CSV formulas", async () => {
  const h = createHandler(async () => reply({}, 401));
  assert.equal(
    (
      await h(
        request("/api/staff/me", "GET", null, {
          authorization: "Bearer expired",
        }),
        env,
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await h(
        request("/api/booking-requests", "POST", {
          ...booking(),
          notes: "a".repeat(17000),
        }),
        env,
      )
    ).status,
    413,
  );
  assert.equal(
    (
      await h(
        new Request("https://salon.example/api/booking-requests", {
          method: "POST",
          body: "{",
        }),
        env,
      )
    ).status,
    400,
  );
  assert.equal(csvCell("=SUM(A1)"), '"\'=SUM(A1)"');
  assert.equal(csvCell('a"b'), '"a""b"');
  assert.ok(csvCell(" \t+123").includes("'"));
});

test("rejects nonhex UUID, short name, oversized notes and unknown preferences", () => {
  for (const patch of [
    { idempotencyKey: "zzzzzzzz-030e-47cd-9da4-7719e9089af7" },
    { customerName: "A" },
    { notes: "x".repeat(1001) },
    { stylistPreference: "invented" },
    { occasion: "invented" },
  ]) {
    assert.throws(() => validateBooking({ ...booking(), ...patch }, now()));
  }
});

test("streamed requests stop at body cap and external failures return safe errors", async () => {
  let cancelled = false;
  const stream = new ReadableStream({
    pull(controller) {
      controller.enqueue(new Uint8Array(9000));
    },
    cancel() {
      cancelled = true;
    },
  });
  const h = createHandler(async (_url, options) => {
    assert.ok(options.signal instanceof AbortSignal);
    throw new DOMException("private timeout detail", "TimeoutError");
  }, now);
  const oversized = new Request("https://salon.example/api/booking-requests", {
    method: "POST",
    body: stream,
    duplex: "half",
  });
  assert.equal((await h(oversized, env)).status, 413);
  assert.equal(cancelled, true);
  const response = await h(
    request("/api/booking-requests", "POST", booking()),
    env,
  );
  assert.equal(response.status, 503);
  assert.ok(!(await response.text()).includes("private timeout"));
});

test("rate key is IP only, independent of mobile, and rate failures surface", async () => {
  const rateKeys = [];
  const h = createHandler(async (url, options) => {
    assert.ok(options.signal instanceof AbortSignal);
    if (url.includes("turnstile"))
      return reply({ success: true, hostname: "salon.example" });
    rateKeys.push(JSON.parse(options.body).p_rate_key);
    return reply({ code: "PT429" }, 400);
  }, now);
  for (const phone of ["9876543210", "9876543211"]) {
    const response = await h(
      request(
        "/api/booking-requests",
        "POST",
        { ...booking(), customerPhone: phone },
        { "cf-connecting-ip": "203.0.113.1" },
      ),
      env,
    );
    assert.equal(response.status, 429);
  }
  assert.equal(rateKeys[0], rateKeys[1]);
});

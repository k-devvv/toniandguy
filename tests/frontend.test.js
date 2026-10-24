import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizePhone,
  localDate,
  preferredDays,
  resetDependentChoices,
  sendBooking,
} from "../public/booking-utils.js";
test("phone normalisation preserves identity and rejects arbitrary extra digits", () => {
  assert.equal(normalizePhone("98765 43210"), "+919876543210");
  assert.equal(normalizePhone("+91 98765-43210"), "+919876543210");
  for (const bad of [
    "1234567890",
    "999919876543210",
    "+449876543210",
    "text9876543210",
    "09876543210",
    "",
  ])
    assert.equal(normalizePhone(bad), null);
});
test("booking date values and labels use IST around midnight", () => {
  assert.equal(localDate(new Date("2026-10-23T19:00:00Z")), "2026-10-24");
  assert.equal(localDate(new Date("2026-10-23T18:29:59Z")), "2026-10-23");
  assert.equal(
    preferredDays(new Date("2026-10-23T19:00:00Z"), 1)[0][0],
    "2026-10-25",
  );
});
test("switching branch clears incompatible choices, preserves contact draft", () => {
  const b = {
    loc: "s",
    svc: "men",
    sty: "groom",
    date: "2026-10-25",
    win: "am",
    name: "Test",
    phone: "9876543210",
    idempotencyKey: "old",
  };
  resetDependentChoices(b, "loc", "p");
  assert.equal(b.name, "Test");
  assert.equal(b.loc, "p");
  for (const key of ["svc", "sty", "date", "win", "idempotencyKey"])
    assert.equal(b[key], undefined);
});
test("failed submission does not become success", async () => {
  await assert.rejects(
    sendBooking(
      {},
      {
        fetcher: async () =>
          new Response(
            JSON.stringify({ error: { message: "Database unavailable" } }),
            { status: 503 },
          ),
      },
    ),
    /Database unavailable/,
  );
});
test("malformed success response is recoverable error", async () => {
  await assert.rejects(
    sendBooking({}, { fetcher: async () => new Response("{}") }),
    /incomplete/,
  );
});
test("retry preserves idempotency key and obtains original reference", async () => {
  const payload = { idempotencyKey: "same-key" };
  const sent = [];
  const fetcher = async (url, options) => {
    sent.push(JSON.parse(options.body));
    if (sent.length === 1) throw new Error("Network error");
    return new Response(
      JSON.stringify({ reference: "TG-EXAMPLE", status: "pending" }),
    );
  };
  await assert.rejects(sendBooking(payload, { fetcher }), /Network error/);
  const recovered = await sendBooking(payload, { fetcher });
  assert.equal(recovered.reference, "TG-EXAMPLE");
  assert.equal(sent[0].idempotencyKey, sent[1].idempotencyKey);
});
test("timeout explains uncertain save and safe retry", async () => {
  await assert.rejects(
    sendBooking(
      {},
      {
        timeout: 1,
        fetcher: async (_, options) =>
          new Promise((resolve, reject) =>
            options.signal.addEventListener("abort", () =>
              reject(
                Object.assign(new Error("Aborted"), { name: "AbortError" }),
              ),
            ),
          ),
      },
    ),
    /may have been saved/,
  );
});

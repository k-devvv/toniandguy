export const SERVICES = [
  "cut",
  "reset",
  "root",
  "balayage",
  "gloss",
  "smooth",
  "spa",
  "style",
  "men",
  "express",
  "family",
  "bridal",
];
export const STATUSES = [
  "pending",
  "contacted",
  "confirmed",
  "declined",
  "cancelled",
  "completed",
  "no_show",
];
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    Object.assign(this, { status, code });
  }
}
const fail = (s, c, m) => {
  throw new ApiError(s, c, m);
};
export function validateBooking(b, now = Date.now()) {
  const str = (v, max, required = false) => {
    if (v == null && !required) return "";
    if (
      typeof v !== "string" ||
      v.trim().length > max ||
      (required && !v.trim())
    )
      fail(400, "validation", "Invalid field.");
    return v.trim();
  };
  if (
    !b ||
    !["s", "p"].includes(b.branchId) ||
    !SERVICES.includes(b.serviceId) ||
    (b.serviceId === "express" && b.branchId !== "p") ||
    (b.serviceId === "family" && b.branchId !== "s")
  )
    fail(400, "validation", "Invalid branch or service.");
  let phone = str(b.customerPhone, 20, true).replace(/[ -]/g, "");
  if (/^[6-9]\d{9}$/.test(phone)) phone = "+91" + phone;
  if (!/^\+91[6-9]\d{9}$/.test(phone))
    fail(400, "validation", "Enter a valid Indian mobile number.");
  const today = new Date(now + 19800000).toISOString().slice(0, 10),
    d = str(b.preferredDate, 10, true),
    t = Date.parse(d + "T00:00:00Z"),
    days = (t - Date.parse(today + "T00:00:00Z")) / 86400000;
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(d) ||
    !Number.isFinite(t) ||
    new Date(t).toISOString().slice(0, 10) !== d ||
    days < 1 ||
    days > 90
  )
    fail(400, "validation", "Choose tomorrow through the next 90 days.");
  if (
    !["am", "noon", "pm"].includes(b.preferredWindow) ||
    b.contactConsent !== true ||
    !/^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(
      b.idempotencyKey || "",
    ) ||
    b.website
  )
    fail(400, "validation", "Invalid booking details.");
  if (
    str(b.customerName, 100, true).length < 2 ||
    ![
      "",
      "precision",
      "colour",
      "texture",
      "groom",
      "occasion",
      "family",
      "creative",
    ].includes(b.stylistPreference ?? "") ||
    ![
      "",
      "meeting",
      "monday",
      "wedding",
      "date",
      "party",
      "celebration",
      "holiday",
      "weekend",
      "event",
    ].includes(b.occasion ?? "")
  )
    fail(400, "validation", "Invalid name or preference.");
  return {
    branchId: b.branchId,
    serviceId: b.serviceId,
    stylistPreference: str(b.stylistPreference, 80),
    occasion: str(b.occasion, 80),
    preferredDate: d,
    preferredWindow: b.preferredWindow,
    customerName: str(b.customerName, 100, true),
    customerPhone: phone,
    notes: str(b.notes, 1000),
    contactConsent: true,
    idempotencyKey: b.idempotencyKey,
  };
}
export function csvCell(v) {
  let s = String(v ?? "");
  if (/^\s*[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
export function csv(rows) {
  const f = [
    "reference",
    "branch_id",
    "status",
    "customer_name",
    "customer_phone",
    "service_id",
    "preferred_date",
    "preferred_window",
    "appointment_at",
    "created_at",
  ];
  return (
    "\uFEFF" +
    [
      f.map(csvCell).join(","),
      ...rows.map((r) => f.map((k) => csvCell(r[k])).join(",")),
    ].join("\r\n")
  );
}
const json = (d, s = 200) =>
  new Response(JSON.stringify(d), {
    status: s,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
const configured = (e) =>
  [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "TURNSTILE_SECRET_KEY",
    "TURNSTILE_SITE_KEY",
  ].every((k) => !!e[k]);
async function body(r) {
  if (Number(r.headers.get("content-length")) > 16384)
    fail(413, "body_limit", "Request too large.");
  const reader = r.body?.getReader();
  const chunks = [];
  let size = 0;
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16384) {
        await reader.cancel();
        fail(413, "body_limit", "Request too large.");
      }
      chunks.push(value);
    }
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const s = new TextDecoder().decode(bytes);
  try {
    return JSON.parse(s);
  } catch {
    fail(400, "json", "Invalid JSON.");
  }
}
export function createHandler(fetcher = fetch, now = () => Date.now()) {
  const externalFetch = (url, options = {}) =>
    fetcher(url, {
      ...options,
      signal: AbortSignal.timeout(10000),
    });
  return async (req, env) => {
    const u = new URL(req.url),
      p = u.pathname;
    if (!p.startsWith("/api/")) return env.ASSETS.fetch(req);
    try {
      if (p === "/api/config" && req.method === "GET")
        return json({
          supabaseUrl: env.SUPABASE_URL || "",
          supabaseAnonKey: env.SUPABASE_ANON_KEY || "",
          turnstileSiteKey: env.TURNSTILE_SITE_KEY || "",
          bookingEnabled: configured(env),
        });
      if (p === "/api/health" && req.method === "GET")
        return json(
          { status: configured(env) ? "configured" : "unavailable" },
          configured(env) ? 200 : 503,
        );
      if (req.headers.get("origin") && req.headers.get("origin") !== u.origin)
        fail(403, "origin", "Origin not allowed.");
      if (!configured(env))
        fail(503, "unavailable", "Booking service unavailable.");
      async function db(
        resource,
        options = {},
        token = env.SUPABASE_SERVICE_ROLE_KEY,
      ) {
        const r = await externalFetch(
          env.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/" + resource,
          {
            ...options,
            headers: {
              apikey:
                token === env.SUPABASE_SERVICE_ROLE_KEY
                  ? token
                  : env.SUPABASE_ANON_KEY,
              Authorization: "Bearer " + token,
              "content-type": "application/json",
              ...options.headers,
            },
          },
        );
        let d;
        try {
          d = await r.json();
        } catch {}
        if (!r.ok) {
          const c = d?.code;
          if (c === "PT409")
            fail(409, "conflict", "Record changed or idempotency key reused.");
          if (c === "PT429") fail(429, "rate_limit", "Too many requests.");
          if (c === "PT403" || r.status === 403)
            fail(403, "forbidden", "Access denied.");
          if (c === "PT400") fail(400, "validation", "Invalid update.");
          fail(503, "database", "Unable to load or save records.");
        }
        return d;
      }
      if (p === "/api/booking-requests" && req.method === "POST") {
        const input = await body(req),
          b = validateBooking(input, now());
        const r = await externalFetch(
          "https://challenges.cloudflare.com/turnstile/v0/siteverify",
          {
            method: "POST",
            body: new URLSearchParams({
              secret: env.TURNSTILE_SECRET_KEY,
              response:
                typeof input.turnstileToken === "string"
                  ? input.turnstileToken
                  : "",
              remoteip: req.headers.get("cf-connecting-ip") || "",
            }),
          },
        );
        let challenge;
        try {
          challenge = await r.json();
        } catch {}
        if (!r.ok || !challenge?.success || challenge.hostname !== u.hostname)
          fail(400, "bot_check", "Verification failed. Please try again.");
        const digest = async (s) =>
          Array.from(
            new Uint8Array(
              await crypto.subtle.digest(
                "SHA-256",
                new TextEncoder().encode(s),
              ),
            ),
          )
            .map((x) => x.toString(16).padStart(2, "0"))
            .join("");
        const saved = await db("rpc/create_booking", {
          method: "POST",
          body: JSON.stringify({
            p_payload: b,
            p_hash: await digest(JSON.stringify(b)),
            p_rate_key: await digest(
              req.headers.get("cf-connecting-ip") || "unknown",
            ),
          }),
        });
        return json(
          { reference: saved.reference, status: "pending" },
          saved.replayed ? 200 : 201,
        );
      }
      if (!p.startsWith("/api/staff/"))
        fail(404, "not_found", "Endpoint not found.");
      const token = req.headers
        .get("authorization")
        ?.match(/^Bearer (.+)$/)?.[1];
      if (!token) fail(401, "unauthorized", "Sign in required.");
      const auth = await externalFetch(
        env.SUPABASE_URL.replace(/\/$/, "") + "/auth/v1/user",
        {
          headers: {
            apikey: env.SUPABASE_ANON_KEY,
            Authorization: "Bearer " + token,
          },
        },
      );
      if (!auth.ok) fail(401, "unauthorized", "Session expired.");
      const user = await auth.json(),
        memberships = await db(
          "staff_memberships?select=branch_id,role",
          {},
          token,
        );
      if (!memberships.length) fail(403, "forbidden", "Staff access required.");
      if (p === "/api/staff/me" && req.method === "GET")
        return json({ user: { id: user.id, email: user.email }, memberships });
      const branch = u.searchParams.get("branchId"),
        status = u.searchParams.get("status"),
        date = u.searchParams.get("date"),
        q = u.searchParams.get("q") || "",
        page = Number(u.searchParams.get("page") || 1);
      if (
        branch &&
        !memberships.some((m) => m.branch_id === branch || m.role === "owner")
      )
        fail(403, "forbidden", "Branch access denied.");
      if (
        (branch && !["s", "p"].includes(branch)) ||
        (status && !STATUSES.includes(status)) ||
        (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) ||
        q.length > 100 ||
        !Number.isInteger(page) ||
        page < 1 ||
        page > 10000
      )
        fail(400, "validation", "Invalid filters.");
      const filters = new URLSearchParams({
        select: "*",
        order: "created_at.desc",
        limit: "51",
        offset: String((page - 1) * 50),
      });
      if (branch) filters.set("branch_id", "eq." + branch);
      if (status) filters.set("status", "eq." + status);
      if (date) filters.set("preferred_date", "eq." + date);
      if (q) {
        const safe = q.replace(/[^\p{L}\p{N} +]/gu, "");
        filters.set(
          "or",
          `(customer_name.ilike.*${safe}*,customer_phone.ilike.*${safe}*,reference.ilike.*${safe}*)`,
        );
      }
      if (
        [
          "/api/staff/bookings",
          "/api/staff/customers",
          "/api/staff/export",
        ].includes(p) &&
        req.method === "GET"
      ) {
        if (p.endsWith("/export")) {
          filters.set("limit", "1000");
          const rows = [];
          for (let offset = 0; offset <= 10000; offset += 1000) {
            filters.set("offset", String(offset));
            const chunk = await db("bookings?" + filters, {}, token);
            rows.push(...chunk);
            if (rows.length > 10000)
              fail(400, "export_limit", "Narrow export filters.");
            if (chunk.length < 1000) break;
          }
          return new Response(csv(rows), {
            headers: {
              "content-type": "text/csv; charset=utf-8",
              "cache-control": "no-store",
              "content-disposition": 'attachment; filename="bookings.csv"',
              "x-content-type-options": "nosniff",
            },
          });
        }
        const data = p.endsWith("/customers")
          ? await db(
              "rpc/list_customers",
              {
                method: "POST",
                body: JSON.stringify({
                  p_branch: branch || null,
                  p_q: q,
                  p_page: page,
                }),
              },
              token,
            )
          : await db("bookings?" + filters, {}, token);
        return json({
          items: data.slice(0, 50),
          page,
          pageSize: 50,
          hasMore: data.length > 50,
        });
      }
      const m = p.match(
        /^\/api\/staff\/bookings\/([\da-f-]{36})(?:\/(events|notes))?$/i,
      );
      if (!m) fail(404, "not_found", "Endpoint not found.");
      if (m[2] === "events" && req.method === "GET")
        return json({
          items: await db(
            "booking_events?booking_id=eq." + m[1] + "&order=created_at.asc",
            {},
            token,
          ),
        });
      if (
        (req.method === "PATCH" && !m[2]) ||
        (req.method === "POST" && m[2] === "notes")
      ) {
        const b = await body(req);
        if (!Number.isInteger(b.version) || b.version < 1)
          fail(400, "validation", "Expected version required.");
        if (m[2] === "notes") {
          if (
            typeof b.note !== "string" ||
            !b.note.trim() ||
            b.note.length > 2000
          )
            fail(400, "validation", "Invalid note.");
        } else if (
          !STATUSES.includes(b.status) ||
          (b.internalNote != null &&
            (typeof b.internalNote !== "string" ||
              b.internalNote.length > 2000)) ||
          (b.appointmentAt != null &&
            (typeof b.appointmentAt !== "string" ||
              !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(
                b.appointmentAt,
              ) ||
              !Number.isFinite(Date.parse(b.appointmentAt))))
        )
          fail(400, "validation", "Invalid update.");
        return json(
          await db(
            "rpc/update_booking",
            {
              method: "POST",
              body: JSON.stringify({
                p_id: m[1],
                p_version: b.version,
                p_status: m[2] === "notes" ? null : b.status,
                p_appointment: b.appointmentAt || null,
                p_note: (m[2] === "notes" ? b.note : b.internalNote) || null,
              }),
            },
            token,
          ),
        );
      }
      fail(405, "method", "Method not allowed.");
    } catch (e) {
      return json(
        {
          error: {
            code: e instanceof ApiError ? e.code : "unavailable",
            message:
              e instanceof ApiError
                ? e.message
                : "Service temporarily unavailable.",
          },
        },
        e instanceof ApiError ? e.status : 503,
      );
    }
  };
}
export default { fetch: createHandler() };

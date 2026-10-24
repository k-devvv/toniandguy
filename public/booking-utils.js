export function normalizePhone(value) {
  const raw = String(value ?? "").trim();
  if (!/^[+\d ()-]+$/.test(raw)) return null;
  let digits = raw.replace(/[ ()-]/g, "");
  if (/^\+91[6-9]\d{9}$/.test(digits)) return digits;
  if (/^91[6-9]\d{9}$/.test(digits)) return "+" + digits;
  if (/^[6-9]\d{9}$/.test(digits)) return "+91" + digits;
  return null;
}
export function localDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (name) => parts.find((p) => p.type === name).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export function preferredDays(now = new Date(), count = 10) {
  const base = new Date(localDate(now) + "T12:00:00+05:30");
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(base.getTime() + (i + 1) * 86400000);
    return [
      localDate(date),
      new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "short",
        day: "numeric",
        month: "short",
      }).format(date),
    ];
  });
}
export function resetDependentChoices(booking, key, value) {
  if (booking[key] === value) return;
  if (key === "loc")
    for (const field of ["svc", "sty", "date", "win"]) delete booking[field];
  if (key === "svc")
    for (const field of ["sty", "date", "win"]) delete booking[field];
  booking[key] = value;
  delete booking.idempotencyKey;
  delete booking.payloadSignature;
}
export async function sendBooking(
  payload,
  { fetcher = fetch, timeout = 15000 } = {},
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetcher("/api/booking-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(
        result.error?.message ||
          "Request could not be saved. Please try again.",
      );
    if (!result.reference || result.status !== "pending")
      throw new Error(
        "Server response was incomplete. Please retry with the same details.",
      );
    return result;
  } catch (error) {
    if (error.name === "AbortError")
      throw new Error(
        "Connection timed out. Your request may have been saved. Retry with the same details to recover its reference.",
      );
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

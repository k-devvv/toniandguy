import { test } from "node:test";
import assert from "node:assert/strict";
import { parseHTML } from "linkedom";
import { createAnalytics, analyticsPayload } from "../public/analytics.js";
const key = "tg-analytics-consent-v1";
function setup({ saved, navigator = {}, host = "toniandguybangalore.in", pathname = "/" } = {}) {
  const dom = parseHTML('<html><head></head><body><footer><div class="wrap"></div></footer></body></html>');
  const values = new Map(saved ? [[key, JSON.stringify(saved)]] : []);
  let reloads = 0;
  const window = { location: { hostname: host, pathname, reload: () => reloads++ }, navigator,
    localStorage: { getItem: k => values.get(k), setItem: (k, v) => values.set(k, v) } };
  const client = createAnalytics({ window, document: dom.document, routes: ["home", "services", "book"], now: () => 1000 });
  return { document: dom.document, Event: dom.Event, window, client, values, reloads: () => reloads, events: () => (window.dataLayer || []).filter(x => x.event === "salon_event") };
}
test("Google never loads or receives events before analytics consent", () => {
  const s = setup(); s.client.page("home", "Home"); s.client.action("booking_request", "s");
  assert.equal(s.document.querySelectorAll('script[src*="googletagmanager"]').length, 0);
  assert.equal(s.window.dataLayer, undefined);
  assert.ok(s.document.getElementById("analytics-consent"));
  s.client.choose("denied");
  assert.equal(s.events().length, 0);
  assert.equal(JSON.parse(s.values.get(key)).value, "denied");
});
test("consent loads one container, keeps advertising denied, and deduplicates views", () => {
  const s = setup(); s.client.page("services", "Salon services"); s.client.choose("granted");
  s.client.page("services", "Salon services"); s.client.page("book", "Appointment request");
  assert.equal(s.document.querySelectorAll("#salon-gtm").length, 1);
  assert.deepEqual(s.events().map(x => x.analytics_event), ["page_view", "page_view"]);
  const update = s.window.dataLayer.find(x => x[0] === "consent" && x[1] === "update");
  assert.equal(update[2].analytics_storage, "granted");
  assert.equal(update[2].ad_user_data, "denied");
});
test("fixed event payloads discard contact data, WhatsApp URLs and invalid branch values", () => {
  const s = setup(); s.client.page("book", "Request appointment"); s.client.choose("granted");
  const a = s.document.createElement("a");
  a.href = "https://wa.me/918123729873?text=PrivateName%209876543210%20PrivateNote";
  s.document.body.appendChild(a); a.dispatchEvent(new s.Event("click", { bubbles: true }));
  s.client.action("booking_request", "s"); s.client.action("phone_click", "PrivateName");
  const data = JSON.stringify(s.events());
  assert.equal(data.includes("PrivateName"), false);
  assert.equal(data.includes("9876543210"), false);
  assert.equal(data.includes("PrivateNote"), false);
  assert.equal(data.includes("wa.me"), false);
  assert.equal(s.events().at(-1).salon_branch, "");
  assert.equal(analyticsPayload("arbitrary_event", { path: "/book", title: "Booking" }), null);
  assert.equal(analyticsPayload("page_view", { path: "/book?name=PrivateName", title: "Booking" }), null);
});
test("withdrawing consent disables measurement and reloads without replaying events", () => {
  const s = setup(); s.client.page("home", "Home"); s.client.choose("granted");
  const count = s.events().length; s.client.choose("denied"); s.client.action("phone_click");
  assert.equal(s.window["ga-disable-G-MWCQD9CTTC"], true);
  assert.equal(s.reloads(), 1);
  assert.equal(s.events().length, count);
});
test("expired preferences ask again and browser privacy signals override saved grants", () => {
  const expired = setup({ saved: { value: "granted", expires: 999 } });
  assert.ok(expired.document.getElementById("analytics-consent"));
  for (const navigator of [{ globalPrivacyControl: true }, { doNotTrack: "1" }]) {
    const s = setup({ navigator, saved: { value: "granted", expires: 2000 } });
    s.client.page("home", "Home"); s.client.choose("granted");
    assert.equal(s.window.dataLayer, undefined);
  }
});
test("admin, API, unknown hosts and unknown routes cannot emit measurement", () => {
  for (const options of [{ host: "localhost" }, { pathname: "/admin/" }, { pathname: "/api/config" }]) {
    const s = setup(options); s.client.page("home", "Home"); s.client.choose("granted");
    assert.equal(s.window.dataLayer, undefined);
    assert.equal(s.document.getElementById("analytics-consent"), null);
  }
  const s = setup(); s.client.page("service-private-person", "Private"); s.client.choose("granted");
  assert.equal(s.window.dataLayer, undefined);
});

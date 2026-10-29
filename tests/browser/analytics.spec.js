import { test, expect } from "@playwright/test";
async function setup(page) {
  let loads = 0;
  await page.route("**/analytics-config.json", route => route.fulfill({ json: {
    containerId: "GTM-WV9QPHQ2", measurementId: "G-MWCQD9CTTC", allowedHosts: ["127.0.0.1"],
  } }));
  await page.route("https://www.googletagmanager.com/**", route => {
    loads++;
    return route.fulfill({ contentType: "application/javascript", body: "/* isolated tracking test: no Google requests */" });
  });
  await page.route("**/api/config", route => route.fulfill({ json: { bookingEnabled: true, turnstileSiteKey: "test-site" } }));
  await page.route("https://challenges.cloudflare.com/**", route => route.fulfill({ contentType: "application/javascript", body: "window.turnstile={render:(el,o)=>{o.callback('test-token');return 'test';},remove:()=>{}};" }));
  return () => loads;
}
const events = page => page.evaluate(() => (window.dataLayer || []).filter(x => x.event === "salon_event"));
test("rejecting analytics makes no Google requests and does not block booking", async ({ page }) => {
  const loads = await setup(page);
  await page.goto("/book");
  await expect(page.getByRole("region", { name: "Analytics preferences" })).toBeVisible();
  expect(loads()).toBe(0);
  await page.getByRole("button", { name: "Reject analytics", exact: true }).click();
  await page.locator("[data-date]:not([disabled])").first().click();
  await expect(page.locator('[data-time="10:00"]')).toBeEnabled();
  expect(loads()).toBe(0);
  expect(await events(page)).toEqual([]);
  await page.reload();
  await expect(page.getByRole("region", { name: "Analytics preferences" })).toHaveCount(0);
  expect(loads()).toBe(0);
});
test("accepted analytics tracks clean page URLs once and can be withdrawn", async ({ page }) => {
  const loads = await setup(page);
  await page.goto("/services?name=PrivateName");
  await page.getByRole("button", { name: "Allow analytics", exact: true }).click();
  await expect.poll(loads).toBe(1);
  await page.locator(".menu-row-name").first().click();
  expect((await events(page)).map(e => e.analytics_event)).toEqual(["page_view", "page_view"]);
  expect(JSON.stringify(await events(page))).not.toContain("PrivateName");
  expect((await events(page)).at(-1).safe_page_location).toBe("https://toniandguybangalore.in/book");
  await page.getByRole("button", { name: "Analytics preferences", exact: true }).click();
  await page.getByRole("button", { name: "Reject analytics", exact: true }).click();
  await expect(page.locator("#booking-service")).toBeVisible();
  await expect(page.locator("#salon-gtm")).toHaveCount(0);
  expect(loads()).toBe(1);
});
test("saved booking emits one safe event without name, phone, notes or reference", async ({ page }) => {
  await setup(page);
  await page.route("**/api/booking-requests", route => route.fulfill({ status: 201, json: { reference: "TG-PRIVATE-REF", status: "pending" } }));
  await page.goto("/book?service=3-0");
  await page.getByRole("button", { name: "Allow analytics", exact: true }).click();
  await page.locator("[data-date]:not([disabled])").first().click();
  await page.locator('[data-time="10:00"]').click();
  await page.getByLabel("Your name", { exact: true }).fill("PrivateName");
  await page.getByLabel("Mobile / WhatsApp number", { exact: true }).fill("9876543210");
  await page.getByLabel("Note (optional)").fill("PrivateNote");
  await page.locator("#contact-consent").check();
  await page.getByRole("button", { name: "Request appointment ↗", exact: true }).click();
  await expect(page.getByText("Request received · Pending confirmation")).toBeVisible();
  const saved = (await events(page)).filter(e => e.analytics_event === "booking_request");
  expect(saved).toHaveLength(1);
  const payload = JSON.stringify(await events(page));
  for (const value of ["PrivateName", "PrivateNote", "9876543210", "TG-PRIVATE-REF", "service=", "10:00"])
    expect(payload).not.toContain(value);
});

import { test, expect } from "@playwright/test";

test("primary pages have useful HTML without JavaScript, correct metadata and clean links", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const [path, heading] of [["/", "Hair, done properly."], ["/services", "Our menu."], ["/salons/sobha-arcadia", "A proper salon, minutes from home."], ["/salons/prestige-tech-forest", "Sharp before the first meeting."]]) {
    const response = await page.goto((process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:8791") + path);
    expect(response.status()).toBe(200);
    await expect(page.locator("main h1")).toContainText(heading);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://toniandguybangalore.in" + path);
    expect(await page.locator('a[href^="#"]').count()).toBe(0);
    const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
    expect(schema["@graph"].some(x => x["@type"] === "WebPage")).toBe(true);
  }
  await expect(page.locator('a[href="/book"]')).not.toHaveCount(0);
  await context.close();
});

test("unknown addresses return actual 404 with noindex", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist");
  expect(response.status()).toBe(404);
  await expect(page.locator("main h1")).toHaveText("Page not found.");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,follow");
});

test("legacy hashes and booking query survive clean URL migration", async ({ page }) => {
  await page.route("**/api/config", route => route.fulfill({ json: { bookingEnabled: false } }));
  await page.goto("/#book?service=3-0");
  await expect(page).toHaveURL(/\/book\?service=3-0$/);
  await expect(page.locator("#booking-service")).toHaveValue("3-0");
  await page.goto("/#sobha-arcadia");
  await expect(page).toHaveURL(/\/salons\/sobha-arcadia$/);
  await expect(page.locator("main h1")).toContainText("A proper salon, minutes from home.");
});

test("client navigation, history and service-prefilled booking work with clean URLs", async ({ page }) => {
  await page.route("**/api/config", route => route.fulfill({ json: { bookingEnabled: false } }));
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("/services");
  await page.locator('.menu-row-name').first().click();
  await expect(page).toHaveURL(/\/book\?service=0-0$/);
  await expect(page.locator("#booking-service")).toHaveValue("0-0");
  await page.goBack();
  await expect(page).toHaveURL(/\/services$/);
  await expect(page.locator("main h1")).toHaveText("Our menu.");
  await page.goForward();
  await expect(page.locator("#booking-service")).toHaveValue("0-0");
  await page.reload();
  await expect(page.locator("#booking-service")).toHaveValue("0-0");
  expect(errors).toEqual([]);
});

test("sitemap excludes booking, staff and placeholder reviews", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const xml = await response.text();
  expect(xml).toContain("https://toniandguybangalore.in/services</loc>");
  expect(xml).toContain("/salons/prestige-tech-forest</loc>");
  expect(xml).not.toMatch(/<loc>[^<]*(?:#|\/book|\/admin|\/api|\/voices|\/stylists\/)/);
});

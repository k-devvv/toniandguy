import { test, expect } from "@playwright/test";
const config = {
  supabaseUrl: "https://example.supabase.co",
  supabaseAnonKey: "public-test-key",
  turnstileSiteKey: "test-site",
  bookingEnabled: true,
};
async function setup(page, enabled = true) {
  await page.route("**/api/config", (route) =>
    route.fulfill({ json: { ...config, bookingEnabled: enabled } }),
  );
  await page.route("https://challenges.cloudflare.com/**", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `window.turnstile={render:(el,opts)=>{window._challenge=opts;opts.callback('test-token');return 'widget';},remove:()=>{},reset:()=>window._challenge.callback('test-token')};`,
    }),
  );
}
async function contactStep(page) {
  await page.goto("/#book");
  await page.locator("[data-date]:not([disabled])").first().click();
  await page.locator('[data-time="10:00"]').click();
  await page.locator("#booking-service").selectOption("0-2");
}
test("home loads assets with no JS errors at mobile width", async ({
  page,
}) => {
  await setup(page);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Hair, done properly." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test("booking saves once, shows durable reference, and preserves draft when navigating back", async ({
  page,
}) => {
  await setup(page);
  let submissions = 0;
  await page.route("**/api/booking-requests", async (route) => {
    submissions++;
    const body = route.request().postDataJSON();
    expect(body.customerPhone).toBe("+919876543210");
    expect(body.contactConsent).toBe(true);
    await new Promise((r) => setTimeout(r, 150));
    await route.fulfill({
      status: 201,
      json: { reference: "TG-SAVED-001", status: "pending" },
    });
  });
  await contactStep(page);
  await page.getByLabel("Your name", { exact: true }).fill("Test Customer");
  await page
    .getByLabel("Mobile / WhatsApp number", { exact: true })
    .fill("9876543210");
  await page.locator("#month-next").click();
  await page.locator("#month-prev").click();
  await expect(page.getByLabel("Your name", { exact: true })).toHaveValue(
    "Test Customer",
  );
  await page.locator("#contact-consent").check();
  await page
    .getByRole("button", { name: "Request appointment ↗", exact: true })
    .click();
  await expect(
    page.getByText("Request received · Pending confirmation"),
  ).toBeVisible();
  await expect(page.locator(".booking-panel").first()).toContainText(
    "TG-SAVED-001",
  );
  expect(submissions).toBe(1);
});
test("database failure keeps entered details and never shows success", async ({
  page,
}) => {
  await setup(page);
  await page.route("**/api/booking-requests", (route) =>
    route.fulfill({
      status: 503,
      json: {
        error: {
          code: "DATABASE_UNAVAILABLE",
          message: "Booking service unavailable. Please retry.",
        },
      },
    }),
  );
  await contactStep(page);
  await page
    .getByLabel("Your name", { exact: true })
    .fill("<script>Test</script>");
  await page
    .getByLabel("Mobile / WhatsApp number", { exact: true })
    .fill("9876543210");
  await page.locator("#contact-consent").check();
  await page
    .getByRole("button", { name: "Request appointment ↗", exact: true })
    .click();
  await expect(page.locator("#err")).toContainText("unavailable");
  await expect(page.getByLabel("Your name", { exact: true })).toHaveValue(
    "<script>Test</script>",
  );
  await expect(
    page.getByText("Request received · Pending confirmation"),
  ).toHaveCount(0);
});
test("malformed phone and absent consent cannot submit", async ({ page }) => {
  await setup(page);
  let calls = 0;
  await page.route("**/api/booking-requests", (route) => {
    calls++;
    return route.abort();
  });
  await contactStep(page);
  await page.getByLabel("Your name", { exact: true }).fill("Customer");
  await page
    .getByLabel("Mobile / WhatsApp number", { exact: true })
    .fill("999919876543210");
  await page
    .getByRole("button", { name: "Request appointment ↗", exact: true })
    .click();
  await expect(page.locator("#err")).toContainText("valid Indian");
  await page
    .getByLabel("Mobile / WhatsApp number", { exact: true })
    .fill("9876543210");
  await page
    .getByRole("button", { name: "Request appointment ↗", exact: true })
    .click();
  await expect(page.locator("#err")).toContainText("agree");
  expect(calls).toBe(0);
});
test("unconfigured booking service disables submission", async ({ page }) => {
  await setup(page, false);
  await contactStep(page);
  await expect(
    page.getByRole("button", { name: "Request appointment ↗", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText(
      "Online setup is in progress. Call or WhatsApp to book now.",
    ),
  ).toBeVisible();
});
test("staff login, list and hostile customer name render as text; signout clears records", async ({
  page,
}) => {
  await setup(page);
  const item = {
    id: "11111111-1111-4111-8111-111111111111",
    reference: "TG-STAFF",
    branch_id: "s",
    customer_name: "<img src=x onerror=alert(1)>",
    customer_phone: "+919876543210",
    preferred_date: "2026-11-01",
    preferred_window: "am",
    service_id: "cut",
    notes: "<script>alert(1)</script>",
    status: "pending",
    version: 1,
    created_at: "2026-10-23T06:00:00Z",
  };
  await page.route("https://example.supabase.co/auth/v1/**", (route) =>
    route.fulfill({
      json: { access_token: "mock-access", refresh_token: "mock-refresh" },
    }),
  );
  await page.route("**/api/staff/me", (route) =>
    route.fulfill({
      json: {
        user: { id: "staff", email: "staff@example.com" },
        memberships: [{ branch_id: "s", role: "staff" }],
      },
    }),
  );
  await page.route("**/api/staff/bookings?*", (route) =>
    route.fulfill({ json: { items: [item], page: 1, hasMore: false } }),
  );
  await page.route("**/api/staff/bookings/*/events", (route) =>
    route.fulfill({ json: { items: [] } }),
  );
  await page.goto("/admin/");
  await page.getByLabel("Email", { exact: true }).fill("staff@example.com");
  await page.getByLabel("Password", { exact: true }).fill("mock-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator("#results")).toContainText(item.customer_name);
  await page.locator(".record").click();
  await expect(page.locator("#detail")).toContainText(item.notes);
  expect(await page.locator("#detail script").count()).toBe(0);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.locator("#desk")).toBeHidden();
  await expect(page.locator("#results")).toBeEmpty();
});
test("logout during token refresh cannot restore session or retry staff requests", async ({
  page,
}) => {
  await setup(page);
  let refreshRoute, refreshStartedResolve;
  const refreshStarted = new Promise((resolve) => {
    refreshStartedResolve = resolve;
  });
  let listCalls = 0;
  await page.route("https://example.supabase.co/auth/v1/**", async (route) => {
    if (route.request().url().includes("grant_type=refresh_token")) {
      refreshRoute = route;
      refreshStartedResolve();
      return;
    }
    return route.fulfill({
      json: { access_token: "mock-access", refresh_token: "mock-refresh" },
    });
  });
  await page.route("**/api/staff/me", (route) =>
    route.fulfill({
      json: {
        user: { id: "staff", email: "staff@example.com" },
        memberships: [{ branch_id: "s", role: "staff" }],
      },
    }),
  );
  await page.route("**/api/staff/bookings?*", (route) => {
    listCalls++;
    return route.fulfill(
      listCalls === 1
        ? { json: { items: [], hasMore: false } }
        : { status: 401, json: { error: { message: "Expired" } } },
    );
  });
  await page.goto("/admin/");
  await page.getByLabel("Email", { exact: true }).fill("staff@example.com");
  await page.getByLabel("Password", { exact: true }).fill("mock-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("No matching records.")).toBeVisible();
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await refreshStarted;
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await refreshRoute.fulfill({
    json: { access_token: "new-access", refresh_token: "new-refresh" },
  });
  await expect(page.locator("#notice")).toContainText("Signed out");
  expect(
    await page.evaluate(() => sessionStorage.getItem("tg-staff-session")),
  ).toBe(null);
  await expect(page.locator("#desk")).toBeHidden();
  expect(listCalls).toBe(2);
});
test("stale refresh cannot sign out a newly logged-in staff session", async ({
  page,
}) => {
  await setup(page);
  let held, startedResolve;
  const started = new Promise((r) => (startedResolve = r));
  let lists = 0,
    logins = 0;
  await page.route("https://example.supabase.co/auth/v1/**", (route) => {
    if (route.request().url().includes("grant_type=refresh_token")) {
      held = route;
      startedResolve();
      return;
    }
    if (route.request().url().includes("/logout"))
      return route.fulfill({ json: {} });
    logins++;
    return route.fulfill({
      json: {
        access_token: "access-" + logins,
        refresh_token: "refresh-" + logins,
      },
    });
  });
  await page.route("**/api/staff/me", (route) =>
    route.fulfill({
      json: {
        user: { id: "staff", email: "staff@example.com" },
        memberships: [{ branch_id: "s", role: "staff" }],
      },
    }),
  );
  await page.route("**/api/staff/bookings?*", (route) => {
    lists++;
    return route.fulfill(
      lists === 2
        ? { status: 401, json: { error: { message: "Expired" } } }
        : { json: { items: [], hasMore: false } },
    );
  });
  const login = async () => {
    await page.getByLabel("Email", { exact: true }).fill("staff@example.com");
    await page.getByLabel("Password", { exact: true }).fill("mock-password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByText("No matching records.")).toBeVisible();
  };
  await page.goto("/admin/");
  await login();
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await started;
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await login();
  await held.fulfill({
    json: { access_token: "stale-access", refresh_token: "stale-refresh" },
  });
  await expect(page.locator("#desk")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(sessionStorage.getItem("tg-staff-session"))?.access_token,
      ),
    )
    .toBe("access-2");
  expect(lists).toBe(3);
});

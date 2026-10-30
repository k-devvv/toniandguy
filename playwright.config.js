import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:8791", headless: true },
  webServer: process.env.PLAYWRIGHT_EXTERNAL_SERVER ? undefined : {
    command: "npx wrangler dev --ip 127.0.0.1 --port 8791",
    url: "http://127.0.0.1:8791/api/config",
    reuseExistingServer: false,
    timeout: 90000,
  },
});

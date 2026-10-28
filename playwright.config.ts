import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  use: { baseURL, trace: "on-first-retry" },
  webServer: {
    // Match the production bundler; Turbopack's cold compilation can exceed
    // the startup timeout on the local filesystem used for smoke tests.
    command: "npm run dev -- --webpack --hostname 127.0.0.1 --port 3100",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    // Never reuse a developer's server or let .env.local connect smoke tests
    // to hosted services. These guest flows do not require a database.
    env: {
      NEXT_TELEMETRY_DISABLED: "1",
      NEXT_PUBLIC_BETA_MODE: process.env.NEXT_PUBLIC_BETA_MODE ?? "true",
      NEXT_PUBLIC_APP_URL: baseURL,
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54399",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "smoke-test-placeholder",
      SUPABASE_SERVICE_ROLE_KEY: "",
      ADMIN_EMAILS: "",
      GROQ_API_KEY: "",
      JOBS_SECRET: "",
      STRIPE_SECRET_KEY: "",
      STRIPE_WEBHOOK_SECRET: "",
    },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});

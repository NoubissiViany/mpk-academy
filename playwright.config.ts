import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:3100";
const useProductionBuild = process.env.MPK_E2E_USE_BUILD === "1";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  use: { baseURL, trace: "on-first-retry" },
  webServer: {
    // Build with the same isolated environment and beta mode before opting in.
    // Production mode avoids development compilation during browser checks.
    command: useProductionBuild
      ? "npm run start -- --hostname 127.0.0.1 --port 3100"
      : "npm run dev -- --webpack --hostname 127.0.0.1 --port 3100",
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

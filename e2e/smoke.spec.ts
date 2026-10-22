import { expect, test } from "@playwright/test";

const betaMode = process.env.NEXT_PUBLIC_BETA_MODE !== "false";

// Opt out of the anonymous funnel counts so test runs never inflate the
// numbers in /admin, even when .env.local points at the hosted database.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "globalPrivacyControl", {
      get: () => true,
    }),
  );
});

async function completeGuestAssessment(page: import("@playwright/test").Page) {
  const start = page.getByRole("button", { name: "Start my assessment" });
  await expect(start).toBeDisabled();
  await page.getByLabel("Prepare for TEF Canada").check();
  await page.getByLabel("NCLC 7").check();
  await page.getByLabel("I know some French").check();
  await start.click();

  const progress = page.getByText(/^Question 1 of \d+$/);
  await expect(progress).toBeVisible();
  const total = Number((await progress.textContent())!.split(" of ")[1]);
  for (let index = 1; index <= total; index += 1) {
    await expect(page.getByText(`Question ${index} of ${total}`)).toBeVisible();
    const radio = page.locator('input[type="radio"]').first();
    if (await radio.count())
      await radio.evaluate((element: HTMLInputElement) => element.click());
    else await page.getByPlaceholder("Votre réponse").fill("lirais");
    await page
      .getByRole("button", {
        name: index === total ? "Finish assessment" : "Next",
        exact: true,
      })
      .click();
  }
}

async function expectGuestAssessmentStored(
  page: import("@playwright/test").Page,
) {
  const storedGuest = await page.evaluate(() =>
    JSON.parse(
      localStorage.getItem("mpk-academy:guest-assessment:v2") ?? "null",
    ),
  );
  expect(storedGuest).toMatchObject({
    status: "active",
    intake: { goal: "TEF Canada", target: "NCLC 7" },
  });
  expect(Object.keys(storedGuest.answers)).toHaveLength(20);
  expect(Date.parse(storedGuest.expiresAt)).toBeGreaterThan(Date.now());
}

test("student routes require a verified Supabase session", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/practice/session?skill=listening&count=10");
  await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  await expect(
    page.getByRole("heading", { name: "Continue your preparation." }),
  ).toBeVisible();
});

test("the landing sample is checked by the server", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/");
  const sample = page.getByRole("region", {
    name: "See how MPK practice works",
  });
  await sample.locator('input[type="radio"]').first().check({ force: true });
  await sample.getByRole("button", { name: "Check answer" }).click();
  await expect(sample.getByRole("status")).toBeVisible({ timeout: 15_000 });
});

test("the interface switches to French", async ({ page }) => {
  await page.goto("/");
  const menu = page.getByRole("button", { name: "Open navigation" });
  if (await menu.isVisible()) await menu.click();
  await page
    .getByRole("group", { name: "Application language" })
    .filter({ visible: true })
    .getByRole("button", { name: /^(fr|Français)$/ })
    .click();
  await expect(
    page.getByRole("link", { name: "Commencer l’évaluation gratuite" }).first(),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
});

test("admin tools are invisible to visitors", async ({ page }) => {
  const response = await page.goto("/admin");
  expect(response?.status()).toBe(404);
});

test.describe("closed beta", () => {
  test.skip(!betaMode, "Runs when beta mode is on.");

  test("a guest assessment continues to beta registration", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.goto("/diagnostic");
    await completeGuestAssessment(page);
    await expect(page).toHaveURL(/diagnostic\/results/, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: "Your French Assessment" }),
    ).toBeVisible();
    await expect(page.getByText(/Listening — Not assessed yet/)).toBeVisible();
    await expect(
      page.getByText(/Provisional MPK estimate based on 16/),
    ).toBeVisible();
    await expect(page.getByText(/\$\d/)).toHaveCount(0);

    await page.getByRole("link", { name: /Create my beta account/ }).click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByLabel(/Invite code/)).toBeVisible();
    await expect(page.getByRole("checkbox")).not.toBeChecked();
    await expect(page.getByLabel("What are you preparing for?")).toHaveValue(
      "TEF Canada",
    );
    await expectGuestAssessmentStored(page);
  });

  test("pricing and checkout do not exist during the beta", async ({
    page,
  }) => {
    for (const path of [
      "/pricing",
      "/choose-plan",
      "/checkout?plan=complete",
    ]) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(404);
    }
  });
});

test.describe("paid mode", () => {
  test.skip(betaMode, "Runs with NEXT_PUBLIC_BETA_MODE=false.");

  test("guest assessment is retained for the registration handoff", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.goto("/diagnostic");
    await completeGuestAssessment(page);
    await expect(page).toHaveURL(/diagnostic\/results/, { timeout: 15_000 });
    const recommendation = page.getByLabel("Recommended plan: Complete");
    await expect(recommendation).toBeVisible();
    await recommendation
      .getByRole("link", { name: "Continue with Complete" })
      .click();
    await expect(page).toHaveURL(/register\?plan=complete/);
    await expectGuestAssessmentStored(page);
  });

  test("paid plans remain visible while checkout requires an account", async ({
    page,
  }) => {
    await page.goto("/checkout?plan=complete");
    await expect(
      page.getByRole("heading", { name: "Complete plan" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Create account" }),
    ).toHaveAttribute("href", "/register?plan=complete");
  });

  test("the retired Intensive plan is no longer offered", async ({ page }) => {
    await page.goto("/choose-plan");
    await expect(
      page.getByRole("link", { name: "Choose Complete" }),
    ).toBeVisible();
    await expect(page.getByText("Intensive")).toHaveCount(0);
  });
});

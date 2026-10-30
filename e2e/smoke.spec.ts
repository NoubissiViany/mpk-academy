import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import audioManifest from "../src/content/audio-manifest.json";

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
        name: index === total ? "Continue to writing" : "Next",
        exact: true,
      })
      .click();
  }
  const finish = page.getByRole("button", {
    name: "Finish assessment",
    exact: true,
  });
  await expect(finish).toBeDisabled();
  const writing = page.getByLabel("Your message in French");
  await writing.fill("mot ".repeat(79));
  await expect(finish).toBeDisabled();
  await writing.fill("mot ".repeat(121));
  await expect(finish).toBeDisabled();
  await writing.fill(
    Array.from(
      { length: 10 },
      () => "Samedi nous avons participé ensemble à une activité intéressante.",
    ).join(" "),
  );
  await finish.click();
  return total;
}

async function expectGuestAssessmentStored(
  page: import("@playwright/test").Page,
  questionCount: number,
) {
  const storedGuest = await page.evaluate(() =>
    JSON.parse(
      localStorage.getItem("mpk-academy:guest-assessment:v2") ?? "null",
    ),
  );
  expect(storedGuest).toMatchObject({
    status: "active",
    intake: {
      goal: "TEF Canada",
      target: "NCLC 7",
      writingSample: {
        version: "mpk-diagnostic-writing-v1",
        text: expect.any(String),
      },
    },
  });
  expect(Object.keys(storedGuest.answers)).toHaveLength(questionCount);
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

  await sample.getByRole("button", { name: "Next question" }).click();
  const audio = sample.locator("audio");
  await expect(audio).toBeVisible();
  await expect
    .poll(() =>
      audio.evaluate((element: HTMLAudioElement) => element.readyState),
    )
    .toBeGreaterThan(0);
  const source = await audio.getAttribute("src");
  expect(source).toMatch(/^\/audio\/[a-f0-9]+\.mp3$/);
  const clip = await page.request.get(source!);
  expect(clip.ok()).toBe(true);
  expect(clip.headers()["content-type"]).toContain("audio/mpeg");
  expect((await clip.body()).length).toBeGreaterThan(1000);
  await expect(sample.getByText("Read what was said")).toHaveCount(0);
  await expect(sample.getByText(/Bonjour, je vous appelle/)).toHaveCount(0);

  await sample.locator('input[type="radio"]').first().check({ force: true });
  await sample.getByRole("button", { name: "Check answer" }).click();
  await sample.getByText("Read what was said").click();
  await expect(sample.getByText(/Bonjour, je vous appelle/)).toBeVisible();
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

test("public listening and model-answer clips are served intact", async ({
  request,
}) => {
  for (const [id, clip] of Object.entries(audioManifest)) {
    if (!clip.path.startsWith("/audio/")) continue;
    const response = await request.get(clip.path);
    expect(response.ok(), id).toBe(true);
    expect(response.headers()["content-type"], id).toContain("audio/mpeg");
    expect(response.headers()["cache-control"], id).toContain("immutable");
    const expected = readFileSync(resolve("public", clip.path.slice(1)));
    expect((await response.body()).equals(expected), id).toBe(true);
  }
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
    const questionCount = await completeGuestAssessment(page);
    await expect(page).toHaveURL(/diagnostic\/results/, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: "Your French Assessment" }),
    ).toBeVisible();
    await expect(
      page.getByRole("progressbar", { name: /^Listening:/ }),
    ).toBeVisible();
    await expect(page.getByText(/Listening — Not assessed yet/)).toHaveCount(0);
    await expect(
      page.getByText(
        new RegExp(`Provisional MPK estimate based on ${questionCount} `),
      ),
    ).toBeVisible();
    await expect(page.getByText(/\$\d/)).toHaveCount(0);

    await page.getByRole("link", { name: /Create my beta account/ }).click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByLabel(/Invite code/)).toBeVisible();
    await expect(page.getByRole("checkbox")).not.toBeChecked();
    await expect(page.getByLabel("What are you preparing for?")).toHaveValue(
      "TEF Canada",
    );
    await expectGuestAssessmentStored(page, questionCount);
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
    const questionCount = await completeGuestAssessment(page);
    await expect(page).toHaveURL(/diagnostic\/results/, { timeout: 15_000 });
    await expect(page.getByText("Recommended for you")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Complete", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("progressbar", { name: /^Listening:/ }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Continue with Complete" }).click();
    await expect(page).toHaveURL(/register\?plan=complete/);
    await expectGuestAssessmentStored(page, questionCount);
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

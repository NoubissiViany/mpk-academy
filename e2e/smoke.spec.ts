import { expect, test } from "@playwright/test";
import { demoState } from "../src/test/fixtures";

async function seedDemoSession(page: import("@playwright/test").Page) {
  await page.addInitScript((state) => {
    if (localStorage.getItem("mpk-academy:storage-version")) return;
    localStorage.setItem("mpk-academy:storage-version", "2");
    localStorage.setItem(
      "mpk-academy:session:v1",
      JSON.stringify({
        userId: state.user!.id,
        createdAt: "2026-09-15T12:00:00.000Z",
      }),
    );
    localStorage.setItem(
      `mpk-academy:user-state:v1:${state.user!.id}`,
      JSON.stringify(state),
    );
  }, demoState);
}

test("landing and the three-step assessment are navigable", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Prepare for TEF\/TCF/ }),
  ).toBeVisible();
  await expect(page.getByText("THE MPK LEARNING LOOP")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Prepare for every part of your exam" }),
  ).toBeVisible();
  for (const skill of ["Reading", "Listening", "Writing", "Speaking"])
    await expect(
      page.getByRole("heading", { name: skill, exact: true }),
    ).toBeVisible();
  const journey = page.locator("#how-it-works");
  for (const step of ["Assess", "Learn", "Practice", "Simulate", "Adapt"])
    await expect(
      journey.getByRole("heading", { name: step, exact: true }),
    ).toBeVisible();
  const plans = page.locator("#plans");
  const comparison = plans.getByRole("region", { name: "MPK Academy plans" });
  await expect(comparison.getByRole("table")).toHaveCount(0);
  for (const plan of ["Free", "Essential", "Complete", "Intensive"]) {
    await expect(
      comparison.getByRole("article", { name: `${plan} plan` }),
    ).toBeVisible();
  }
  for (const bestFor of [
    "Discover your current level and weaknesses.",
    "Build your French foundations across all four skills.",
    "Full personalized preparation from lessons to mock exams.",
    "Candidates near exam day or preparing for a retake.",
  ]) {
    await expect(comparison.getByText(bestFor, { exact: true })).toBeVisible();
  }
  await expect(
    comparison.getByRole("article", { name: "Complete plan" }),
  ).toHaveClass(/ring-primary/);
  expect(
    await comparison.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  await expect(
    page
      .getByRole("navigation", { name: "Main navigation" })
      .getByText("Program"),
  ).toHaveCount(0);
  await page
    .getByRole("link", { name: "Start free assessment" })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Check your French level" }),
  ).toBeVisible();

  const start = page.getByRole("button", { name: "Start my assessment" });
  await expect(start).toBeDisabled();
  await page.getByLabel("Prepare for TEF Canada").check();
  await page.getByLabel("NCLC 7").check();
  await page.getByLabel("I know some French").check();
  await start.click();

  for (let index = 1; index <= 15; index += 1) {
    await expect(page.getByText(`Question ${index} of 15`)).toBeVisible();
    const radio = page.locator(`input[type="radio"][name="d${index}"]`).first();
    if (await radio.count()) await radio.check({ force: true });
    else await page.getByPlaceholder("Votre réponse").fill("lirais");
    await page
      .getByRole("button", {
        name: index === 15 ? "Finish assessment" : "Next",
      })
      .click();
  }

  await expect(page).toHaveURL(/diagnostic\/results/);
  await expect(
    page.getByRole("heading", { name: "Your French Assessment" }),
  ).toBeVisible();
  await expect(page.getByText("Your skills")).toBeVisible();
  const recommendation = page.getByLabel("Recommended plan: Complete");
  await expect(recommendation).toBeVisible();
  await expect(recommendation.getByText("~$249")).toBeVisible();
  await expect(
    recommendation.getByRole("link", { name: "Compare all plans" }),
  ).toHaveAttribute("href", "/pricing");
  const continueWithPlan = recommendation.getByRole("link", {
    name: "Continue with Complete",
  });
  await expect(continueWithPlan).toHaveAttribute(
    "href",
    "/register?plan=complete",
  );
  await continueWithPlan.click();
  await expect(page).toHaveURL(/\/register\?plan=complete/);
  await expect(page.getByLabel("What are you preparing for?")).toHaveValue(
    "TEF Canada",
  );
  await expect(page.getByLabel("What result are you aiming for?")).toHaveValue(
    "NCLC 7",
  );
  await page.getByLabel("Email").fill("assessment-student@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByLabel("First name").fill("Amina");
  await page.getByLabel("Last name").fill("Diallo");
  await page.getByRole("button", { name: "Create my learning plan" }).click();
  await expect(page).toHaveURL(/\/checkout\?plan=complete/);
  await expect(
    page.getByRole("heading", { name: "Complete plan" }),
  ).toBeVisible();
  await expect(page.getByText("~$249", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByText(/Full personalized TEF\/TCF preparation/).first(),
  ).toBeVisible();

  const persisted = await page.evaluate(() => {
    const session = JSON.parse(
      localStorage.getItem("mpk-academy:session:v1") ?? "{}",
    );
    const state = JSON.parse(
      localStorage.getItem(`mpk-academy:user-state:v1:${session.userId}`) ??
        "{}",
    );
    return {
      email: state.user?.email,
      intake: state.diagnosticIntake,
      answerCount: Object.keys(state.diagnosticAnswers ?? {}).length,
      result: state.diagnosticResult,
      diagnosticScore: state.progress?.diagnosticScore,
      competencyScores: state.progress?.competencyScores,
      completedLessonCount: state.progress?.completedLessonIds?.length,
      mistakeCount: state.mistakes?.length,
      writingScore:
        state.examProfiles?.["TEF Canada"]?.skills?.writing?.current,
      speakingScore:
        state.examProfiles?.["TEF Canada"]?.skills?.speaking?.current,
      readiness: state.examProfiles?.["TEF Canada"]?.readiness,
      readinessSource: state.examProfiles?.["TEF Canada"]?.readinessSource,
      hasAssessmentActivity: state.activities?.some(
        (activity: { label?: string }) =>
          activity.label === "Assessment completed",
      ),
      guestSession: localStorage.getItem("mpk-academy:guest-assessment:v1"),
    };
  });
  expect(persisted.email).toBe("assessment-student@example.com");
  expect(persisted.intake).toMatchObject({
    goal: "TEF Canada",
    target: "NCLC 7",
    frenchExperience: "I know some French",
  });
  expect(persisted.answerCount).toBe(15);
  expect(persisted.result).toMatchObject({
    score: expect.any(Number),
    level: expect.any(String),
    priority: expect.any(String),
  });
  expect(persisted.diagnosticScore).toBe(persisted.result.score);
  expect(Object.keys(persisted.competencyScores)).not.toHaveLength(0);
  expect(persisted.completedLessonCount).toBe(0);
  expect(persisted.mistakeCount).toBe(0);
  expect(persisted.writingScore).toBeNull();
  expect(persisted.speakingScore).toBeNull();
  expect(persisted.readiness).toBe(persisted.result.score);
  expect(persisted.readinessSource).toBe("diagnostic");
  expect(persisted.hasAssessmentActivity).toBe(true);
  expect(persisted.guestSession).toBeNull();

  await page
    .getByRole("button", { name: "Continue to secure payment" })
    .click();
  await expect(page).toHaveURL(/checkout\/success\?plan=complete/);
  await page.getByRole("link", { name: "Go to dashboard" }).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(
    page.getByRole("heading", {
      name: "Welcome to MPK Academy, Amina",
    }),
  ).toBeVisible();
  await expect(page.getByText("RECOMMENDED NEXT")).toHaveCount(1);
  await expect(
    page.getByRole("link", { name: "Start recommended activity" }),
  ).toBeVisible();
  await expect(page.getByText("Complete Plan")).toBeVisible();
  await expect(page.getByText(/Access until/)).toBeVisible();
  await expect(page.getByText("Not assessed yet")).toHaveCount(2);

  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Welcome back, Amina" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Welcome to MPK Academy, Amina",
    }),
  ).toHaveCount(0);

  if (await page.getByRole("button", { name: "Open navigation" }).isVisible())
    await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/login");
  await page.getByLabel("Email").fill("assessment-student@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(
    page.getByRole("heading", { name: "Welcome back, Amina" }),
  ).toBeVisible();
  await expect(page.getByText("Complete Plan")).toBeVisible();
});

test("the deleted program route is unlinked and unavailable", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Explore plans" }).click();
  await expect(page).toHaveURL(/pricing/);
  const pricingComparison = page.getByRole("region", {
    name: "MPK Academy plans",
  });
  await expect(
    pricingComparison.getByText(
      "Full personalized preparation from lessons to mock exams.",
    ),
  ).toBeVisible();
  await expect(pricingComparison.getByRole("article")).toHaveCount(4);
  await expect(pricingComparison.getByRole("table")).toHaveCount(0);
  await expect(
    pricingComparison.getByRole("link", { name: "Start free assessment" }),
  ).toHaveAttribute("href", "/diagnostic");
  await expect(
    pricingComparison.getByRole("link", { name: "Choose Intensive" }),
  ).toHaveAttribute("href", "/checkout?plan=intensive");
  const response = await page.goto("/program");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", {
      name: "That page is not part of the learning plan.",
    }),
  ).toBeVisible();
});

test("student routes require a local session", async ({ page }) => {
  await page.goto("/practice/session?skill=listening&count=10");
  await expect(page).toHaveURL(
    /\/login\?next=%2Fpractice%2Fsession%3Fskill%3Dlistening%26count%3D10/,
  );
  await expect(
    page.getByRole("heading", { name: "Continue your preparation." }),
  ).toBeVisible();
});

test("exam-centred dashboard, navigation, and preparation modes are distinct", async ({
  page,
}) => {
  await seedDemoSession(page);
  await page.goto("/dashboard");
  await expect(page.getByText("MY EXAM")).toBeVisible();
  await expect(page.getByText("TEF Canada").first()).toBeVisible();
  await expect(page.getByText("Target: NCLC 7")).toBeVisible();
  await expect(page.getByText("YOUR 4 EXAM SKILLS")).toBeVisible();
  await expect(page.getByRole("link", { name: "Certificate" })).toHaveCount(0);
  if (await page.getByRole("button", { name: "Open navigation" }).isVisible())
    await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("link", { name: "Mistakes" })).toBeVisible();
  await page.goto("/learn");
  for (const category of ["Foundations", "Exam Skills", "Exam Strategy"])
    await expect(
      page.getByRole("heading", { name: category, exact: true }),
    ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Recommended lessons" }),
  ).toBeVisible();
  await page.goto("/learn/grammar/grammar-1");
  await expect(page.getByText("Learn with support")).toBeVisible();
  await expect(page.getByText("English explanation")).toBeVisible();
  await page.goto("/practice");
  await expect(page.getByText("54% · Needs attention")).toBeVisible();
  await expect(page.getByText("Specific details")).toBeVisible();
  await expect(page.getByText("Numbers and dates")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Practice recommended weakness" }),
  ).toBeVisible();
  await expect(page.getByText("Coming soon")).toHaveCount(2);
  await page.goto("/practice/session?skill=writing");
  await expect(
    page.getByRole("heading", {
      name: /Corrected writing practice is not available yet/,
    }),
  ).toBeVisible();
  await page.goto("/practice/session?skill=reading");
  await expect(page.getByText("Apply what you learned")).toBeVisible();
  await expect(page.getByText(/TEF Canada · 1 \/ 5/)).toBeVisible();
  await page.goto("/exam");
  await expect(
    page.getByText("This shortened MPK mock is not the official exam."),
  ).toBeVisible();
  await expect(
    page.getByText(/included for rehearsal but are not/),
  ).toBeVisible();
  await page.getByRole("link", { name: "Start mock exam" }).click();
  await expect(page.getByText("French-only environment")).toBeVisible();
  await expect(page.getByText("No hints")).toBeVisible();
  await page.goto("/exam/session");
  await expect(page.getByText(/simulation MPK raccourcie/)).toBeVisible();
});

test("progress, mistakes, profile, and legacy redirect use the active exam", async ({
  page,
}) => {
  await seedDemoSession(page);
  await page.goto("/progress");
  await expect(
    page.getByRole("heading", { name: "Progress", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("52%")).toBeVisible();
  await expect(page.getByText("68%")).toBeVisible();
  await page.goto("/mistakes");
  await expect(
    page.getByRole("heading", { name: "My Mistakes" }),
  ).toBeVisible();
  await expect(page.getByText("Understanding specific details")).toBeVisible();
  await page.getByText("Understanding specific details").click();
  await expect(page).toHaveURL(/mistakes\/m1/);
  await expect(
    page.getByRole("heading", {
      name: "Listening for specific information",
    }),
  ).toBeVisible();
  const practiceWeakness = page.getByRole("link", {
    name: /Practice weakness/,
  });
  await expect(practiceWeakness).toHaveAttribute(
    "href",
    "/practice/session?skill=listening&focus=listening-detail&count=10",
  );
  await practiceWeakness.click();
  await expect(page.getByText(/TEF Canada · 1 \/ 10/)).toBeVisible();
  await expect(page.getByText(/Focus: Specific details/)).toBeVisible();
  await page.goto("/weaknesses");
  await expect(page).toHaveURL(/mistakes/);
  await page.goto("/profile");
  await expect(page.getByText("NCLC 7")).toBeVisible();
});

test("switching exams preserves each independent dashboard", async ({
  page,
}) => {
  await seedDemoSession(page);
  await page.goto("/settings");
  await page.locator('select[name="exam"]').first().selectOption("TCF Canada");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "TCF Canada" })).toBeVisible();
  await expect(page.getByText("Not assessed yet").first()).toBeVisible();

  await page.goto("/settings");
  await page.locator('select[name="exam"]').first().selectOption("TEF Canada");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "TEF Canada" })).toBeVisible();
  await expect(page.getByText("68%").first()).toBeVisible();
});

test("checkout unlocks local paid access", async ({ page }) => {
  await seedDemoSession(page);
  await page.goto("/checkout");
  await page
    .getByRole("button", { name: "Continue to secure payment" })
    .click();
  await expect(page).toHaveURL(/checkout\/success/);
  await expect(
    page.getByRole("heading", { name: "Your Complete plan is unlocked." }),
  ).toBeVisible();
});

test("checkout validates and displays the selected plan", async ({ page }) => {
  for (const [id, name, price] of [
    ["essential", "Essential", "~$119"],
    ["complete", "Complete", "~$249"],
    ["intensive", "Intensive", "~$349"],
  ]) {
    await page.goto(`/checkout?plan=${id}`);
    await expect(
      page.getByRole("heading", { name: `${name} plan` }),
    ).toBeVisible();
    await expect(page.getByText(price, { exact: true }).first()).toBeVisible();
  }

  await page.goto("/checkout?plan=unknown");
  await expect(
    page.getByRole("heading", { name: "Complete plan" }),
  ).toBeVisible();
});

test("authentication preserves a selected plan", async ({ page }) => {
  await page.goto("/register?plan=intensive");
  await page.getByLabel("Email").fill("new-student@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByLabel("First name").fill("New");
  await page.getByLabel("Last name").fill("Student");
  await page
    .getByLabel("What are you preparing for?")
    .selectOption("TEF Canada");
  await page.getByRole("button", { name: "Create my learning plan" }).click();
  await expect(page).toHaveURL(/checkout\?plan=intensive/);
  await expect(
    page.getByRole("heading", { name: "Intensive plan" }),
  ).toBeVisible();
});

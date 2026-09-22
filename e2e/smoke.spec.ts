import { expect, test } from "@playwright/test";

async function completeGuestAssessment(page: import("@playwright/test").Page) {
  const start = page.getByRole("button", { name: "Start my assessment" });
  await expect(start).toBeDisabled();
  await page.getByLabel("Prepare for TEF Canada").check();
  await page.getByLabel("NCLC 7").check();
  await page.getByLabel("I know some French").check();
  await start.click();

  for (let index = 1; index <= 15; index += 1) {
    await expect(page.getByText(`Question ${index} of 15`)).toBeVisible();
    const radio = page.locator(`input[type="radio"][name="d${index}"]`).first();
    if (await radio.count())
      await radio.evaluate((element: HTMLInputElement) => element.click());
    else await page.getByPlaceholder("Votre réponse").fill("lirais");
    await page
      .getByRole("button", {
        name: index === 15 ? "Finish assessment" : "Next",
        exact: true,
      })
      .click();
  }
}

test("guest assessment is retained for the registration handoff", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto("/diagnostic");
  await completeGuestAssessment(page);
  await expect(page).toHaveURL(/diagnostic\/results/);
  await expect(
    page.getByRole("heading", { name: "Your French Assessment" }),
  ).toBeVisible();

  const recommendation = page.getByLabel("Recommended plan: Complete");
  await expect(recommendation).toBeVisible();
  await recommendation
    .getByRole("link", { name: "Continue with Complete" })
    .click();
  await expect(page).toHaveURL(/register\?plan=complete/);
  await expect(page.getByLabel("What are you preparing for?")).toHaveValue(
    "TEF Canada",
  );
  await expect(page.getByLabel("What result are you aiming for?")).toHaveValue(
    "NCLC 7",
  );

  const storedGuest = await page.evaluate(() =>
    JSON.parse(
      localStorage.getItem("mpk-academy:guest-assessment:v1") ?? "null",
    ),
  );
  expect(storedGuest).toMatchObject({
    status: "active",
    intake: { goal: "TEF Canada", target: "NCLC 7" },
  });
  expect(Object.keys(storedGuest.answers)).toHaveLength(15);
  expect(Date.parse(storedGuest.expiresAt)).toBeGreaterThan(Date.now());
});

test("student routes require a verified Supabase session", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/practice/session?skill=listening&count=10");
  await expect(page).toHaveURL(/\/login/);
  await expect(
    page.getByRole("heading", { name: "Continue your preparation." }),
  ).toBeVisible();
});

test("paid plans remain visible while checkout cannot grant access", async ({
  page,
}) => {
  await page.goto("/checkout?plan=complete");
  await expect(
    page.getByRole("heading", { name: "Complete plan" }),
  ).toBeVisible();
  await expect(page.getByText("~$249", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Payments are not enabled yet/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: /secure payment/i }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Create account" }),
  ).toHaveAttribute("href", "/register");
});

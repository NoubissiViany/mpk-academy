import { expect, test } from "@playwright/test";

test("landing and the three-step assessment are navigable", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Prepare for TEF\/TCF/ }),
  ).toBeVisible();
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
    if (await radio.count()) await radio.check();
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
});

test("the deleted program route is unlinked and unavailable", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Explore plans" }).click();
  await expect(page).toHaveURL(/pricing/);
  const response = await page.goto("/program");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", {
      name: "That page is not part of the learning plan.",
    }),
  ).toBeVisible();
});

test("dashboard, learning, practice, and exam modes are distinct", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page.getByText("Recommended next action")).toBeVisible();
  await page.goto("/learn/core-grammar/connectors");
  await expect(page.getByText("Learn with support")).toBeVisible();
  await expect(page.getByText("English explanation")).toBeVisible();
  await page.goto("/practice/session");
  await expect(page.getByText("Apply what you learned")).toBeVisible();
  await page.goto("/exam/session");
  await expect(
    page.getByText("Aucune aide pédagogique n’est disponible"),
  ).toBeVisible();
});

test("checkout unlocks local paid access", async ({ page }) => {
  await page.goto("/checkout");
  await page
    .getByRole("button", { name: "Continue to secure payment" })
    .click();
  await expect(page).toHaveURL(/checkout\/success/);
  await expect(
    page.getByRole("heading", { name: "The full program is unlocked." }),
  ).toBeVisible();
});

import { expect, test } from "@playwright/test";

test("landing, diagnostic, and dashboard routes are navigable", async ({ page }) => {
  await page.goto("/"); await expect(page.getByRole("heading", { name: /Prepare for TEF\/TCF/ })).toBeVisible();
  await page.getByRole("link", { name: "Start free diagnostic" }).first().click();
  await expect(page.getByRole("heading", { name: /Find your strongest skills/ })).toBeVisible();
  await page.goto("/dashboard"); await expect(page.getByText("Recommended next action")).toBeVisible();
});

test("learning, practice, and exam modes are distinct", async ({ page }) => {
  await page.goto("/learn/core-grammar/connectors"); await expect(page.getByText("Learn with support")).toBeVisible(); await expect(page.getByText("English explanation")).toBeVisible();
  await page.goto("/practice/session"); await expect(page.getByText("Apply what you learned")).toBeVisible();
  await page.goto("/exam/session"); await expect(page.getByText("Aucune aide pédagogique n’est disponible")).toBeVisible();
});

test("checkout unlocks local paid access", async ({ page }) => {
  await page.goto("/checkout"); await page.getByRole("button", { name: "Continue to secure payment" }).click();
  await expect(page).toHaveURL(/checkout\/success/); await expect(page.getByRole("heading", { name: "The full program is unlocked." })).toBeVisible();
});

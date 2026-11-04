import { expect, test } from "@playwright/test";
import { messagesFor } from "../src/i18n/messages";

const key = "mpk-academy:diagnostic-draft:v1";
for (const locale of ["en", "fr"] as const) {
  test(`${locale}: recover, navigate, reopen and restart an assessment`, async ({
    page,
    context,
    browser,
  }) => {
    test.setTimeout(90_000);
    const t = messagesFor(locale);
    await context.addCookies([
      { name: "mpk_locale", value: locale, url: "http://127.0.0.1:3100" },
    ]);
    await page.addInitScript(() =>
      Object.defineProperty(navigator, "globalPrivacyControl", {
        get: () => true,
      }),
    );
    await page.goto("/diagnostic");
    await page
      .getByLabel(t.diagnostic.intake.goals["TEF Canada"], { exact: true })
      .check();
    await page.getByLabel("NCLC 7", { exact: true }).check();
    await page
      .getByLabel(t.diagnostic.intake.experience["I know some French"], {
        exact: true,
      })
      .check();
    await page.getByRole("button", { name: t.diagnostic.intro.start }).click();
    const question = await page
      .getByRole("heading", { level: 2 })
      .textContent();
    const options = await page
      .locator('label:has(input[type="radio"])')
      .allTextContents();
    await page.locator('label:has(input[type="radio"])').first().click();
    await expect(
      page.getByText(t.ux.draft.saved, { exact: true }),
    ).toBeVisible();
    const original = await page.evaluate(
      (storageKey) => JSON.parse(localStorage.getItem(storageKey)!),
      key,
    );
    await page.reload();
    await page.getByRole("button", { name: t.ux.draft.resume }).click();
    await expect(page.getByRole("heading", { level: 2 })).toHaveText(question!);
    expect(
      await page.locator('label:has(input[type="radio"])').allTextContents(),
    ).toEqual(options);
    await expect(page.locator('input[type="radio"]').first()).toBeChecked();
    await page
      .getByRole("button", { name: t.common.next, exact: true })
      .click();
    await page.goto("/");
    await page.goto("/diagnostic");
    await page.getByRole("button", { name: t.ux.draft.resume }).click();
    await expect(
      page.getByText(
        t.diagnostic.question.progress(2, original.questionOrder.length),
        { exact: true },
      ),
    ).toBeVisible();

    // Simulate the browser restoring persistent storage after closing; no session storage is used.
    const storageState = await context.storageState();
    const reopened = await browser.newContext({
      storageState,
      viewport: page.viewportSize()!,
    });
    const nextPage = await reopened.newPage();
    await nextPage.goto("http://127.0.0.1:3100/diagnostic");
    await nextPage.getByRole("button", { name: t.ux.draft.resume }).click();
    await expect(
      nextPage.getByText(
        t.diagnostic.question.progress(2, original.questionOrder.length),
        { exact: true },
      ),
    ).toBeVisible();
    nextPage.once("dialog", (dialog) => dialog.dismiss());
    await nextPage
      .getByRole("button", { name: t.ux.draft.restart, exact: true })
      .click();
    expect(
      await nextPage.evaluate(
        (storageKey) => JSON.parse(localStorage.getItem(storageKey)!).id,
        key,
      ),
    ).toBe(original.id);
    nextPage.once("dialog", (dialog) => dialog.accept());
    await nextPage
      .getByRole("button", { name: t.ux.draft.restart, exact: true })
      .click();
    await expect(
      nextPage.getByRole("button", { name: t.diagnostic.intro.start }),
    ).toBeVisible();
    expect(
      await nextPage.evaluate(
        (storageKey) => JSON.parse(localStorage.getItem(storageKey)!).id,
        key,
      ),
    ).not.toBe(original.id);
    await reopened.close();
  });

  test(`${locale}: mobile menu closes and restores keyboard focus`, async ({
    page,
    context,
    isMobile,
  }) => {
    test.skip(!isMobile, "Menu is only shown at mobile widths");
    const t = messagesFor(locale);
    await context.addCookies([
      { name: "mpk_locale", value: locale, url: "http://127.0.0.1:3100" },
    ]);
    await page.goto("/");
    const menu = page.getByRole("button", { name: t.common.nav.openMenu });
    await menu.click();
    await expect(
      page.getByRole("button", { name: t.common.nav.closeMenu }),
    ).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(menu).toBeFocused();
    await menu.press("Enter");
    await page
      .getByRole("navigation", { name: t.common.nav.mobile })
      .getByRole("link", { name: t.common.nav.how })
      .click();
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await expect(menu).toBeFocused();
    await menu.click();
    await page
      .getByRole("navigation", { name: t.common.nav.mobile })
      .getByRole("link", { name: t.common.nav.startAssessment })
      .click();
    await expect(page).toHaveURL(/\/diagnostic$/);
    await expect(menu).toHaveAttribute("aria-expanded", "false");
  });
}

test("writing survives refresh and a storage failure", async ({ page }) => {
  await page.goto("/diagnostic");
  await page.getByLabel("Prepare for TEF Canada").check();
  await expect(page.getByText("Progress saved", { exact: true })).toBeVisible();
  // Restore a valid saved writing stage without repeating the full question smoke test.
  await page.evaluate((storageKey) => {
    const draft = JSON.parse(localStorage.getItem(storageKey)!);
    draft.stage = "writing";
    draft.intake.writingSample = {
      version: "mpk-diagnostic-writing-v1",
      text: "Mon premier brouillon",
    };
    localStorage.setItem(storageKey, JSON.stringify(draft));
  }, key);
  await page.reload();
  await page
    .getByRole("button", { name: "Continue assessment", exact: true })
    .click();
  const writing = page.getByLabel("Your message in French");
  await expect(writing).toHaveValue("Mon premier brouillon");
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Object.assign(window, {
      restoreDraftStorage: () => {
        Storage.prototype.setItem = original;
      },
    });
    Storage.prototype.setItem = () => {
      throw new DOMException("Storage full", "QuotaExceededError");
    };
  });
  await writing.fill("Mon nouveau texte est toujours visible.");
  await page.getByRole("heading", { level: 1 }).click();
  await expect(
    page.getByRole("button", { name: "Retry saving", exact: true }),
  ).toBeVisible();
  await expect(writing).toHaveValue("Mon nouveau texte est toujours visible.");
  await page.evaluate(() =>
    (
      window as unknown as { restoreDraftStorage: () => void }
    ).restoreDraftStorage(),
  );
  await page.getByRole("button", { name: "Retry saving", exact: true }).click();
  await expect(page.getByText("Progress saved", { exact: true })).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Continue assessment", exact: true })
    .click();
  await expect(page.getByLabel("Your message in French")).toHaveValue(
    "Mon nouveau texte est toujours visible.",
  );
});

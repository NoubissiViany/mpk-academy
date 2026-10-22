import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { themeIssues } from "@/content/themes";
import { RecurringThemes } from "./recurring-themes";

afterEach(cleanup);

describe("recurring themes page", () => {
  it("shows the latest month in the address's language", () => {
    render(<RecurringThemes lang="fr" />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Thèmes récurrents du TEF et du TCF Canada",
      }),
    ).toBeVisible();
    expect(screen.getByText(/octobre 2026/)).toBeVisible();
    expect(
      screen.getByText(/ne sont pas de vrais sujets d’examen/),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Read in English" }),
    ).toHaveAttribute("href", "/themes/en");
  });

  it("keeps the prompts in French on the English page", () => {
    render(<RecurringThemes lang="en" />);
    const prompt = themeIssues[0].themes[0].prompts[0];
    expect(screen.getByText(prompt.text)).toHaveAttribute("lang", "fr");
    expect(screen.getAllByText(prompt.task.en).length).toBeGreaterThan(0);
  });

  it("writes original prompts only, each under one exam task", () => {
    for (const issue of themeIssues) {
      expect(issue.month).toMatch(/^\d{4}-\d{2}$/);
      for (const theme of issue.themes) {
        expect(theme.prompts.length).toBeGreaterThan(0);
        expect(theme.expressions.length).toBeGreaterThan(0);
      }
    }
  });
});

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AppProvider } from "@/components/providers/app-provider";
import { demoState } from "@/test/fixtures";
import { saveState } from "@/lib/persistence";
import LearnPage from "./page";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("learning categories", () => {
  it("groups modules and provides recommended lessons", async () => {
    saveState(demoState);
    render(
      <AppProvider>
        <LearnPage />
      </AppProvider>,
    );

    expect(
      await screen.findByRole("heading", { name: "Recommended lessons" }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "Foundations" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Exam Skills" })).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Exam Strategy" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "TEF format and strategies" }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "Grammar" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Vocabulary" })).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Pronunciation" }),
    ).toBeVisible();
  });
});

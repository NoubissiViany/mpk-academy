import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppProvider } from "@/components/providers/app-provider";
import { demoState } from "@/test/fixtures";
import type { AppState } from "@/types/domain";
import { CheckoutSuccessView } from "./checkout-success-view";

describe("checkout success verification", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => cleanup());

  it("starts the assessment after a verified purchase without results", async () => {
    const initialState = {
      ...demoState,
      planAccess: { ...demoState.planAccess!, planId: "essential" },
      diagnosticResult: null,
    } satisfies AppState;
    render(
      <AppProvider initialState={initialState}>
        <CheckoutSuccessView />
      </AppProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Your Essential plan is unlocked.",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Start my assessment" }),
    ).toHaveAttribute("href", "/diagnostic");
  });

  it("continues directly to the dashboard when results already exist", async () => {
    render(
      <AppProvider initialState={demoState}>
        <CheckoutSuccessView />
      </AppProvider>,
    );

    expect(
      await screen.findByRole("link", { name: "Go to dashboard" }),
    ).toHaveAttribute("href", "/dashboard");
  });

  it("does not trust the success URL when no purchase is persisted", async () => {
    render(
      <AppProvider initialState={{ ...demoState, planAccess: null }}>
        <CheckoutSuccessView />
      </AppProvider>,
    );

    expect(
      await screen.findByRole("heading", { name: "Payment not confirmed" }),
    ).toBeVisible();
  });
});

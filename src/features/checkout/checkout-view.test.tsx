import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProvider } from "@/components/providers/app-provider";
import { getPaidPlan } from "@/config/product";
import { demoState } from "@/test/fixtures";
import { CheckoutView } from "./checkout-view";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/app/actions/checkout", () => ({
  createCheckoutSessionAction: vi.fn(),
}));

describe("verified checkout", () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it("asks a visitor to create an account", async () => {
    render(
      <AppProvider>
        <CheckoutView plan={getPaidPlan("complete")!} />
      </AppProvider>,
    );
    expect(await screen.findByText("Complete plan")).toBeVisible();
    expect(
      await screen.findByRole("link", { name: "Create account" }),
    ).toHaveAttribute("href", "/register");
    expect(screen.getByText(/plus applicable tax/i)).toBeVisible();
  });

  it("offers Stripe checkout only after an assessment", async () => {
    render(
      <AppProvider initialState={{ ...demoState, planAccess: null }}>
        <CheckoutView plan={getPaidPlan("essential")!} />
      </AppProvider>,
    );
    expect(
      await screen.findByRole("button", {
        name: "Pay securely for Essential",
      }),
    ).toBeEnabled();
    expect(
      screen.getByText("Access is granted only after verified payment"),
    ).toBeVisible();
  });

  it("blocks another purchase for an active paid learner", async () => {
    render(
      <AppProvider initialState={demoState}>
        <CheckoutView plan={getPaidPlan("complete")!} />
      </AppProvider>,
    );
    expect(
      await screen.findByRole("link", { name: "Go to dashboard" }),
    ).toHaveAttribute("href", "/dashboard");
    expect(
      screen.queryByRole("button", { name: /Pay securely/ }),
    ).not.toBeInTheDocument();
  });
});

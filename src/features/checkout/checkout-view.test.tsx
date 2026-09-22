import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppProvider } from "@/components/providers/app-provider";
import { getPaidPlan } from "@/config/product";
import { defaultState } from "@/data/mock-state";
import { saveState } from "@/lib/persistence";
import { CheckoutView } from "./checkout-view";

describe("deferred checkout", () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it("keeps paid plans visible without an entitlement-granting action", async () => {
    render(
      <AppProvider>
        <CheckoutView plan={getPaidPlan("complete")!} />
      </AppProvider>,
    );
    expect(await screen.findByText("Complete plan")).toBeVisible();
    expect(
      await screen.findByRole("link", { name: "Create account" }),
    ).toHaveAttribute("href", "/register");
    expect(
      screen.queryByRole("button", { name: /secure payment/i }),
    ).not.toBeInTheDocument();
  });

  it("does not store or grant a paid entitlement", async () => {
    saveState(structuredClone(defaultState));
    render(
      <AppProvider>
        <CheckoutView plan={getPaidPlan("essential")!} />
      </AppProvider>,
    );
    expect(
      await screen.findByText(/No entitlement will be granted/),
    ).toBeVisible();
    expect(defaultState.planAccess).toBeNull();
  });
});

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProvider } from "@/components/providers/app-provider";
import { paidPlans, productPlans } from "@/config/product";
import { defaultState } from "@/data/mock-state";
import { demoState } from "@/test/fixtures";
import { PlanComparison } from "./plan-comparison";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  setCheckoutIntent: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));
vi.mock("@/app/actions/auth", () => ({
  setCheckoutIntentAction: mocks.setCheckoutIntent,
}));
vi.mock("@/app/actions/learner", () => ({
  getLearnerSnapshotAction: vi.fn(),
  updateProfileAction: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: { error: mocks.toastError },
  Toaster: () => null,
}));

describe("PlanComparison checkout intent", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.setCheckoutIntent.mockImplementation(async (planId: string) => ({
      ok: true,
      planId,
    }));
  });
  afterEach(cleanup);

  it("sends anonymous paid-plan selections directly to registration", () => {
    render(
      <AppProvider initialState={defaultState}>
        <PlanComparison plans={paidPlans} />
      </AppProvider>,
    );

    expect(
      screen.getByRole("link", { name: "Choose Essential" }),
    ).toHaveAttribute("href", "/register?plan=essential");
    expect(
      screen.getByRole("link", { name: "Choose Complete" }),
    ).toHaveAttribute("href", "/register?plan=complete");
    expect(
      screen.getByRole("link", { name: "Choose Intensive" }),
    ).toHaveAttribute("href", "/register?plan=intensive");
  });

  it("keeps the free plan on the assessment entry point", () => {
    render(
      <AppProvider initialState={defaultState}>
        <PlanComparison plans={productPlans} />
      </AppProvider>,
    );
    expect(
      screen.getByRole("link", { name: "Start free assessment" }),
    ).toHaveAttribute("href", "/diagnostic");
  });

  it("saves an authenticated selection before requiring the assessment", async () => {
    const user = userEvent.setup();
    render(
      <AppProvider
        initialState={{
          ...demoState,
          diagnosticResult: null,
          planAccess: null,
        }}
      >
        <PlanComparison plans={paidPlans} />
      </AppProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Choose Essential" }));

    await waitFor(() =>
      expect(mocks.setCheckoutIntent).toHaveBeenCalledWith("essential"),
    );
    expect(mocks.push).toHaveBeenCalledWith("/diagnostic");
  });

  it("continues an assessed unpaid learner to the selected checkout", async () => {
    const user = userEvent.setup();
    render(
      <AppProvider initialState={{ ...demoState, planAccess: null }}>
        <PlanComparison plans={paidPlans} />
      </AppProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Choose Intensive" }));

    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith("/checkout?plan=intensive"),
    );
  });

  it("does not offer another checkout to an actively paid learner", () => {
    render(
      <AppProvider initialState={demoState}>
        <PlanComparison plans={paidPlans} />
      </AppProvider>,
    );
    expect(
      screen.getAllByRole("link", { name: "Go to dashboard" }),
    ).toHaveLength(paidPlans.length);
  });
});

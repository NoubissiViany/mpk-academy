import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProvider } from "@/components/providers/app-provider";
import { getPaidPlan, productConfig } from "@/config/product";
import { demoState } from "@/test/fixtures";
import { diagnosticQuestions } from "@/data/questions";
import { CheckoutView } from "@/features/checkout/checkout-view";
import { scoreDiagnostic } from "@/lib/domain/diagnostic";
import {
  ensureStorageNamespace,
  loadState,
  saveState,
} from "@/lib/persistence";
import { mockPaymentRepository } from "@/repositories/mock";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

describe("checkout plan persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    push.mockClear();
    ensureStorageNamespace();
    localStorage.setItem(
      productConfig.sessionStorageKey,
      JSON.stringify({
        userId: demoState.user!.id,
        createdAt: new Date().toISOString(),
      }),
    );
    saveState({
      ...demoState,
      user: { ...demoState.user!, tier: "free_student" },
      planAccess: null,
      diagnosticResult: scoreDiagnostic(diagnosticQuestions, {}),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("stores the purchased plan, access date, and welcome handoff", async () => {
    vi.spyOn(mockPaymentRepository, "checkout").mockResolvedValueOnce(
      "success",
    );
    render(
      <AppProvider>
        <CheckoutView plan={getPaidPlan("essential")} />
      </AppProvider>,
    );
    await userEvent.setup().click(
      await screen.findByRole("button", {
        name: "Continue to secure payment",
      }),
    );
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/checkout/success?plan=essential"),
    );
    const persisted = loadState();
    expect(persisted.user?.tier).toBe("paid_student");
    expect(persisted.planAccess?.planId).toBe("essential");
    expect(Date.parse(persisted.planAccess!.accessUntil!)).toBeGreaterThan(
      Date.parse(persisted.planAccess!.purchasedAt!),
    );
    expect(persisted.postCheckoutWelcomePending).toBe(true);
  });

  it("does not grant access when payment fails", async () => {
    vi.spyOn(mockPaymentRepository, "checkout").mockResolvedValueOnce("failed");
    render(
      <AppProvider>
        <CheckoutView plan={getPaidPlan("intensive")} />
      </AppProvider>,
    );
    await userEvent.setup().click(
      await screen.findByRole("button", {
        name: "Continue to secure payment",
      }),
    );
    expect(
      await screen.findByRole("heading", {
        name: "Payment was not completed",
      }),
    ).toBeVisible();
    const persisted = loadState();
    expect(persisted.user?.tier).toBe("free_student");
    expect(persisted.planAccess).toBeNull();
    expect(push).not.toHaveBeenCalled();
  });
});

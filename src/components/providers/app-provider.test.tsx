import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { productConfig } from "@/config/product";
import { demoState } from "@/test/fixtures";
import { AppProvider, useApp } from "./app-provider";

const mocks = vi.hoisted(() => ({
  getSnapshot: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock("@/app/actions/learner", () => ({
  getLearnerSnapshotAction: mocks.getSnapshot,
  updateProfileAction: mocks.updateProfile,
}));
vi.mock("@/lib/supabase/env", () => ({
  isSupabaseConfigured: () => true,
}));

function SessionState() {
  const { state, hydrated } = useApp();
  return (
    <p>{hydrated ? (state.user ? "signed in" : "signed out") : "loading"}</p>
  );
}

describe("AppProvider session hydration", () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.getSnapshot.mockReset();
    mocks.updateProfile.mockReset();
  });

  afterEach(cleanup);

  it("does not restore a fake local user when Supabase has no session", async () => {
    localStorage.setItem(
      productConfig.storageNamespaceVersionKey,
      productConfig.storageNamespaceVersion,
    );
    localStorage.setItem(
      productConfig.anonymousStateStorageKey,
      JSON.stringify(demoState),
    );
    mocks.getSnapshot.mockResolvedValue({
      ok: false,
      reason: "unauthenticated",
      message: "Your session has expired. Sign in again.",
      reference: "signed-out-reference",
    });

    render(
      <AppProvider>
        <SessionState />
      </AppProvider>,
    );

    expect(await screen.findByText("signed out")).toBeVisible();
    expect(mocks.getSnapshot).toHaveBeenCalledOnce();
  });
});

import { beforeEach, describe, expect, it } from "vitest";
import { productConfig } from "@/config/product";
import { defaultState } from "@/data/mock-state";
import { demoState } from "@/test/fixtures";
import {
  ensureStorageNamespace,
  loadState,
  loadUserState,
  saveState,
} from "./persistence";

describe("versioned, user-scoped persistence", () => {
  beforeEach(() => localStorage.clear());

  it("starts with a clean anonymous learner", () => {
    expect(loadState()).toEqual(defaultState);
    expect(loadState().user).toBeNull();
    expect(loadState().activities).toEqual([]);
  });

  it("resets legacy version-4 browser data once", () => {
    localStorage.setItem(
      productConfig.storageKey,
      JSON.stringify({ ...demoState, schemaVersion: 4 }),
    );
    expect(loadState()).toEqual(defaultState);
    expect(localStorage.getItem(productConfig.storageKey)).toBeNull();
    expect(localStorage.getItem(productConfig.storageNamespaceVersionKey)).toBe(
      productConfig.storageNamespaceVersion,
    );
  });

  it("round-trips anonymous diagnostic state", () => {
    const anonymous = {
      ...defaultState,
      diagnosticAnswers: { question: "answer" },
    };
    saveState(anonymous);
    expect(loadState().diagnosticAnswers).toEqual({ question: "answer" });
  });

  it("stores signed-in learners under their own state keys", () => {
    ensureStorageNamespace();
    localStorage.setItem(
      productConfig.sessionStorageKey,
      JSON.stringify({
        userId: demoState.user!.id,
        createdAt: "2026-09-15T12:00:00.000Z",
      }),
    );
    saveState(demoState);
    expect(loadUserState(demoState.user!.id)?.user?.firstName).toBe("Alex");
    expect(loadState().user?.id).toBe(demoState.user!.id);
    expect(
      localStorage.getItem(productConfig.anonymousStateStorageKey),
    ).toBeNull();
  });
});

import { beforeEach, describe, expect, it } from "vitest";
import { productConfig } from "@/config/product";
import { defaultState } from "@/data/mock-state";
import { demoState } from "@/test/fixtures";
import { ensureStorageNamespace, loadState, saveState } from "./persistence";

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

  it("never restores authenticated or learner-only fields from anonymous storage", () => {
    localStorage.setItem(
      productConfig.storageNamespaceVersionKey,
      productConfig.storageNamespaceVersion,
    );
    localStorage.setItem(
      productConfig.anonymousStateStorageKey,
      JSON.stringify({
        ...demoState,
        schemaVersion: 5,
        diagnosticAnswers: { d1: "a" },
      }),
    );

    const loaded = loadState();

    expect(loaded.user).toBeNull();
    expect(loaded.planAccess).toBeNull();
    expect(loaded.examProfiles).toEqual({});
    expect(loaded.mistakes).toEqual([]);
    expect(loaded.activities).toEqual([]);
    expect(loaded.progress).toEqual(defaultState.progress);
    expect(loaded.diagnosticAnswers).toEqual({ d1: "a" });
  });

  it("clears legacy auth keys without deleting a guest assessment", () => {
    const guest = { id: "guest-1", expiresAt: "2099-01-01T00:00:00.000Z" };
    localStorage.setItem(productConfig.storageNamespaceVersionKey, "3");
    localStorage.setItem(productConfig.accountsStorageKey, "legacy accounts");
    localStorage.setItem(productConfig.sessionStorageKey, "legacy session");
    localStorage.setItem(
      `${productConfig.userStateStoragePrefix}user-1`,
      "legacy user state",
    );
    localStorage.setItem(
      productConfig.guestAssessmentStorageKey,
      JSON.stringify(guest),
    );

    ensureStorageNamespace();

    expect(localStorage.getItem(productConfig.accountsStorageKey)).toBeNull();
    expect(localStorage.getItem(productConfig.sessionStorageKey)).toBeNull();
    expect(
      localStorage.getItem(`${productConfig.userStateStoragePrefix}user-1`),
    ).toBeNull();
    expect(
      JSON.parse(
        localStorage.getItem(productConfig.guestAssessmentStorageKey) ?? "null",
      ),
    ).toEqual(guest);
  });

  it("never persists authenticated learner data in local storage", () => {
    ensureStorageNamespace();
    localStorage.setItem(
      productConfig.sessionStorageKey,
      JSON.stringify({
        userId: demoState.user!.id,
        createdAt: "2026-09-15T12:00:00.000Z",
      }),
    );
    saveState(demoState);
    expect(loadState().user).toBeNull();
    expect(
      localStorage.getItem(productConfig.anonymousStateStorageKey),
    ).toBeNull();
  });
});

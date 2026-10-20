import { act, cleanup, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { productConfig } from "@/config/product";
import { useI18n } from "@/i18n/client";
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

const sessionCookie = "sb-test-auth-token";

function SeedOnMount() {
  const { replaceState } = useApp();
  useEffect(() => replaceState(demoState), [replaceState]);
  return null;
}

function LocaleProbe() {
  const { locale, t, setLocale } = useI18n();
  return (
    <button type="button" onClick={() => void setLocale("fr")}>
      {locale}:{t.common.nav.signIn}
    </button>
  );
}

describe("AppProvider session hydration", () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.getSnapshot.mockReset();
    mocks.updateProfile.mockReset();
  });

  afterEach(() => {
    cleanup();
    document.cookie = `${sessionCookie}=; max-age=0; path=/`;
    document.cookie = "mpk_locale=; max-age=0; path=/";
  });

  it("skips the server snapshot for anonymous visitors", async () => {
    render(
      <AppProvider>
        <SessionState />
      </AppProvider>,
    );

    expect(await screen.findByText("signed out")).toBeVisible();
    expect(mocks.getSnapshot).not.toHaveBeenCalled();
  });

  it("does not load the snapshot twice when a page seeds the learner state", async () => {
    document.cookie = `${sessionCookie}=token; path=/`;
    render(
      <AppProvider>
        <SeedOnMount />
        <SessionState />
      </AppProvider>,
    );

    expect(await screen.findByText("signed in")).toBeVisible();
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    expect(mocks.getSnapshot).not.toHaveBeenCalled();
  });

  it("serves the server-resolved locale and stores a visitor's change", async () => {
    render(
      <AppProvider initialLocale="fr">
        <LocaleProbe />
      </AppProvider>,
    );
    expect(await screen.findByText("fr:Se connecter")).toBeVisible();

    render(
      <AppProvider>
        <LocaleProbe />
      </AppProvider>,
    );
    await act(async () => screen.getByText("en:Sign in").click());
    expect(await screen.findAllByText("fr:Se connecter")).toHaveLength(2);
    expect(document.cookie).toContain("mpk_locale=fr");
    expect(mocks.updateProfile).not.toHaveBeenCalled();
  });

  it("does not restore a fake local user when Supabase has no session", async () => {
    document.cookie = `${sessionCookie}=expired; path=/`;
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

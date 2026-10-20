"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Toaster } from "sonner";
import {
  getLearnerSnapshotAction,
  updateProfileAction,
} from "@/app/actions/learner";
import { defaultState } from "@/data/mock-state";
import {
  hasSupabaseSessionCookie,
  I18nContextProvider,
  writeLocaleCookie,
} from "@/i18n/client";
import { defaultLocale } from "@/i18n/config";
import { messagesFor } from "@/i18n/messages";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { loadState, saveState } from "@/lib/persistence";
import type { AppState, Locale, User } from "@/types/domain";

interface AppContextValue {
  state: AppState;
  hydrated: boolean;
  setState: (updater: AppState | ((state: AppState) => AppState)) => void;
  replaceState: (state: AppState) => void;
  updateUser: (user: User | null) => void;
  locale: Locale;
  /** Resolves once the preference is stored; callers refresh server output. */
  setLocale: (locale: Locale) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({
  children,
  initialState,
  initialLocale = defaultLocale,
}: {
  children: React.ReactNode;
  initialState?: AppState;
  initialLocale?: Locale;
}) {
  const [state, setStateValue] = useState<AppState>(
    initialState ?? defaultState,
  );
  const [hydrated, setHydrated] = useState(Boolean(initialState));
  const [preferredLocale, setPreferredLocale] = useState(initialLocale);
  // Set when a server-rendered page seeds the learner state, so the provider
  // does not load the same snapshot a second time.
  const seeded = useRef(Boolean(initialState));
  const locale = state.user?.locale ?? preferredLocale;

  const replaceState = useCallback((next: AppState) => {
    seeded.current = true;
    setStateValue(next);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (initialState) return;
    let active = true;
    const timer = window.setTimeout(async () => {
      if (seeded.current) return;
      const localState = loadState();
      let nextState = localState;
      // Anonymous visitors have no session cookie: skip the server round trip.
      if (isSupabaseConfigured() && hasSupabaseSessionCookie()) {
        const snapshotResult = await getLearnerSnapshotAction();
        nextState = snapshotResult.ok
          ? snapshotResult.snapshot
          : snapshotResult.reason === "unauthenticated"
            ? { ...localState, user: null, planAccess: null }
            : localState;
      }
      if (active && !seeded.current) {
        setStateValue(nextState);
        setHydrated(true);
      }
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [initialState]);

  // Keep the cookie aligned with the profile so server renders match.
  useEffect(() => {
    if (state.user?.locale) writeLocaleCookie(state.user.locale);
  }, [state.user?.locale]);

  const setState = useCallback(
    (updater: AppState | ((state: AppState) => AppState)) =>
      setStateValue((current) => {
        const next = typeof updater === "function" ? updater(current) : updater;
        if (!next.user) saveState(next);
        return next;
      }),
    [],
  );

  const setLocale = useCallback(
    async (next: Locale) => {
      writeLocaleCookie(next);
      setPreferredLocale(next);
      const user = state.user;
      if (!user) return;
      setStateValue((current) =>
        current.user
          ? { ...current, user: { ...current.user, locale: next } }
          : current,
      );
      const result = await updateProfileAction({
        firstName: user.firstName,
        lastName: user.lastName,
        locale: next,
        assistance: user.assistance,
      });
      if (result.ok) setStateValue(result.snapshot);
    },
    [state.user],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      hydrated,
      setState,
      replaceState,
      updateUser: (user) => setState((current) => ({ ...current, user })),
      locale,
      setLocale,
    }),
    [state, hydrated, setState, replaceState, locale, setLocale],
  );
  const i18n = useMemo(
    () => ({ locale, t: messagesFor(locale), setLocale }),
    [locale, setLocale],
  );
  return (
    <AppContext.Provider value={value}>
      <I18nContextProvider value={i18n}>
        {children}
        <Toaster richColors position="top-center" />
      </I18nContextProvider>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}

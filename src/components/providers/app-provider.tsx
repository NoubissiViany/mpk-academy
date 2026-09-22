"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Toaster } from "sonner";
import {
  getLearnerSnapshotAction,
  updateProfileAction,
} from "@/app/actions/learner";
import { defaultState } from "@/data/mock-state";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { loadState, saveState } from "@/lib/persistence";
import type { AppState, Locale, User } from "@/types/domain";

interface AppContextValue {
  state: AppState;
  hydrated: boolean;
  setState: (updater: AppState | ((state: AppState) => AppState)) => void;
  replaceState: (state: AppState) => void;
  updateUser: (user: User | null) => void;
  setLocale: (locale: Locale) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState?: AppState;
}) {
  const [state, setStateValue] = useState<AppState>(
    initialState ?? defaultState,
  );
  const [hydrated, setHydrated] = useState(Boolean(initialState));
  useEffect(() => {
    if (initialState) return;
    let active = true;
    const timer = window.setTimeout(async () => {
      const localState = loadState();
      let nextState = localState;
      if (isSupabaseConfigured()) {
        const snapshotResult = await getLearnerSnapshotAction();
        nextState = snapshotResult.ok
          ? snapshotResult.snapshot
          : snapshotResult.reason === "unauthenticated"
            ? { ...localState, user: null, planAccess: null }
            : localState;
      }
      if (active) {
        setStateValue(nextState);
        setHydrated(true);
      }
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [initialState]);
  const setState = (updater: AppState | ((state: AppState) => AppState)) =>
    setStateValue((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      if (!next.user) saveState(next);
      return next;
    });
  const value = useMemo<AppContextValue>(
    () => ({
      state,
      hydrated,
      setState,
      replaceState: setStateValue,
      updateUser: (user) => setState((current) => ({ ...current, user })),
      setLocale: (locale) => {
        setState((current) =>
          current.user
            ? { ...current, user: { ...current.user, locale } }
            : current,
        );
        if (state.user)
          void updateProfileAction({
            firstName: state.user.firstName,
            lastName: state.user.lastName,
            locale,
            assistance: state.user.assistance,
          }).then((result) => {
            if (result.ok) setStateValue(result.snapshot);
          });
      },
    }),
    [state, hydrated],
  );
  return (
    <AppContext.Provider value={value}>
      {children}
      <Toaster richColors position="top-center" />
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}

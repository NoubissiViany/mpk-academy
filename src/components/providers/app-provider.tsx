"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Toaster } from "sonner";
import { defaultState } from "@/data/mock-state";
import { loadState, saveState } from "@/lib/persistence";
import type { AppState, Locale, User } from "@/types/domain";

interface AppContextValue {
  state: AppState;
  hydrated: boolean;
  setState: (updater: AppState | ((state: AppState) => AppState)) => void;
  updateUser: (user: User | null) => void;
  setLocale: (locale: Locale) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setStateValue] = useState<AppState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => { setStateValue(loadState()); setHydrated(true); }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const setState = (updater: AppState | ((state: AppState) => AppState)) => setStateValue((current) => {
    const next = typeof updater === "function" ? updater(current) : updater;
    saveState(next);
    return next;
  });
  const value = useMemo<AppContextValue>(() => ({
    state, hydrated, setState,
    updateUser: (user) => setState((current) => ({ ...current, user })),
    setLocale: (locale) => { document.cookie = `mpk_locale=${locale};path=/;max-age=31536000;samesite=lax`; setState((current) => current.user ? ({ ...current, user: { ...current.user, locale } }) : current); },
  }), [state, hydrated]);
  return <AppContext.Provider value={value}>{children}<Toaster richColors position="top-center" /></AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}

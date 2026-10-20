"use client";

import { createContext, useContext } from "react";
import {
  defaultLocale,
  localeCookieMaxAge,
  localeCookieName,
  type Locale,
} from "@/i18n/config";
import { messagesFor, type Messages } from "@/i18n/messages";

export type I18nValue = {
  locale: Locale;
  t: Messages;
  setLocale: (locale: Locale) => Promise<void>;
};

// The English fallback keeps components renderable outside AppProvider (tests).
const I18nContext = createContext<I18nValue>({
  locale: defaultLocale,
  t: messagesFor(defaultLocale),
  setLocale: async () => {},
});

export const I18nContextProvider = I18nContext.Provider;

export const useI18n = () => useContext(I18nContext);

export function writeLocaleCookie(locale: Locale) {
  document.cookie = `${localeCookieName}=${locale}; path=/; max-age=${localeCookieMaxAge}; samesite=lax`;
}

/** Supabase stores the browser session in readable `sb-<ref>-auth-token` cookies. */
export function hasSupabaseSessionCookie() {
  return /(?:^|;\s*)sb-[^=;]+-auth-token(?:\.\d+)?=/.test(document.cookie);
}

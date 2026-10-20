import "server-only";

import { cookies, headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import {
  defaultLocale,
  isLocale,
  localeCookieName,
  negotiateLocale,
  type Locale,
} from "@/i18n/config";
import { messagesFor } from "@/i18n/messages";

export async function getLocale(): Promise<Locale> {
  try {
    const value = (await cookies()).get(localeCookieName)?.value;
    if (isLocale(value)) return value;
    return negotiateLocale((await headers()).get("accept-language"));
  } catch (error) {
    // Let Next.js mark the route dynamic; outside a request, use the default.
    unstable_rethrow(error);
    return defaultLocale;
  }
}

export async function getMessages() {
  return messagesFor(await getLocale());
}

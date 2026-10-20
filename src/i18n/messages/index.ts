import type { Locale } from "@/i18n/config";
import { account } from "./account";
import { assessment } from "./assessment";
import { auth } from "./auth";
import { beta } from "./beta";
import { common } from "./common";
import { competencies } from "./competencies";
import { dashboard } from "./dashboard";
import { diagnostic } from "./diagnostic";
import { exam } from "./exam";
import { landing } from "./landing";
import { learn } from "./learn";
import { metadata } from "./metadata";
import { mistakes } from "./mistakes";
import { practice } from "./practice";

const namespaces = {
  account,
  assessment,
  auth,
  beta,
  common,
  competencies,
  dashboard,
  diagnostic,
  exam,
  landing,
  learn,
  metadata,
  mistakes,
  practice,
};

type Namespaces = typeof namespaces;
export type Messages = { [K in keyof Namespaces]: Namespaces[K]["en"] };

function compose(locale: Locale): Messages {
  return Object.fromEntries(
    Object.entries(namespaces).map(([key, value]) => [key, value[locale]]),
  ) as Messages;
}

const catalog: Record<Locale, Messages> = {
  en: compose("en"),
  fr: compose("fr"),
};

export const messagesFor = (locale: Locale): Messages => catalog[locale];

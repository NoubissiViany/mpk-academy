import type { DiagnosticTarget, Locale, PaidPlanId } from "@/types/domain";

export type { PaidPlanId } from "@/types/domain";
export type ProductPlanId = "free" | PaidPlanId;
export type PlanFeature =
  | "assessment"
  | "learning"
  | "practice"
  | "basicProgress"
  | "personalizedRecommendations"
  | "mistakeReview"
  | "examStrategies"
  | "mockExams"
  | "detailedReadiness"
  | "aiWritingFeedback";
export type PlanEntitlements = Readonly<Record<PlanFeature, boolean>>;

export interface ProductPlan {
  id: ProductPlanId;
  name: string;
  bestFor: string;
  highlights: readonly [string, string, string];
  priceMinor: number;
  targetNetMinor: number;
  approximate: boolean;
  paymentModel: string;
  access: string;
  accessMonths: number | null;
  purpose: string;
  cta: string;
  featured: boolean;
}

export const productConfig = {
  name: "MPK Academy",
  courseName: "French for Canadian Immigration — TEF/TCF Preparation",
  priceMinor: 25_675,
  currency: "CAD",
  stripeFeeAssumption: {
    percentageBps: 290,
    fixedMinor: 30,
  },
  supportedLanguages: ["en", "fr"] satisfies Locale[],
  storageKey: "mpk-academy:v1",
  storageNamespaceVersionKey: "mpk-academy:storage-version",
  storageNamespaceVersion: "4",
  anonymousStateStorageKey: "mpk-academy:anonymous-state:v2",
  accountsStorageKey: "mpk-academy:accounts:v1",
  sessionStorageKey: "mpk-academy:session:v1",
  userStateStoragePrefix: "mpk-academy:user-state:v1:",
  guestAssessmentStorageKey: "mpk-academy:guest-assessment:v2",
  guestAssessmentTtlMs: 7 * 24 * 60 * 60 * 1000,
  localeCookie: "mpk_locale",
} as const;

export const productPlans = [
  {
    id: "free",
    name: "Free",
    bestFor: "Discover your current level and weaknesses.",
    highlights: [
      "Assessment and results",
      "Basic weakness profile",
      "No payment required",
    ],
    priceMinor: 0,
    targetNetMinor: 0,
    approximate: false,
    paymentModel: "No payment required",
    access: "Assessment and results",
    accessMonths: null,
    purpose: "Discover your weaknesses",
    cta: "Start free assessment",
    featured: false,
  },
  {
    id: "essential",
    name: "Essential",
    bestFor: "Build your French foundations across all four skills.",
    highlights: [
      "Reading and listening practice with four-skill lessons",
      "English explanations and guided lessons",
      "Basic tracking with limited feedback",
    ],
    priceMinor: 12_286,
    targetNetMinor: 11_900,
    approximate: false,
    paymentModel: "One-time purchase",
    access: "3 months",
    accessMonths: 3,
    purpose: "Strengthen your French and all four skills",
    cta: "Choose Essential",
    featured: false,
  },
  {
    id: "complete",
    name: "Complete",
    bestFor: "Full personalized preparation from lessons to mock exams.",
    highlights: [
      "Personalized recommendations and full feedback",
      "TEF/TCF strategies and timed practice",
      "Mock exams and detailed readiness tracking",
    ],
    priceMinor: 25_675,
    targetNetMinor: 24_900,
    approximate: false,
    paymentModel: "One-time purchase",
    access: "6 months",
    accessMonths: 6,
    purpose: "Full personalized TEF/TCF preparation",
    cta: "Choose Complete",
    featured: true,
  },
] as const satisfies readonly ProductPlan[];

export const paidPlans = productPlans.filter(
  (plan): plan is (typeof productPlans)[number] & { id: PaidPlanId } =>
    plan.id !== "free",
);

const freeEntitlements: PlanEntitlements = {
  assessment: true,
  learning: false,
  practice: false,
  basicProgress: false,
  personalizedRecommendations: false,
  mistakeReview: false,
  examStrategies: false,
  mockExams: false,
  detailedReadiness: false,
  aiWritingFeedback: false,
};

const essentialEntitlements: PlanEntitlements = {
  ...freeEntitlements,
  learning: true,
  practice: true,
  basicProgress: true,
};

const completeEntitlements: PlanEntitlements = {
  ...essentialEntitlements,
  personalizedRecommendations: true,
  mistakeReview: true,
  examStrategies: true,
  mockExams: true,
  detailedReadiness: true,
  aiWritingFeedback: true,
};

export const planEntitlements: Readonly<
  Record<ProductPlanId, PlanEntitlements>
> = {
  free: freeEntitlements,
  essential: essentialEntitlements,
  complete: completeEntitlements,
  // Retired from sale; kept so historical entitlements keep their access.
  intensive: completeEntitlements,
};

const retiredPlans: Record<
  Exclude<PaidPlanId, OfferedPlanId>,
  { name: string; accessMonths: number }
> = {
  intensive: { name: "Intensive", accessMonths: 6 },
};

export type OfferedPlanId = (typeof paidPlans)[number]["id"];

export const isPaidPlanId = (value: unknown): value is PaidPlanId =>
  value === "essential" || value === "complete" || value === "intensive";

export const isOfferedPlanId = (value: unknown): value is OfferedPlanId =>
  paidPlans.some((plan) => plan.id === value);

export const getPaidPlan = (value?: string | string[]) => {
  const planId = Array.isArray(value) ? value[0] : value;
  return paidPlans.find((plan) => plan.id === planId);
};

export const planDisplayName = (planId: PaidPlanId) =>
  getPaidPlan(planId)?.name ??
  retiredPlans[planId as keyof typeof retiredPlans].name;

export const getActivePlanId = (
  planAccess: {
    planId: PaidPlanId;
  } | null,
): ProductPlanId => planAccess?.planId ?? "free";

export const hasPlanFeature = (
  planAccess: { planId: PaidPlanId } | null,
  feature: PlanFeature,
) => planEntitlements[getActivePlanId(planAccess)][feature];

export const recommendedPaidPlanId = (
  target?: DiagnosticTarget,
): OfferedPlanId => (target === "NCLC 5" ? "essential" : "complete");

/**
 * The closed beta hides pricing and checkout and grants access through invite
 * codes. It is on unless explicitly disabled, so a deployment can never start
 * selling by omission. Read at call time so tests can toggle it.
 */
export const isBetaMode = () => process.env.NEXT_PUBLIC_BETA_MODE !== "false";

export const contactEmail = () =>
  process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null;

export const formatPrice = (
  amountMinor: number = productConfig.priceMinor,
  locale: Locale = "en",
) =>
  new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: productConfig.currency,
    minimumFractionDigits: amountMinor % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);

export const formatPlanPrice = (
  plan: Pick<ProductPlan, "priceMinor" | "approximate">,
  locale: Locale = "en",
) => `${plan.approximate ? "~" : ""}${formatPrice(plan.priceMinor, locale)}`;

export const estimatedStripeFeeMinor = (amountMinor: number) =>
  Math.round(
    (amountMinor * productConfig.stripeFeeAssumption.percentageBps) / 10_000,
  ) + productConfig.stripeFeeAssumption.fixedMinor;

export function calculatePlanAccessUntil(
  planId: PaidPlanId,
  purchasedAt = new Date(),
) {
  const months =
    getPaidPlan(planId)?.accessMonths ??
    retiredPlans[planId as keyof typeof retiredPlans].accessMonths;
  const accessUntil = new Date(purchasedAt);
  const originalDay = accessUntil.getUTCDate();
  accessUntil.setUTCDate(1);
  accessUntil.setUTCMonth(accessUntil.getUTCMonth() + (months ?? 0));
  const lastDay = new Date(
    Date.UTC(accessUntil.getUTCFullYear(), accessUntil.getUTCMonth() + 1, 0),
  ).getUTCDate();
  accessUntil.setUTCDate(Math.min(originalDay, lastDay));
  return accessUntil;
}

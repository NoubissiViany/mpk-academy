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
  | "certificate";
export type PlanEntitlements = Readonly<Record<PlanFeature, boolean>>;

export interface ProductPlan {
  id: ProductPlanId;
  name: string;
  bestFor: string;
  highlights: readonly [string, string, string];
  price: number;
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
  price: 249,
  currency: "CAD",
  freeLessonCount: 3,
  supportedLanguages: ["en", "fr"] satisfies Locale[],
  storageKey: "mpk-academy:v1",
  storageNamespaceVersionKey: "mpk-academy:storage-version",
  storageNamespaceVersion: "4",
  anonymousStateStorageKey: "mpk-academy:anonymous-state:v2",
  accountsStorageKey: "mpk-academy:accounts:v1",
  sessionStorageKey: "mpk-academy:session:v1",
  userStateStoragePrefix: "mpk-academy:user-state:v1:",
  guestAssessmentStorageKey: "mpk-academy:guest-assessment:v1",
  guestAssessmentTtlMs: 7 * 24 * 60 * 60 * 1000,
  localeCookie: "mpk_locale",
  readinessDisclaimer:
    "MPK diagnostic readiness is a provisional learning indicator based on the latest assessment. It is not an official TEF/TCF score or immigration outcome.",
  certificateDisclaimer:
    "This is a course completion certificate, not an official TEF/TCF score or immigration credential.",
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
    price: 0,
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
    price: 119,
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
    price: 249,
    approximate: false,
    paymentModel: "One-time purchase",
    access: "6 months",
    accessMonths: 6,
    purpose: "Full personalized TEF/TCF preparation",
    cta: "Choose Complete",
    featured: true,
  },
  {
    id: "intensive",
    name: "Intensive",
    bestFor: "Candidates near exam day or preparing for a retake.",
    highlights: [
      "Everything in Complete",
      "Higher writing and speaking feedback limits coming later",
      "Additional mock-attempt capacity coming later",
    ],
    price: 349,
    approximate: false,
    paymentModel: "One-time purchase",
    access: "6 months",
    accessMonths: 6,
    purpose: "Full preparation with future higher feedback and mock limits",
    cta: "Choose Intensive",
    featured: false,
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
  certificate: false,
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
  certificate: true,
};

export const planEntitlements: Readonly<
  Record<ProductPlanId, PlanEntitlements>
> = {
  free: freeEntitlements,
  essential: essentialEntitlements,
  complete: completeEntitlements,
  intensive: completeEntitlements,
};

export const isPaidPlanId = (value: unknown): value is PaidPlanId =>
  value === "essential" || value === "complete" || value === "intensive";

export const getPaidPlan = (value?: string | string[]) => {
  const planId = Array.isArray(value) ? value[0] : value;
  return paidPlans.find((plan) => plan.id === planId);
};

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
): PaidPlanId => {
  if (target === "NCLC 5") return "essential";
  if (target === "NCLC 9+") return "intensive";
  return "complete";
};

export const featureFlags = {
  enableReadiness: true,
  enableExamMode: true,
  enableMistakeReview: true,
  enableCertificate: true,
} as const;

export const formatPrice = (
  amount: number = productConfig.price,
  locale: Locale = "en",
) =>
  new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: productConfig.currency,
    maximumFractionDigits: 0,
  }).format(amount);

export const formatPlanPrice = (
  plan: Pick<ProductPlan, "price" | "approximate">,
  locale: Locale = "en",
) => `${plan.approximate ? "~" : ""}${formatPrice(plan.price, locale)}`;

export function calculatePlanAccessUntil(
  planId: PaidPlanId,
  purchasedAt = new Date(),
) {
  const months = paidPlans.find((plan) => plan.id === planId)!.accessMonths;
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

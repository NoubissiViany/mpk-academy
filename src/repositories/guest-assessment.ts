import { productConfig } from "@/config/product";
import type { GuestAssessmentSession } from "@/types/domain";
import type {
  GuestAssessmentRepository,
  GuestAssessmentSessionInput,
} from "@/repositories/contracts";

function storage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

function isGuestAssessmentSession(
  value: unknown,
): value is GuestAssessmentSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<GuestAssessmentSession>;
  return Boolean(
    typeof session.id === "string" &&
    typeof session.createdAt === "string" &&
    typeof session.expiresAt === "string" &&
    (session.status === "active" || session.status === "claimed") &&
    session.intake &&
    session.answers &&
    session.result &&
    session.activity &&
    (session.recommendedPlanId === "essential" ||
      session.recommendedPlanId === "complete" ||
      session.recommendedPlanId === "intensive"),
  );
}

function readStoredSession(): GuestAssessmentSession | null {
  const target = storage();
  if (!target) return null;
  try {
    const value: unknown = JSON.parse(
      target.getItem(productConfig.guestAssessmentStorageKey) ?? "null",
    );
    if (isGuestAssessmentSession(value)) return value;
  } catch {
    /* Invalid temporary state is discarded below. */
  }
  target.removeItem(productConfig.guestAssessmentStorageKey);
  return null;
}

function isExpired(session: GuestAssessmentSession) {
  return Date.parse(session.expiresAt) <= Date.now();
}

function writeSession(session: GuestAssessmentSession) {
  const target = storage();
  if (!target) throw new Error("Guest assessment storage is unavailable.");
  target.setItem(
    productConfig.guestAssessmentStorageKey,
    JSON.stringify(session),
  );
}

function clearStoredSession(sessionId?: string) {
  const target = storage();
  if (!target) return;
  if (sessionId) {
    const session = readStoredSession();
    if (session && session.id !== sessionId) return;
  }
  target.removeItem(productConfig.guestAssessmentStorageKey);
}

export const guestAssessmentRepository: GuestAssessmentRepository = {
  async create(input: GuestAssessmentSessionInput) {
    const createdAt = new Date();
    const session: GuestAssessmentSession = {
      ...structuredClone(input),
      id: crypto.randomUUID(),
      createdAt: createdAt.toISOString(),
      expiresAt: new Date(
        createdAt.getTime() + productConfig.guestAssessmentTtlMs,
      ).toISOString(),
      status: "active",
    };
    writeSession(session);
    return session;
  },

  async getActive() {
    const session = readStoredSession();
    if (!session) return null;
    if (isExpired(session)) {
      clearStoredSession(session.id);
      return null;
    }
    return session.status === "active" ? session : null;
  },

  async claim(sessionId, userId) {
    const session = readStoredSession();
    if (!session || session.id !== sessionId) return null;
    if (isExpired(session)) {
      clearStoredSession(session.id);
      return null;
    }
    if (session.status === "claimed") {
      return session.claimedByUserId === userId ? session : null;
    }
    const claimed: GuestAssessmentSession = {
      ...session,
      status: "claimed",
      claimedByUserId: userId,
      claimedAt: new Date().toISOString(),
    };
    writeSession(claimed);
    return claimed;
  },

  async clear(sessionId) {
    clearStoredSession(sessionId);
  },
};

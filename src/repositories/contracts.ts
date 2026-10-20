import type { GuestAssessmentSession } from "@/types/domain";

export type GuestAssessmentSessionInput = Omit<
  GuestAssessmentSession,
  "id" | "createdAt" | "expiresAt" | "status" | "claimedByUserId" | "claimedAt"
>;

export interface GuestAssessmentRepository {
  create(input: GuestAssessmentSessionInput): Promise<GuestAssessmentSession>;
  getActive(): Promise<GuestAssessmentSession | null>;
  claim(
    sessionId: string,
    userId: string,
  ): Promise<GuestAssessmentSession | null>;
  clear(sessionId?: string): Promise<void>;
}

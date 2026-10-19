import type { CandidateItem, MockManifest } from "@/content/shared/types";
export interface MockState {
  status: "in_progress" | "completed";
  sectionIndex: number;
  itemIndex: number;
  deadline: number;
  taskDeadline: number | null;
  taskStartedAt: number;
  audioUntil: number | null;
  answers: Record<string, string>;
  consumedAudio: string[];
}
export interface MockSessionPayload {
  id: string;
  manifestId: string;
  state: MockState;
  assessmentId: string | null;
  item?: CandidateItem;
  manifest: MockManifest;
  serverNow: number;
}

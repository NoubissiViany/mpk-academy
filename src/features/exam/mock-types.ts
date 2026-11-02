import { canSubmitWriting } from "@/lib/domain/writing-checks";
import type { CandidateItem, MockManifest } from "@/content/shared/types";
export interface MockState {
  status: "in_progress" | "completed";
  incompleteWritingIds?: string[];
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
  optionOrder?: Record<string, string[]>;
  writingMinimums?: Record<string, number>;
  assessmentId: string | null;
  item?: CandidateItem;
  manifest: MockManifest;
  serverNow: number;
}

/** Free navigation saves drafts; only irreversible exits require completed text. */
export function canAdvanceWriting(
  session: MockSessionPayload,
  draft: string,
): boolean {
  if (session.item?.kind !== "writing") return true;
  const section = session.manifest.sections[session.state.sectionIndex];
  const last = session.state.itemIndex === section.itemIds.length - 1;
  if (section.navigation === "free" && !last) return true;
  const ids =
    section.navigation === "free" ? section.itemIds : [session.item.id];
  return ids.every((id) => {
    const minimum =
      session.writingMinimums?.[id] ??
      (id === session.item?.id ? session.item.wordCount?.min : undefined);
    return canSubmitWriting(
      id === session.item?.id ? draft : (session.state.answers[id] ?? ""),
      minimum === undefined ? undefined : { min: minimum },
    );
  });
}

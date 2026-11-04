import {
  createDiagnosticDraft,
  diagnosticDraftSchema,
  diagnosticDraftTtl,
  type DiagnosticDraft,
} from "@/lib/domain/diagnostic-draft";
import { clearAnonymousState, loadAnonymousState } from "@/lib/persistence";
import type { PublicQuestion } from "@/types/domain";

export const diagnosticDraftStorageKey = "mpk-academy:diagnostic-draft:v1";

export class DraftConflict extends Error {}

/** Serialize browser writes across tabs before checking the stored revision. */
export async function withGuestDraftLock<T>(operation: () => T): Promise<T> {
  return typeof navigator !== "undefined" && navigator.locks
    ? navigator.locks.request(diagnosticDraftStorageKey, operation)
    : operation();
}

export const guestDiagnosticDraft = {
  load(questions?: PublicQuestion[]): DiagnosticDraft | null {
    const raw = localStorage.getItem(diagnosticDraftStorageKey);
    if (raw) {
      const parsed = diagnosticDraftSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) throw new Error("Invalid assessment draft");
      if (Date.parse(parsed.data.expiresAt) <= Date.now()) {
        localStorage.removeItem(diagnosticDraftStorageKey);
        clearAnonymousState();
        return null;
      }
      return parsed.data;
    }
    if (questions) {
      const legacy = loadAnonymousState();
      if (!legacy.diagnosticResult && legacy.diagnosticIntake) {
        return this.save(
          createDiagnosticDraft(
            questions,
            legacy.diagnosticIntake,
            legacy.diagnosticAnswers,
          ),
        );
      }
    }
    return null;
  },
  save(draft: DiagnosticDraft): DiagnosticDraft {
    const existing = this.load();
    if (
      existing
        ? existing.id !== draft.id || existing.revision !== draft.revision
        : draft.revision !== 0
    )
      throw new DraftConflict("Assessment changed in another tab");
    const now = new Date();
    const saved = diagnosticDraftSchema.parse({
      ...draft,
      revision: draft.revision + 1,
      updatedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + diagnosticDraftTtl).toISOString(),
    });
    localStorage.setItem(diagnosticDraftStorageKey, JSON.stringify(saved));
    clearAnonymousState();
    return saved;
  },
  discard(id: string, revision: number) {
    const existing = this.load();
    if (existing && (existing.id !== id || existing.revision !== revision))
      throw new DraftConflict("Assessment changed in another tab");
    localStorage.removeItem(diagnosticDraftStorageKey);
    clearAnonymousState();
  },
};

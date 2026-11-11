import {
  createDiagnosticDraft,
  diagnosticDraftSchema,
  diagnosticDraftTtl,
  preservesCheckedAnswers,
  type DiagnosticDraft,
} from "@/lib/domain/diagnostic-draft";
import { clearAnonymousState, loadAnonymousState } from "@/lib/persistence";
import type { PublicQuestion } from "@/types/domain";

export const legacyDiagnosticDraftStorageKey =
  "mpk-academy:diagnostic-draft:v1";
export const diagnosticDraftStorageKey = "mpk-academy:diagnostic-draft:v2";

export class DraftConflict extends Error {}

/** Serialize browser writes across tabs before checking the stored revision. */
export async function withGuestDraftLock<T>(operation: () => T): Promise<T> {
  return typeof navigator !== "undefined" && navigator.locks
    ? navigator.locks.request(legacyDiagnosticDraftStorageKey, operation)
    : operation();
}

function removeMigratedCopy(raw: string) {
  // After an interrupted migration, only delete the exact copy we imported.
  // A tab still running the old app may have started different work in v1.
  if (localStorage.getItem(legacyDiagnosticDraftStorageKey) === raw)
    localStorage.removeItem(legacyDiagnosticDraftStorageKey);
}

/** Call mutations and legacy-loading under withGuestDraftLock across tabs. */
export const guestDiagnosticDraft = {
  load(questions?: PublicQuestion[]): DiagnosticDraft | null {
    const currentRaw = localStorage.getItem(diagnosticDraftStorageKey);
    const raw =
      currentRaw ?? localStorage.getItem(legacyDiagnosticDraftStorageKey);
    if (raw) {
      const parsed = diagnosticDraftSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) throw new Error("Invalid assessment draft");
      if (Date.parse(parsed.data.expiresAt) <= Date.now()) {
        localStorage.removeItem(diagnosticDraftStorageKey);
        removeMigratedCopy(raw);
        clearAnonymousState();
        return null;
      }
      // Preserve the original attempt, revision and expiry exactly. The new
      // key prevents pre-release parsers from stripping checked markers.
      if (!currentRaw) localStorage.setItem(diagnosticDraftStorageKey, raw);
      removeMigratedCopy(raw);
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
    if (existing && !preservesCheckedAnswers(existing, draft))
      throw new Error("Checked answers cannot be changed");
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

import { productConfig } from "@/config/product";
import { getDiagnosticDraftAction } from "@/app/actions/diagnostic-draft";
import { guestDiagnosticDraft } from "@/repositories/diagnostic-draft";

/** Route a signed-in learner to an explicit choice; never merge drafts here. */
export async function hasPendingAssessment() {
  try {
    if (guestDiagnosticDraft.load()) return true;
    const legacy = JSON.parse(
      localStorage.getItem(productConfig.anonymousStateStorageKey) ?? "null",
    );
    if (
      legacy?.schemaVersion === 5 &&
      legacy.diagnosticIntake &&
      !legacy.diagnosticResult
    )
      return true;
  } catch {
    /* Browser storage may be unavailable; account recovery still works. */
  }
  try {
    const result = await getDiagnosticDraftAction();
    return result.ok && Boolean(result.draft);
  } catch {
    return false;
  }
}

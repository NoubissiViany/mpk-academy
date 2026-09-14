import { defaultState } from "@/data/mock-state";
import { productConfig } from "@/config/product";
import { diagnosticQuestions } from "@/data/questions";
import { scoreDiagnostic } from "@/lib/domain/diagnostic";
import type { AppState } from "@/types/domain";

export function loadState(): AppState {
  if (typeof window === "undefined") return structuredClone(defaultState);
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(productConfig.storageKey) ?? "null",
    );
    if (value && typeof value === "object" && "schemaVersion" in value) {
      if (value.schemaVersion === 2) return value as AppState;
      if (value.schemaVersion === 1) {
        const legacy = value as unknown as Omit<
          AppState,
          "schemaVersion" | "diagnosticIntake" | "diagnosticResult"
        > & { diagnosticResult: unknown };
        return {
          ...legacy,
          schemaVersion: 2,
          diagnosticIntake: null,
          diagnosticResult: legacy.diagnosticResult
            ? scoreDiagnostic(
                diagnosticQuestions,
                legacy.diagnosticAnswers ?? {},
              )
            : null,
        };
      }
    }
  } catch {
    /* Invalid mock data falls back to a safe seed. */
  }
  return structuredClone(defaultState);
}

export function saveState(state: AppState) {
  if (typeof window !== "undefined")
    localStorage.setItem(productConfig.storageKey, JSON.stringify(state));
}

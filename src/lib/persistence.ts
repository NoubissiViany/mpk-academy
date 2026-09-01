import { defaultState } from "@/data/mock-state";
import { productConfig } from "@/config/product";
import type { AppState } from "@/types/domain";

export function loadState(): AppState {
  if (typeof window === "undefined") return structuredClone(defaultState);
  try {
    const value: unknown = JSON.parse(localStorage.getItem(productConfig.storageKey) ?? "null");
    if (value && typeof value === "object" && "schemaVersion" in value && value.schemaVersion === 1) return value as AppState;
  } catch { /* Invalid mock data falls back to a safe seed. */ }
  return structuredClone(defaultState);
}

export function saveState(state: AppState) {
  if (typeof window !== "undefined") localStorage.setItem(productConfig.storageKey, JSON.stringify(state));
}

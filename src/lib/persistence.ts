import { productConfig } from "@/config/product";
import { defaultState } from "@/data/mock-state";
import type { AppState } from "@/types/domain";

function storage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function ensureStorageNamespace() {
  const target = storage();
  if (!target) return;
  if (
    target.getItem(productConfig.storageNamespaceVersionKey) ===
    productConfig.storageNamespaceVersion
  )
    return;

  target.removeItem(productConfig.storageKey);
  target.removeItem(productConfig.anonymousStateStorageKey);
  target.removeItem(productConfig.accountsStorageKey);
  target.removeItem(productConfig.sessionStorageKey);
  for (let index = target.length - 1; index >= 0; index -= 1) {
    const key = target.key(index);
    if (key?.startsWith(productConfig.userStateStoragePrefix))
      target.removeItem(key);
  }
  target.setItem(
    productConfig.storageNamespaceVersionKey,
    productConfig.storageNamespaceVersion,
  );
}

function anonymousState(state: Partial<AppState>): AppState {
  return {
    ...structuredClone(defaultState),
    checkoutIntentPlanId: null,
    diagnosticIntake: state.diagnosticIntake ?? null,
    diagnosticAnswers:
      state.diagnosticAnswers && typeof state.diagnosticAnswers === "object"
        ? state.diagnosticAnswers
        : {},
    diagnosticResult: state.diagnosticResult ?? null,
  };
}

function parseState(value: string | null): AppState | null {
  try {
    const parsed: unknown = JSON.parse(value ?? "null");
    if (
      parsed &&
      typeof parsed === "object" &&
      (parsed as Partial<AppState>).schemaVersion === 5
    )
      return anonymousState(parsed as Partial<AppState>);
  } catch {
    /* Invalid browser data falls back to a clean learner state. */
  }
  return null;
}

export function loadAnonymousState() {
  ensureStorageNamespace();
  const target = storage();
  if (!target) return structuredClone(defaultState);
  return (
    parseState(target.getItem(productConfig.anonymousStateStorageKey)) ??
    structuredClone(defaultState)
  );
}

export function clearAnonymousState() {
  ensureStorageNamespace();
  storage()?.removeItem(productConfig.anonymousStateStorageKey);
}

export function loadState(): AppState {
  return loadAnonymousState();
}

export function saveState(state: AppState) {
  ensureStorageNamespace();
  const target = storage();
  if (!target) return;
  if (state.user) {
    target.removeItem(productConfig.anonymousStateStorageKey);
    return;
  }
  target.setItem(
    productConfig.anonymousStateStorageKey,
    JSON.stringify(anonymousState(state)),
  );
}

export const persistenceMigration = { ensureStorageNamespace };

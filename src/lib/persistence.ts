import { productConfig } from "@/config/product";
import { defaultState } from "@/data/mock-state";
import type { AppState, LocalAccount, LocalSession } from "@/types/domain";

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
  target.removeItem(productConfig.guestAssessmentStorageKey);
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

function parseState(value: string | null): AppState | null {
  try {
    const parsed: unknown = JSON.parse(value ?? "null");
    if (
      parsed &&
      typeof parsed === "object" &&
      (parsed as Partial<AppState>).schemaVersion === 5
    )
      return {
        ...structuredClone(defaultState),
        ...(parsed as AppState),
        schemaVersion: 5,
      };
  } catch {
    /* Invalid browser data falls back to a clean learner state. */
  }
  return null;
}

function readSession(): LocalSession | null {
  const target = storage();
  if (!target) return null;
  try {
    const value: unknown = JSON.parse(
      target.getItem(productConfig.sessionStorageKey) ?? "null",
    );
    if (
      value &&
      typeof value === "object" &&
      typeof (value as LocalSession).userId === "string" &&
      typeof (value as LocalSession).createdAt === "string"
    )
      return value as LocalSession;
  } catch {
    /* Invalid sessions are cleared below. */
  }
  target.removeItem(productConfig.sessionStorageKey);
  return null;
}

export function userStateStorageKey(userId: string) {
  return `${productConfig.userStateStoragePrefix}${userId}`;
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

export function loadUserState(userId: string) {
  ensureStorageNamespace();
  const target = storage();
  if (!target) return null;
  const state = parseState(target.getItem(userStateStorageKey(userId)));
  return state?.user?.id === userId ? state : null;
}

export function loadState(): AppState {
  ensureStorageNamespace();
  const session = readSession();
  if (session) {
    const state = loadUserState(session.userId);
    if (state) return state;
    storage()?.removeItem(productConfig.sessionStorageKey);
  }
  return loadAnonymousState();
}

export function saveUserState(state: AppState) {
  ensureStorageNamespace();
  const target = storage();
  if (!target || !state.user) return;
  target.setItem(userStateStorageKey(state.user.id), JSON.stringify(state));
  try {
    const accounts: unknown = JSON.parse(
      target.getItem(productConfig.accountsStorageKey) ?? "[]",
    );
    if (Array.isArray(accounts)) {
      const next = (accounts as LocalAccount[]).map((account) =>
        account.user.id === state.user!.id
          ? { ...account, user: state.user! }
          : account,
      );
      target.setItem(productConfig.accountsStorageKey, JSON.stringify(next));
    }
  } catch {
    /* A malformed account registry is handled by the auth repository. */
  }
}

export function saveState(state: AppState) {
  ensureStorageNamespace();
  const target = storage();
  if (!target) return;
  const session = readSession();
  if (session && state.user?.id === session.userId) {
    saveUserState(state);
    return;
  }
  target.setItem(productConfig.anonymousStateStorageKey, JSON.stringify(state));
}

export const persistenceMigration = { ensureStorageNamespace };

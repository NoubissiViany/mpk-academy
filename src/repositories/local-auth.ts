import { productConfig } from "@/config/product";
import { ensureStorageNamespace } from "@/lib/persistence";
import type { AuthRepository } from "@/repositories/contracts";
import type { LocalAccount, LocalSession, User } from "@/types/domain";

const passwordIterations = 210_000;

export class LocalAuthError extends Error {
  constructor(
    public readonly code: "duplicate_email" | "invalid_credentials",
    message: string,
  ) {
    super(message);
    this.name = "LocalAuthError";
  }
}

function storage() {
  ensureStorageNamespace();
  if (typeof window === "undefined")
    throw new Error("Local authentication is only available in the browser.");
  return window.localStorage;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function bytesToBase64(value: Uint8Array) {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return window.btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = window.atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function derivePassword(
  password: string,
  salt: ArrayBuffer,
  iterations: number,
) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    256,
  );
  return new Uint8Array(bits);
}

function readAccounts(): LocalAccount[] {
  try {
    const value: unknown = JSON.parse(
      storage().getItem(productConfig.accountsStorageKey) ?? "[]",
    );
    return Array.isArray(value) ? (value as LocalAccount[]) : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: LocalAccount[]) {
  storage().setItem(productConfig.accountsStorageKey, JSON.stringify(accounts));
}

function writeSession(userId: string) {
  const session: LocalSession = {
    userId,
    createdAt: new Date().toISOString(),
  };
  storage().setItem(productConfig.sessionStorageKey, JSON.stringify(session));
}

function equalBytes(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1)
    difference |= left[index] ^ right[index];
  return difference === 0;
}

export const localAuthRepository: AuthRepository = {
  async register(input) {
    const normalizedEmail = normalizeEmail(input.email);
    const accounts = readAccounts();
    if (accounts.some((account) => account.normalizedEmail === normalizedEmail))
      throw new LocalAuthError(
        "duplicate_email",
        "An account with this email already exists.",
      );

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const passwordHash = await derivePassword(
      input.password,
      salt.buffer as ArrayBuffer,
      passwordIterations,
    );
    const user: User = {
      id: crypto.randomUUID(),
      firstName: input.firstName,
      lastName: input.lastName,
      email: normalizedEmail,
      tier: "free_student",
      locale: input.locale,
      assistance: input.assistance,
      goal: input.goal,
    };
    accounts.push({
      user,
      normalizedEmail,
      passwordHash: bytesToBase64(passwordHash),
      passwordSalt: bytesToBase64(salt),
      passwordIterations,
      createdAt: new Date().toISOString(),
    });
    writeAccounts(accounts);
    writeSession(user.id);
    return user;
  },

  async login(email, password) {
    const account = readAccounts().find(
      (candidate) => candidate.normalizedEmail === normalizeEmail(email),
    );
    if (!account)
      throw new LocalAuthError(
        "invalid_credentials",
        "The email or password is incorrect.",
      );
    const candidate = await derivePassword(
      password,
      base64ToBytes(account.passwordSalt).buffer as ArrayBuffer,
      account.passwordIterations,
    );
    if (!equalBytes(candidate, base64ToBytes(account.passwordHash)))
      throw new LocalAuthError(
        "invalid_credentials",
        "The email or password is incorrect.",
      );
    writeSession(account.user.id);
    return account.user;
  },

  async logout() {
    storage().removeItem(productConfig.sessionStorageKey);
  },
};

import { z } from "zod";

export const inviteCodeSchema = z
  .string()
  .trim()
  .min(6)
  .max(40)
  .regex(/^[A-Za-z0-9\s-]+$/);

export const inviteCheckStatusSchema = z.enum([
  "valid",
  "invalid",
  "expired",
  "exhausted",
  "beta_full",
]);

export type InviteCheckStatus = z.infer<typeof inviteCheckStatusSchema>;

const codeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** 8 random characters from a 32-symbol alphabet: 40 bits, readable aloud. */
export function generateInviteCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const chars = Array.from(bytes, (byte) => codeAlphabet[byte % 32]).join("");
  return `MPK-${chars.slice(0, 4)}-${chars.slice(4)}`;
}

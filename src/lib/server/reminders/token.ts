import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
const claims = z.object({
  userId: z.uuid(),
  version: z.uuid(),
  locale: z.enum(["en", "fr"]),
});
function secret() {
  const key = process.env.STUDY_REMINDER_UNSUBSCRIBE_SECRET;
  if (!key || key.length < 32)
    throw new Error("Reminder unsubscribe secret is not configured");
  return key;
}
export function signUnsubscribe(input: z.infer<typeof claims>) {
  const payload = Buffer.from(JSON.stringify(claims.parse(input))).toString(
    "base64url",
  );
  return `${payload}.${createHmac("sha256", secret()).update(`reminder-unsubscribe:${payload}`).digest("base64url")}`;
}
export function verifyUnsubscribe(token: string) {
  if (token.length > 1024) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;
  const expected = createHmac("sha256", secret())
    .update(`reminder-unsubscribe:${payload}`)
    .digest();
  const received = Buffer.from(signature, "base64url");
  if (
    received.length !== expected.length ||
    !timingSafeEqual(received, expected)
  )
    return null;
  try {
    return claims.parse(
      JSON.parse(Buffer.from(payload, "base64url").toString()),
    );
  } catch {
    return null;
  }
}

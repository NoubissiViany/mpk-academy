import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
const { rpc } = vi.hoisted(() => ({
  rpc: vi.fn().mockResolvedValue({ error: null }),
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ rpc }) }));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
function signed(body: string, age = 0) {
  const key = Buffer.from("a-webhook-key-for-tests-only").toString("base64");
  vi.stubEnv("RESEND_REMINDER_WEBHOOK_SECRET", `whsec_${key}`);
  const id = "evt_test";
  const timestamp = String(Math.floor(Date.now() / 1000) - age);
  const signature = createHmac("sha256", Buffer.from(key, "base64"))
    .update(`${id}.${timestamp}.${body}`)
    .digest("base64");
  return new Request("https://mpkacademy.com/api/webhooks/resend", {
    method: "POST",
    body,
    headers: {
      "svix-id": id,
      "svix-timestamp": timestamp,
      "svix-signature": `v1,${signature}`,
    },
  });
}
describe("Resend webhook", () => {
  const body = JSON.stringify({
    type: "email.bounced",
    data: {
      email_id: "provider-id",
      to: ["learner@example.test"],
      tags: { delivery_id: "00000000-0000-4000-8000-000000000001" },
    },
  });
  it("verifies the raw payload before applying suppression", async () => {
    expect((await POST(signed(body))).status).toBe(200);
    expect(rpc).toHaveBeenCalledWith(
      "mpk_reminder_webhook",
      expect.objectContaining({
        p_type: "email.bounced",
        p_event_id: "evt_test",
        p_email: "learner@example.test",
      }),
    );
  });
  it("rejects modified signatures and old requests without touching the database", async () => {
    const request = signed(body);
    request.headers.set("svix-signature", "v1,invalid");
    expect((await POST(request)).status).toBe(400);
    expect((await POST(signed(body, 600))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("asks the provider to retry storage errors", async () => {
    rpc.mockResolvedValueOnce({ error: { message: "offline" } });
    expect((await POST(signed(body))).status).toBe(503);
  });
});

import { afterEach, expect, it, vi } from "vitest";
import { GET, POST } from "./route";
import { signUnsubscribe } from "@/lib/server/reminders/token";
const { rpc } = vi.hoisted(() => ({
  rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ rpc }) }));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
it("GET confirms without mutation; mailbox one-click POST opts out", async () => {
  vi.stubEnv(
    "STUDY_REMINDER_UNSUBSCRIBE_SECRET",
    "test-secret-longer-than-thirty-two-characters",
  );
  const token = signUnsubscribe({
    userId: "00000000-0000-4000-8000-000000000001",
    version: "00000000-0000-4000-8000-000000000002",
    locale: "fr",
  });
  const url = `https://mpkacademy.com/email-preferences/unsubscribe?token=${token}`;
  const get = await GET(new Request(url));
  expect(await get.text()).toContain("Me désabonner");
  expect(rpc).not.toHaveBeenCalled();
  const post = await POST(
    new Request(url, { method: "POST", body: "List-Unsubscribe=One-Click" }),
  );
  expect(post.status).toBe(200);
  expect(rpc).toHaveBeenCalledOnce();
  expect(await post.text()).toContain("désactivés");
});

import { beforeEach, expect, it, vi } from "vitest";
import { createDiagnosticDraft } from "@/lib/domain/diagnostic-draft";
import { getPublicDiagnosticQuestions } from "@/lib/server/content";
import { guestDiagnosticDraft } from "@/repositories/diagnostic-draft";
const load = vi.hoisted(() => vi.fn());
vi.mock("@/app/actions/diagnostic-draft", () => ({
  getDiagnosticDraftAction: load,
}));
import { hasPendingAssessment } from "./pending-assessment";
beforeEach(() => {
  localStorage.clear();
  load.mockReset();
});
it("preserves a browser draft for the post-login choice", async () => {
  const draft = guestDiagnosticDraft.save(
    createDiagnosticDraft(getPublicDiagnosticQuestions()),
  );
  expect(await hasPendingAssessment()).toBe(true);
  expect(guestDiagnosticDraft.load()).toEqual(draft);
  expect(load).not.toHaveBeenCalled();
});
it("finds an account draft after signing in on a different device", async () => {
  load.mockResolvedValue({
    ok: true,
    draft: createDiagnosticDraft(getPublicDiagnosticQuestions()),
  });
  expect(await hasPendingAssessment()).toBe(true);
  expect(localStorage.length).toBe(0);
});
it("retains the normal beta or paid onboarding destination without a draft", async () => {
  load.mockResolvedValue({ ok: true, draft: null });
  expect(await hasPendingAssessment()).toBe(false);
  load.mockResolvedValue({ ok: false, reason: "unavailable" });
  expect(await hasPendingAssessment()).toBe(false);
});

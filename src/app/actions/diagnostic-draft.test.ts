import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDiagnosticDraft } from "@/lib/domain/diagnostic-draft";
import { getPublicDiagnosticQuestions } from "@/lib/server/content";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), rpc: vi.fn() }));
vi.mock("@/lib/supabase/learner", () => ({ requireUserId: mocks.auth }));
import {
  getDiagnosticDraftAction,
  saveDiagnosticDraftAction,
  discardDiagnosticDraftAction,
} from "./diagnostic-draft";
const userId = "dd000000-0000-4000-8000-000000000001";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ userId, supabase: { rpc: mocks.rpc } });
});
describe("authenticated draft actions", () => {
  it("validates content and identity before saving", async () => {
    const draft = createDiagnosticDraft(getPublicDiagnosticQuestions());
    expect(
      await saveDiagnosticDraftAction(
        { ...draft, contentVersion: "old" },
        userId,
      ),
    ).toEqual({ ok: false, reason: "invalid" });
    expect(await saveDiagnosticDraftAction(draft, "previous-account")).toEqual({
      ok: false,
      reason: "unavailable",
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
    mocks.rpc.mockResolvedValue({
      data: { ...draft, revision: 1 },
      error: null,
    });
    expect(await saveDiagnosticDraftAction(draft, userId)).toMatchObject({
      ok: true,
      draft: { id: draft.id, revision: 1 },
    });
    expect(mocks.rpc).toHaveBeenCalledWith("mpk_save_diagnostic_draft", {
      p_draft: draft,
      p_revision: 0,
    });
  });
  it("reports revision conflicts separately from unavailable storage", async () => {
    const draft = createDiagnosticDraft(getPublicDiagnosticQuestions());
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "40001" } });
    expect(await saveDiagnosticDraftAction(draft, userId)).toEqual({
      ok: false,
      reason: "conflict",
    });
    expect(await discardDiagnosticDraftAction(draft.id, 3, userId)).toEqual({
      ok: false,
      reason: "conflict",
    });
    mocks.auth.mockRejectedValue(new Error("Unauthorized"));
    expect(await getDiagnosticDraftAction()).toEqual({
      ok: false,
      reason: "unavailable",
    });
  });
});

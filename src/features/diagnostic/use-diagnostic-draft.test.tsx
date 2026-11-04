import { act, renderHook, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { diagnosticQuestions } from "@/data/questions";
import { toPublicQuestion } from "@/lib/server/content";
import {
  createDiagnosticDraft,
  type DiagnosticDraft,
} from "@/lib/domain/diagnostic-draft";
import {
  guestDiagnosticDraft,
  diagnosticDraftStorageKey,
} from "@/repositories/diagnostic-draft";
import { useDiagnosticDraft } from "./use-diagnostic-draft";

const mocks = vi.hoisted(() => ({
  load: vi.fn(),
  save: vi.fn(),
  discard: vi.fn(),
}));
vi.mock("@/app/actions/diagnostic-draft", () => ({
  getDiagnosticDraftAction: mocks.load,
  saveDiagnosticDraftAction: mocks.save,
  discardDiagnosticDraftAction: mocks.discard,
}));
const questions = diagnosticQuestions.map(toPublicQuestion);
const uid = "aa000000-0000-4000-8000-000000000001";
let cloud: DiagnosticDraft | null;
beforeEach(() => {
  localStorage.clear();
  cloud = null;
  mocks.load.mockImplementation(async () => ({ ok: true, draft: cloud }));
  mocks.save.mockImplementation(async (draft: DiagnosticDraft) => {
    if (draft.revision !== (cloud?.revision ?? 0))
      return { ok: false, reason: "conflict" };
    cloud = { ...draft, revision: draft.revision + 1 };
    return { ok: true, draft: cloud };
  });
  mocks.discard.mockImplementation(async () => {
    cloud = null;
    return { ok: true, draft: null };
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});
async function ready(userId?: string) {
  const hook = renderHook(() => useDiagnosticDraft(questions, userId));
  await waitFor(() => expect(hook.result.current.status).toBe("idle"));
  return hook;
}

describe("assessment recovery", () => {
  it("restores a guest draft after navigation, with the same order and writing", async () => {
    const first = await ready();
    const draft = createDiagnosticDraft(questions);
    draft.intake.writingSample = {
      version: "mpk-diagnostic-writing-v1",
      text: "Mon brouillon",
    };
    act(() => first.result.current.change(draft, true));
    await act(async () => {
      await first.result.current.flush();
    });
    first.unmount();
    const second = await ready();
    const choice = second.result.current.choices[0];
    await act(async () => {
      await second.result.current.resume(choice);
    });
    expect(second.result.current.draft).toMatchObject({
      id: draft.id,
      questionOrder: draft.questionOrder,
      optionOrder: draft.optionOrder,
      intake: draft.intake,
    });
  });
  it("syncs across devices without putting authenticated drafts in browser storage", async () => {
    const first = await ready(uid);
    const draft = createDiagnosticDraft(questions);
    act(() => first.result.current.change(draft));
    await waitFor(() => expect(first.result.current.status).toBe("saved"));
    expect(localStorage.getItem(diagnosticDraftStorageKey)).toBeNull();
    first.unmount();
    const second = await ready(uid);
    expect(second.result.current.choices).toEqual([
      { source: "account", draft: cloud },
    ]);
    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: draft.id }),
      uid,
    );
  });
  it("offers both drafts and does not overwrite either before an explicit choice", async () => {
    const browser = guestDiagnosticDraft.save(
      createDiagnosticDraft(questions, { target: "NCLC 5" }),
    );
    cloud = {
      ...createDiagnosticDraft(questions, { target: "NCLC 9+" }),
      revision: 3,
    };
    const first = await ready(uid);
    expect(first.result.current.choices).toHaveLength(2);
    expect(mocks.save).not.toHaveBeenCalled();
    await act(async () => {
      await first.result.current.resume(first.result.current.choices[1]);
    });
    expect(cloud?.intake).toEqual(browser.intake);
    expect(guestDiagnosticDraft.load()).toBeNull();
  });
  it("retains edits on a failed save and retries the same attempt", async () => {
    const hook = await ready(uid);
    mocks.save.mockResolvedValueOnce({ ok: false, reason: "unavailable" });
    const draft = createDiagnosticDraft(questions);
    act(() => hook.result.current.change(draft));
    await waitFor(() => expect(hook.result.current.status).toBe("error"));
    expect(hook.result.current.draft?.id).toBe(draft.id);
    await act(async () => {
      await hook.result.current.flush();
    });
    expect(cloud?.id).toBe(draft.id);
    expect(hook.result.current.status).toBe("saved");
  });
  it("preserves newer in-memory writing when an older response arrives", async () => {
    const hook = await ready(uid);
    let resolve!: (result: unknown) => void;
    const draft = createDiagnosticDraft(questions);
    mocks.save.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    act(() => hook.result.current.change(draft));
    await waitFor(() => expect(resolve).toBeDefined());
    const intake = {
      writingSample: {
        version: "mpk-diagnostic-writing-v1" as const,
        text: "A newer edit",
      },
    };
    act(() => hook.result.current.change({ ...draft, intake }, true));
    await act(async () => {
      cloud = { ...draft, revision: 1 };
      resolve({ ok: true, draft: cloud });
      await hook.result.current.flush();
    });
    expect(hook.result.current.draft?.intake).toEqual(intake);
    expect(cloud?.intake).toEqual(intake);
  });
  it("blocks stale device writes while keeping the learner's text visible", async () => {
    cloud = { ...createDiagnosticDraft(questions), revision: 1 };
    const hook = await ready(uid);
    await act(async () => {
      await hook.result.current.resume(hook.result.current.choices[0]);
    });
    cloud = { ...cloud, revision: 2 };
    const local = {
      ...hook.result.current.draft!,
      intake: {
        writingSample: {
          version: "mpk-diagnostic-writing-v1" as const,
          text: "Unsaved work",
        },
      },
    };
    act(() => hook.result.current.change(local));
    await waitFor(() => expect(hook.result.current.status).toBe("conflict"));
    expect(hook.result.current.draft?.intake).toEqual(local.intake);
    expect(await hook.result.current.flush()).toBe(false);
    expect(cloud.intake.writingSample).toBeUndefined();
  });
  it("restarts with a fresh attempt and removes writing", async () => {
    cloud = { ...createDiagnosticDraft(questions), revision: 1 };
    const oldId = cloud.id;
    const hook = await ready(uid);
    await act(async () => {
      await hook.result.current.restart({ target: "NCLC 7" });
      await hook.result.current.flush();
    });
    expect(cloud?.id).not.toBe(oldId);
    expect(cloud?.answers).toEqual({});
    expect(cloud?.intake.writingSample).toBeUndefined();
  });
});

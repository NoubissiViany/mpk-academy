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
  replace: vi.fn(),
  discard: vi.fn(),
}));
vi.mock("@/app/actions/diagnostic-draft", () => ({
  getDiagnosticDraftAction: mocks.load,
  saveDiagnosticDraftAction: mocks.save,
  replaceDiagnosticDraftAction: mocks.replace,
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
  mocks.replace.mockImplementation(async (draft: DiagnosticDraft) => {
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
    const chosen = createDiagnosticDraft(questions, {
      target: "NCLC 5",
      feedbackMode: "guided",
    });
    chosen.answers[questions[0].id] = "first";
    chosen.checkedAnswers = { [questions[0].id]: "first" };
    const browser = guestDiagnosticDraft.save(chosen);
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
    expect(cloud?.id).toEqual(browser.id);
    expect(cloud?.checkedAnswers).toEqual(browser.checkedAnswers);
    expect(mocks.replace).toHaveBeenCalledWith(
      expect.objectContaining({ id: browser.id, revision: 3 }),
      uid,
    );
    expect(mocks.save).not.toHaveBeenCalled();
    expect(guestDiagnosticDraft.load()).toBeNull();
  });
  it("preserves both choices when explicitly replacing the account draft fails", async () => {
    const browser = guestDiagnosticDraft.save(createDiagnosticDraft(questions));
    cloud = { ...createDiagnosticDraft(questions), revision: 3 };
    const account = cloud;
    mocks.replace.mockResolvedValueOnce({ ok: false, reason: "unavailable" });
    const hook = await ready(uid);
    await act(async () => {
      expect(
        await hook.result.current.resume(hook.result.current.choices[1]),
      ).toBe(false);
    });
    expect(hook.result.current.choices).toHaveLength(2);
    expect(hook.result.current.draft).toBeNull();
    expect(cloud).toEqual(account);
    expect(guestDiagnosticDraft.load()).toEqual(browser);
    await act(async () => {
      expect(
        await hook.result.current.resume(hook.result.current.choices[1]),
      ).toBe(true);
    });
    expect(cloud?.id).toBe(browser.id);
    expect(guestDiagnosticDraft.load()).toBeNull();
  });
  it("serializes draft selection against repeated resume and restart requests", async () => {
    const browser = guestDiagnosticDraft.save(createDiagnosticDraft(questions));
    cloud = { ...createDiagnosticDraft(questions), revision: 2 };
    let resolve!: (value: unknown) => void;
    mocks.replace.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const hook = await ready(uid);
    let pending!: Promise<boolean>;
    act(() => {
      pending = hook.result.current.resume(hook.result.current.choices[1]);
    });
    await waitFor(() => expect(resolve).toBeDefined());
    await act(async () => {
      expect(
        await hook.result.current.resume(hook.result.current.choices[0]),
      ).toBe(false);
      await hook.result.current.restart({ target: "NCLC 7" });
    });
    expect(mocks.replace).toHaveBeenCalledTimes(1);
    expect(mocks.discard).not.toHaveBeenCalled();
    await act(async () => {
      cloud = { ...browser, revision: 3 };
      resolve({ ok: true, draft: cloud });
      expect(await pending).toBe(true);
    });
    expect(hook.result.current.draft?.id).toBe(browser.id);
    expect(guestDiagnosticDraft.load()).toBeNull();
  });
  it("recovers old drafts with unchecked answers and does not rewrite them on resume", async () => {
    const legacy = createDiagnosticDraft(questions);
    delete legacy.checkedAnswers;
    legacy.answers[questions[0].id] = "first answer";
    cloud = { ...legacy, revision: 3 };
    const hook = await ready(uid);
    await act(async () => {
      await hook.result.current.resume(hook.result.current.choices[0]);
    });
    expect(hook.result.current.draft?.checkedAnswers).toBeUndefined();
    expect(hook.result.current.draft?.answers).toEqual(legacy.answers);
    expect(hook.result.current.draft?.expiresAt).toBe(legacy.expiresAt);
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it("locks a first answer immediately, persists it before checking succeeds, and ignores stale edits", async () => {
    const hook = await ready(uid);
    const draft = createDiagnosticDraft(questions);
    const id = draft.questionOrder[0];
    draft.answers[id] = "first answer";
    act(() => hook.result.current.change(draft));
    await waitFor(() => expect(hook.result.current.status).toBe("saved"));
    let resolve!: (value: unknown) => void;
    mocks.save.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    let checking!: Promise<boolean>;
    act(() => {
      checking = hook.result.current.checkAnswer(id);
    });
    expect(hook.result.current.draft?.checkedAnswers).toEqual({
      [id]: "first answer",
    });
    await waitFor(() => expect(resolve).toBeDefined());
    expect(cloud?.checkedAnswers).toEqual({});
    act(() =>
      hook.result.current.change({
        ...draft,
        answers: { [id]: "changed answer" },
        index: 1,
      }),
    );
    await act(async () => {
      cloud = { ...hook.result.current.draft!, revision: 2 };
      resolve({ ok: true, draft: cloud });
      expect(await checking).toBe(true);
    });
    expect(cloud?.answers[id]).toBe("first answer");
    expect(cloud?.checkedAnswers).toEqual({ [id]: "first answer" });
    expect(cloud?.intake.feedbackMode).toBe("guided");
    expect(cloud?.index).toBe(1);
    const calls = mocks.save.mock.calls.length;
    await act(async () => {
      expect(await hook.result.current.checkAnswer(id)).toBe(true);
    });
    expect(mocks.save).toHaveBeenCalledTimes(calls);
  });
  it("keeps a first answer locked after a save error and retries that same marker", async () => {
    const hook = await ready(uid);
    const draft = createDiagnosticDraft(questions);
    const id = draft.questionOrder[0];
    draft.answers[id] = "first";
    act(() => hook.result.current.change(draft));
    await waitFor(() => expect(hook.result.current.status).toBe("saved"));
    mocks.save.mockResolvedValueOnce({ ok: false, reason: "unavailable" });
    await act(async () => {
      expect(await hook.result.current.checkAnswer(id)).toBe(false);
    });
    expect(hook.result.current.status).toBe("error");
    expect(hook.result.current.draft?.checkedAnswers?.[id]).toBe("first");
    expect(cloud?.checkedAnswers).toEqual({});
    await act(async () => {
      expect(await hook.result.current.checkAnswer(id)).toBe(true);
    });
    expect(cloud?.checkedAnswers?.[id]).toBe("first");
    expect(hook.result.current.status).toBe("saved");
  });
  it("keeps checked guest answers after browser reopening, including storage failure recovery", async () => {
    const first = await ready();
    const draft = createDiagnosticDraft(questions);
    const id = draft.questionOrder[0];
    draft.answers[id] = "first";
    act(() => first.result.current.change(draft));
    await waitFor(() => expect(first.result.current.status).toBe("saved"));
    const rejectedSave = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementationOnce(() => {
        throw new DOMException("Quota", "QuotaExceededError");
      });
    await act(async () => {
      expect(await first.result.current.checkAnswer(id)).toBe(false);
    });
    expect(first.result.current.draft?.checkedAnswers?.[id]).toBe("first");
    rejectedSave.mockRestore();
    await act(async () => {
      expect(await first.result.current.checkAnswer(id)).toBe(true);
    });
    first.unmount();
    const second = await ready();
    await act(async () => {
      await second.result.current.resume(second.result.current.choices[0]);
    });
    expect(second.result.current.draft?.checkedAnswers?.[id]).toBe("first");
    expect(second.result.current.draft?.questionOrder).toEqual(
      draft.questionOrder,
    );
    expect(second.result.current.draft?.optionOrder).toEqual(draft.optionOrder);
    expect(second.result.current.draft?.intake.feedbackMode).toBe("guided");
  });
  it("blocks a checked marker when another device changed the draft", async () => {
    const draft = createDiagnosticDraft(questions);
    const id = draft.questionOrder[0];
    draft.answers[id] = "first";
    cloud = { ...draft, revision: 1 };
    const hook = await ready(uid);
    await act(async () => {
      await hook.result.current.resume(hook.result.current.choices[0]);
    });
    cloud = { ...cloud, revision: 2 };
    await act(async () => {
      expect(await hook.result.current.checkAnswer(id)).toBe(false);
    });
    expect(hook.result.current.status).toBe("conflict");
    expect(hook.result.current.draft?.checkedAnswers?.[id]).toBe("first");
    expect(cloud.checkedAnswers).toEqual({});
    expect(await hook.result.current.checkAnswer(id)).toBe(false);
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
    cloud = {
      ...createDiagnosticDraft(questions),
      revision: 1,
      answers: { [questions[0].id]: "first" },
      checkedAnswers: { [questions[0].id]: "first" },
      intake: { feedbackMode: "guided" },
    };
    const oldId = cloud.id;
    const hook = await ready(uid);
    await act(async () => {
      await hook.result.current.resume(hook.result.current.choices[0]);
    });
    await act(async () => {
      await hook.result.current.restart({
        target: "NCLC 7",
        feedbackMode: "guided",
      });
      await hook.result.current.flush();
    });
    expect(cloud?.id).not.toBe(oldId);
    expect(cloud?.answers).toEqual({});
    expect(cloud?.checkedAnswers).toEqual({});
    expect(cloud?.intake.feedbackMode).toBeUndefined();
    expect(cloud?.intake.writingSample).toBeUndefined();
  });
});

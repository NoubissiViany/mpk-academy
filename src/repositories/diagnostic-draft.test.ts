import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { diagnosticQuestions } from "@/data/questions";
import { toPublicQuestion } from "@/lib/server/content";
import {
  createDiagnosticDraft,
  diagnosticDraftTtl,
  diagnosticDraftSchema,
  isCompatibleDraft,
  restoreDraftQuestions,
  type DiagnosticDraft,
} from "@/lib/domain/diagnostic-draft";
import { saveState } from "@/lib/persistence";
import { defaultState } from "@/data/mock-state";
import {
  diagnosticDraftStorageKey,
  legacyDiagnosticDraftStorageKey,
  DraftConflict,
  guestDiagnosticDraft,
  withGuestDraftLock,
} from "./diagnostic-draft";

const questions = diagnosticQuestions.map(toPublicQuestion);
beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-04T12:00:00Z"));
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("guest assessment drafts", () => {
  it("imports v1 under the original cross-tab lock without changing the payload or expiry", async () => {
    const draft = createDiagnosticDraft(questions);
    delete draft.checkedAnswers;
    draft.revision = 7;
    draft.stage = "writing";
    draft.answers[questions[0].id] = "a";
    draft.intake.writingSample = {
      version: "mpk-diagnostic-writing-v1",
      text: "Mon ancien brouillon",
    };
    const raw = JSON.stringify(draft);
    localStorage.setItem(legacyDiagnosticDraftStorageKey, raw);
    vi.advanceTimersByTime(60_000);
    const operations: string[] = [];
    const setItem = Storage.prototype.setItem;
    const removeItem = Storage.prototype.removeItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
      this: Storage,
      key,
      value,
    ) {
      operations.push(`write:${key}`);
      setItem.call(this, key, value);
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (
      this: Storage,
      key,
    ) {
      operations.push(`remove:${key}`);
      removeItem.call(this, key);
    });
    const request = vi.fn(async (_key: string, operation: () => unknown) =>
      operation(),
    );
    vi.stubGlobal("navigator", { locks: { request } });
    expect(await withGuestDraftLock(() => guestDiagnosticDraft.load())).toEqual(
      draft,
    );
    expect(request).toHaveBeenCalledWith(
      legacyDiagnosticDraftStorageKey,
      expect.any(Function),
    );
    expect(localStorage.getItem(diagnosticDraftStorageKey)).toBe(raw);
    expect(localStorage.getItem(legacyDiagnosticDraftStorageKey)).toBeNull();
    expect(operations).toEqual([
      `write:${diagnosticDraftStorageKey}`,
      `remove:${legacyDiagnosticDraftStorageKey}`,
    ]);
    expect(guestDiagnosticDraft.load()?.expiresAt).toBe(draft.expiresAt);
    expect(guestDiagnosticDraft.load()?.revision).toBe(7);
  });
  it("keeps v1 intact when writing the new key fails", () => {
    const raw = JSON.stringify(createDiagnosticDraft(questions));
    localStorage.setItem(legacyDiagnosticDraftStorageKey, raw);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota", "QuotaExceededError");
    });
    expect(() => guestDiagnosticDraft.load()).toThrow();
    expect(localStorage.getItem(legacyDiagnosticDraftStorageKey)).toBe(raw);
    expect(localStorage.getItem(diagnosticDraftStorageKey)).toBeNull();
  });
  it("finishes an interrupted cleanup from the new key without rewriting or extending it", () => {
    const draft = createDiagnosticDraft(questions);
    const raw = JSON.stringify(draft);
    localStorage.setItem(legacyDiagnosticDraftStorageKey, raw);
    const remove = Storage.prototype.removeItem;
    vi.spyOn(Storage.prototype, "removeItem").mockImplementationOnce(function (
      this: Storage,
      key,
    ) {
      if (key === legacyDiagnosticDraftStorageKey)
        throw new Error("Storage unavailable");
      remove.call(this, key);
    });
    const write = vi.spyOn(Storage.prototype, "setItem");
    expect(() => guestDiagnosticDraft.load()).toThrow();
    expect(localStorage.getItem(diagnosticDraftStorageKey)).toBe(raw);
    expect(localStorage.getItem(legacyDiagnosticDraftStorageKey)).toBe(raw);
    vi.advanceTimersByTime(60_000);
    expect(guestDiagnosticDraft.load()).toEqual(draft);
    expect(localStorage.getItem(legacyDiagnosticDraftStorageKey)).toBeNull();
    expect(write).toHaveBeenCalledTimes(1);
  });
  it("prevents legacy tabs from overwriting checked markers and preserves different old-key work", () => {
    const legacy = { ...createDiagnosticDraft(questions), revision: 3 };
    localStorage.setItem(
      legacyDiagnosticDraftStorageKey,
      JSON.stringify(legacy),
    );
    const migrated = guestDiagnosticDraft.load()!;
    const id = questions[0].id;
    const checked = guestDiagnosticDraft.save({
      ...migrated,
      answers: { [id]: "first" },
      checkedAnswers: { [id]: "first" },
      intake: { ...migrated.intake, feedbackMode: "guided" },
    });
    // This is the previous app's save algorithm: its old revision cannot
    // recreate a draft once migration has removed the v1 key.
    const oldTabSave = () => {
      const stored = JSON.parse(
        localStorage.getItem(legacyDiagnosticDraftStorageKey) ?? "null",
      ) as DiagnosticDraft | null;
      if (
        stored
          ? stored.id !== legacy.id || stored.revision !== legacy.revision
          : legacy.revision !== 0
      )
        throw new DraftConflict("Assessment changed in another tab");
      localStorage.setItem(
        legacyDiagnosticDraftStorageKey,
        JSON.stringify(legacy),
      );
    };
    expect(oldTabSave).toThrow(DraftConflict);
    // An old tab starting another attempt can only write its own old key.
    const independent = createDiagnosticDraft(questions);
    localStorage.setItem(
      legacyDiagnosticDraftStorageKey,
      JSON.stringify(independent),
    );
    expect(guestDiagnosticDraft.load()).toEqual(checked);
    expect(localStorage.getItem(legacyDiagnosticDraftStorageKey)).toBe(
      JSON.stringify(independent),
    );
    expect(guestDiagnosticDraft.load()?.checkedAnswers?.[id]).toBe("first");
  });
  it("does not revive expired v1 drafts during migration", () => {
    const draft = createDiagnosticDraft(questions);
    localStorage.setItem(
      legacyDiagnosticDraftStorageKey,
      JSON.stringify(draft),
    );
    vi.advanceTimersByTime(diagnosticDraftTtl);
    expect(guestDiagnosticDraft.load()).toBeNull();
    expect(localStorage.getItem(diagnosticDraftStorageKey)).toBeNull();
    expect(localStorage.getItem(legacyDiagnosticDraftStorageKey)).toBeNull();
  });
  it("loads older drafts without extending their expiry or losing answers", () => {
    const draft = createDiagnosticDraft(questions);
    delete draft.checkedAnswers;
    draft.answers[questions[0].id] = "a";
    draft.stage = "questions";
    localStorage.setItem(diagnosticDraftStorageKey, JSON.stringify(draft));
    vi.advanceTimersByTime(60_000);
    expect(guestDiagnosticDraft.load()).toEqual(draft);
    expect(guestDiagnosticDraft.load()?.checkedAnswers).toBeUndefined();
    expect(guestDiagnosticDraft.load()?.expiresAt).toBe(draft.expiresAt);
  });
  it("validates checked markers against their questions, answers, and guided label", () => {
    const draft = createDiagnosticDraft(questions);
    const id = questions[0].id;
    expect(
      diagnosticDraftSchema.safeParse({
        ...draft,
        checkedAnswers: { [id]: "a" },
      }).success,
    ).toBe(false);
    const checked = {
      ...draft,
      intake: { feedbackMode: "guided" },
      checkedAnswers: { [id]: "a" },
      answers: { [id]: "a" },
    };
    expect(diagnosticDraftSchema.safeParse(checked).success).toBe(true);
    expect(
      diagnosticDraftSchema.safeParse({
        ...checked,
        checkedAnswers: { outside: "a" },
        answers: { outside: "a" },
      }).success,
    ).toBe(false);
    expect(
      diagnosticDraftSchema.safeParse({ ...checked, intake: {} }).success,
    ).toBe(false);
  });
  it("keeps checked answers and their content immutable while allowing writing and position saves", () => {
    const draft = createDiagnosticDraft(questions);
    const id = questions[0].id;
    const saved = guestDiagnosticDraft.save({
      ...draft,
      checkedAnswers: { [id]: "first" },
      answers: { [id]: "first" },
      intake: { feedbackMode: "guided" },
    });
    for (const changed of [
      { ...saved, checkedAnswers: {} },
      { ...saved, checkedAnswers: undefined },
      { ...saved, answers: { [id]: "changed" } },
      { ...saved, contentVersion: "changed" },
      { ...saved, questionOrder: [...saved.questionOrder].reverse() },
      { ...saved, optionOrder: { ...saved.optionOrder, extra: [] } },
      {
        ...saved,
        optionOrder: {
          ...saved.optionOrder,
          [id]: [...saved.optionOrder[id]].reverse(),
        },
      },
      { ...saved, intake: {} },
    ])
      expect(() => guestDiagnosticDraft.save(changed)).toThrow();
    const edited = guestDiagnosticDraft.save({
      ...saved,
      index: 1,
      intake: {
        ...saved.intake,
        writingSample: {
          version: "mpk-diagnostic-writing-v1",
          text: "Mon nouveau texte",
        },
      },
    });
    expect(guestDiagnosticDraft.load()).toEqual(edited);
    expect(edited.checkedAnswers).toEqual({ [id]: "first" });
  });
  it("recovers the attempt, order, step, answers and unfinished writing", () => {
    const draft = createDiagnosticDraft(questions);
    draft.stage = "writing";
    draft.answers[questions[0].id] = "my answer";
    draft.intake.writingSample = {
      version: "mpk-diagnostic-writing-v1",
      text: "Un texte incomplet",
    };
    const saved = guestDiagnosticDraft.save(draft);
    expect(guestDiagnosticDraft.load()).toEqual(saved);
    expect(restoreDraftQuestions(saved, questions).map((q) => q.id)).toEqual(
      saved.questionOrder,
    );
    expect(isCompatibleDraft(saved, questions)).toBe(true);
    expect(isCompatibleDraft(saved, questions.slice(1))).toBe(false);
    expect(
      isCompatibleDraft(
        {
          ...saved,
          questionOrder: saved.questionOrder.map(() => questions[0].id),
        },
        questions,
      ),
    ).toBe(false);
  });
  it("expires after seven days without edits; reading does not extend retention", () => {
    const draft = guestDiagnosticDraft.save(createDiagnosticDraft(questions));
    vi.advanceTimersByTime(diagnosticDraftTtl - 1000);
    expect(guestDiagnosticDraft.load()?.expiresAt).toBe(draft.expiresAt);
    const edited = guestDiagnosticDraft.save(draft);
    vi.advanceTimersByTime(1001);
    expect(guestDiagnosticDraft.load()?.id).toBe(edited.id);
    vi.advanceTimersByTime(diagnosticDraftTtl);
    expect(guestDiagnosticDraft.load()).toBeNull();
  });
  it("rejects stale saves and discards without replacing a newer tab", () => {
    const first = guestDiagnosticDraft.save(createDiagnosticDraft(questions));
    const second = guestDiagnosticDraft.save({ ...first, stage: "questions" });
    expect(() => guestDiagnosticDraft.save(first)).toThrow(DraftConflict);
    expect(() =>
      guestDiagnosticDraft.discard(first.id, first.revision),
    ).toThrow(DraftConflict);
    expect(guestDiagnosticDraft.load()).toEqual(second);
    guestDiagnosticDraft.discard(second.id, second.revision);
    expect(guestDiagnosticDraft.load()).toBeNull();
  });
  it("preserves compatible legacy answers and removes only the superseded legacy state", () => {
    saveState({
      ...defaultState,
      diagnosticIntake: {
        goal: "TEF Canada",
        target: "NCLC 7",
        frenchExperience: "I know some French",
      },
      diagnosticAnswers: { [questions[0].id]: "a", removed: "b" },
    });
    const migrated = guestDiagnosticDraft.load(questions)!;
    expect(migrated.answers).toEqual({ [questions[0].id]: "a" });
    expect(migrated.intake.target).toBe("NCLC 7");
    expect(guestDiagnosticDraft.load(questions)?.id).toBe(migrated.id);
  });
  it("does not remove a saved draft when storage rejects an edit", () => {
    const original = guestDiagnosticDraft.save(
      createDiagnosticDraft(questions),
    );
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota", "QuotaExceededError");
    });
    expect(() =>
      guestDiagnosticDraft.save({ ...original, stage: "writing" }),
    ).toThrow();
    expect(
      JSON.parse(localStorage.getItem(diagnosticDraftStorageKey)!),
    ).toEqual(original);
  });
});

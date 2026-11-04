import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { diagnosticQuestions } from "@/data/questions";
import { toPublicQuestion } from "@/lib/server/content";
import {
  createDiagnosticDraft,
  diagnosticDraftTtl,
  isCompatibleDraft,
  restoreDraftQuestions,
} from "@/lib/domain/diagnostic-draft";
import { saveState } from "@/lib/persistence";
import { defaultState } from "@/data/mock-state";
import {
  diagnosticDraftStorageKey,
  DraftConflict,
  guestDiagnosticDraft,
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
});

describe("guest assessment drafts", () => {
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

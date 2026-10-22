import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppProvider } from "@/components/providers/app-provider";
import { aiFeedbackNoticeVersion } from "@/config/privacy";
import type { WritingFeedback } from "@/lib/domain/writing-feedback";
import type { WritingSubmission } from "@/lib/supabase/writing";
import { demoState } from "@/test/fixtures";
import { WritingFeedbackView } from "./feedback-view";
import { RequestAiFeedback } from "./request-feedback";

const mocks = vi.hoisted(() => ({
  status: vi.fn(),
  flag: vi.fn(),
  consent: vi.fn(),
  request: vi.fn(),
  push: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: vi.fn() }),
}));
vi.mock("@/app/actions/writing", () => ({
  getWritingStatusAction: mocks.status,
  flagWritingFixAction: mocks.flag,
  setAiFeedbackConsentAction: mocks.consent,
  requestWritingFeedbackAction: mocks.request,
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  Object.values(mocks).forEach((mock) => mock.mockReset());
});

const feedback: WritingFeedback = {
  version: 1,
  criteria: [
    {
      id: "task",
      band: "B2",
      evidence: "je suis pour",
      comment: "Position claire.",
    },
    { id: "coherence", band: "C1", evidence: null, comment: "Bien organisé." },
    { id: "vocabulary", band: "B1", evidence: null, comment: "Assez simple." },
    {
      id: "grammar",
      band: "B1",
      evidence: null,
      comment: "Quelques accords.",
    },
  ],
  fixes: Array.from({ length: 4 }, (_, index) => ({
    quote: `les magasin ${index}`,
    correction: `les magasins ${index}`,
    explanation: "Accord du pluriel.",
    category: "agreement" as const,
  })),
  rewrite: { original: "L’air est propre.", improved: "L’air y est pur." },
  summary: "Opinion claire ; travaillez les accords.",
  dropped: 1,
};

const submission = (
  overrides: Partial<WritingSubmission> = {},
): WritingSubmission => ({
  id: "6f1c5f3e-2d7a-4b1e-9c4a-1d2e3f4a5b6c",
  exam: "TEF Canada",
  taskId: "tef-writing-section-b-002",
  parentId: null,
  body: "Mon texte.",
  wordCount: 180,
  checks: {
    words: 180,
    range: { min: 200, max: null },
    length: "under",
    paragraphs: 3,
    address: "mixed",
    connectors: ["d’abord", "ensuite"],
    variety: "low",
  },
  status: "done",
  feedback,
  createdAt: "2026-10-21T12:00:00Z",
  flaggedFixes: [],
  ...overrides,
});

describe("AI writing feedback view", () => {
  it("shows bands against the learner's target, fixes, the rewrite, and checks", async () => {
    render(
      <AppProvider initialState={demoState}>
        <WritingFeedbackView
          submission={submission()}
          taskTitle="Une journée sans voiture"
          parentBody={null}
        />
      </AppProvider>,
    );
    expect(
      await screen.findByText(
        "For NCLC 7, aim for about B2 on each criterion.",
      ),
    ).toBeVisible();
    expect(
      screen.getByText("Task completion").closest("div")!.parentElement,
    ).toHaveTextContent("At your target");
    expect(
      screen.getByText("Coherence and organisation").closest("div")!
        .parentElement,
    ).toHaveTextContent("Above your target");
    expect(screen.getAllByText("Below your target")).toHaveLength(2);
    expect(screen.getByText("les magasins 0")).toBeVisible();
    expect(screen.getByText("1 more correction")).toBeVisible();
    expect(screen.getByText("L’air y est pur.")).toBeVisible();
    expect(
      screen.getByText("Shorter than the 200 words expected."),
    ).toBeVisible();
    expect(screen.getByText(/You mix “tu” and “vous”/)).toBeVisible();
    expect(screen.getByText(/1 AI suggestion was removed/)).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Rewrite this text" }),
    ).toHaveAttribute(
      "href",
      "/writing/6f1c5f3e-2d7a-4b1e-9c4a-1d2e3f4a5b6c/rewrite",
    );
    expect(mocks.status).not.toHaveBeenCalled();
  });

  it("lets the learner report a wrong correction once", async () => {
    const user = userEvent.setup();
    mocks.flag.mockResolvedValue({ ok: true });
    render(
      <AppProvider initialState={demoState}>
        <WritingFeedbackView
          submission={submission({ flaggedFixes: [1] })}
          taskTitle="Tâche"
          parentBody={null}
        />
      </AppProvider>,
    );
    const buttons = await screen.findAllByRole("button", {
      name: "This correction is wrong",
    });
    expect(
      screen.getAllByRole("button", { name: "Reported — thank you" })[0],
    ).toBeDisabled();
    await user.click(buttons[0]);
    expect(mocks.flag).toHaveBeenCalledWith(
      "6f1c5f3e-2d7a-4b1e-9c4a-1d2e3f4a5b6c",
      0,
    );
    expect(
      await screen.findAllByRole("button", { name: "Reported — thank you" }),
    ).toHaveLength(2);
  });

  it("shows the queue position, then the feedback when it arrives", async () => {
    mocks.status
      .mockResolvedValueOnce({
        ok: true,
        status: "queued",
        ahead: 2,
        capReached: false,
        feedback: null,
      })
      .mockResolvedValue({
        ok: true,
        status: "done",
        ahead: 0,
        capReached: false,
        feedback,
      });
    render(
      <AppProvider initialState={demoState}>
        <WritingFeedbackView
          submission={submission({ status: "queued", feedback: null })}
          taskTitle="Tâche"
          parentBody="Première version."
        />
      </AppProvider>,
    );
    expect(await screen.findByText(/2 texts are ahead of yours/)).toBeVisible();
    expect(screen.getByText("Première version.")).toBeVisible();
    await waitFor(
      () =>
        expect(
          screen.getByText("Opinion claire ; travaillez les accords."),
        ).toBeVisible(),
      { timeout: 7000 },
    );
  }, 10_000);

  it("says when today's budget is spent", async () => {
    mocks.status.mockResolvedValue({
      ok: true,
      status: "queued",
      ahead: 0,
      capReached: true,
      feedback: null,
    });
    render(
      <AppProvider initialState={demoState}>
        <WritingFeedbackView
          submission={submission({ status: "queued", feedback: null })}
          taskTitle="Tâche"
          parentBody={null}
        />
      </AppProvider>,
    );
    expect(
      await screen.findByText("Saved — feedback tomorrow morning"),
    ).toBeVisible();
  });
});

describe("requesting AI feedback", () => {
  it("asks for agreement first, then sends the text", async () => {
    const user = userEvent.setup();
    mocks.consent.mockResolvedValue({ ok: true });
    mocks.request.mockResolvedValue({ ok: true, id: "sub-9" });
    render(
      <AppProvider
        initialState={{
          ...demoState,
          user: { ...demoState.user!, aiFeedbackConsent: null },
        }}
      >
        <RequestAiFeedback
          taskId="tef-writing-section-a-001"
          text="Mon texte"
        />
      </AppProvider>,
    );
    expect(
      await screen.findByText(/sent to Groq, the AI provider we use/),
    ).toBeVisible();
    const agree = screen.getByRole("button", { name: "Agree and continue" });
    expect(agree).toBeDisabled();
    await user.click(screen.getByRole("checkbox"));
    await user.click(agree);
    expect(mocks.consent).toHaveBeenCalledWith(true);
    await user.click(
      await screen.findByRole("button", { name: "Get AI feedback" }),
    );
    expect(mocks.request).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: "tef-writing-section-a-001",
        text: "Mon texte",
        clientKey: expect.any(String),
      }),
    );
    expect(mocks.push).toHaveBeenCalledWith("/writing/sub-9");
  });
});

describe("a review that failed", () => {
  it("shows the text and sends it again on request", async () => {
    const user = userEvent.setup();
    mocks.status.mockResolvedValue({
      ok: true,
      status: "failed",
      ahead: 0,
      capReached: false,
      feedback: null,
    });
    mocks.request.mockResolvedValue({ ok: true, id: "sub-10" });
    render(
      <AppProvider
        initialState={{
          ...demoState,
          user: {
            ...demoState.user!,
            aiFeedbackConsent: {
              version: aiFeedbackNoticeVersion,
              at: "2026-10-21T12:00:00Z",
            },
          },
        }}
      >
        <WritingFeedbackView
          submission={submission({
            status: "failed",
            feedback: null,
            body: "Mon texte à revoir.",
          })}
          taskTitle="Tâche"
          parentBody={null}
        />
      </AppProvider>,
    );
    expect(
      await screen.findByText("We could not review this text"),
    ).toBeVisible();
    expect(screen.getByText("Mon texte à revoir.")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(mocks.request).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: "tef-writing-section-b-002",
        text: "Mon texte à revoir.",
        parentId: null,
      }),
    );
    expect(mocks.push).toHaveBeenCalledWith("/writing/sub-10");
    expect(
      screen.queryByRole("link", { name: "Rewrite this text" }),
    ).not.toBeInTheDocument();
  });
});

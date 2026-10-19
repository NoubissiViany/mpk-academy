import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppProvider } from "@/components/providers/app-provider";
import { ExamPracticeSession } from "./exam-practice-session";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams("skill=writing"),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("productive practice availability", () => {
  it("does not create a Writing score through a direct session URL", async () => {
    render(
      <AppProvider>
        <ExamPracticeSession />
      </AppProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: /writing self-practice/,
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Start timed practice" }),
    ).toBeVisible();
    expect(
      screen.getByText(/No recording, AI evaluation, or official grading/),
    ).toBeVisible();
    expect(screen.queryByText(/Save self-review/)).not.toBeInTheDocument();
  });
});

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
        name: /Corrected writing practice is not available yet/,
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Explore lessons" }),
    ).toHaveAttribute("href", "/learn");
    expect(screen.queryByText(/Save self-review/)).not.toBeInTheDocument();
  });
});

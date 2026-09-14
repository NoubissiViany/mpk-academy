import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppProvider } from "@/components/providers/app-provider";
import { productConfig } from "@/config/product";
import { DiagnosticFlow } from "./diagnostic-flow";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

afterEach(() => {
  cleanup();
  localStorage.clear();
  push.mockClear();
});

describe("DiagnosticFlow", () => {
  it("requires the intake before starting and persists it", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "scrollTo", {
      value: vi.fn(),
      writable: true,
    });
    render(
      <AppProvider>
        <DiagnosticFlow />
      </AppProvider>,
    );

    const start = await screen.findByRole("button", {
      name: /Start my assessment/,
    });
    expect(start).toBeDisabled();
    await user.click(screen.getByLabelText("Prepare for TEF Canada"));
    await user.click(screen.getByLabelText("NCLC 7"));
    await user.click(screen.getByLabelText("I know some French"));
    expect(start).toBeEnabled();
    await user.click(start);

    expect(screen.getByText("Question 1 of 15")).toBeVisible();
    expect(screen.getByText("Competency · Grammar")).toBeVisible();
    expect(
      screen.getByText(
        "Don't worry if you're unsure. Choose the answer that seems best.",
      ),
    ).toBeVisible();
    const stored = JSON.parse(
      localStorage.getItem(productConfig.storageKey) ?? "null",
    );
    expect(stored.diagnosticIntake).toEqual({
      goal: "TEF Canada",
      target: "NCLC 7",
      frenchExperience: "I know some French",
    });
    expect(stored.diagnosticAnswers).toEqual({});
  });

  it("preserves an answer while navigating and returns to the intro from question one", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "scrollTo", {
      value: vi.fn(),
      writable: true,
    });
    render(
      <AppProvider>
        <DiagnosticFlow />
      </AppProvider>,
    );
    await user.click(await screen.findByLabelText("I'm not sure yet"));
    await user.click(screen.getByLabelText("NCLC 5"));
    await user.click(screen.getByLabelText("I'm just starting"));
    await user.click(
      screen.getByRole("button", { name: /Start my assessment/ }),
    );
    fireEvent.click(screen.getByText("depuis"));
    await user.click(screen.getByRole("button", { name: /Next/ }));
    await user.click(screen.getByRole("button", { name: /Previous/ }));
    expect(screen.getByLabelText("depuis")).toBeChecked();
    await user.click(screen.getByRole("button", { name: /Previous/ }));
    expect(
      screen.getByRole("heading", { name: "Check your French level" }),
    ).toBeVisible();
    await waitFor(() =>
      expect(screen.getByLabelText("I'm not sure yet")).toBeChecked(),
    );
  });
});

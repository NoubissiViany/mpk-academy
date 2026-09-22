import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AppProvider } from "@/components/providers/app-provider";
import { demoState } from "@/test/fixtures";
import { MockOverview, MockSetup } from "./mock-overview";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("mock exam disclosures", () => {
  it("states the shortened mock limitations", async () => {
    render(
      <AppProvider initialState={demoState}>
        <MockOverview />
      </AppProvider>,
    );
    expect(
      await screen.findByText(
        "This shortened MPK mock is not the official exam.",
      ),
    ).toBeVisible();
    expect(
      screen.getByText("It does not produce an official score."),
    ).toBeVisible();
    expect(
      screen.getByText(/included for rehearsal but are not/),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Start mock exam" }),
    ).toHaveAttribute("href", "/exam/setup");
  });

  it("shows the independent environment before starting", async () => {
    render(
      <AppProvider initialState={demoState}>
        <MockSetup />
      </AppProvider>,
    );
    expect(await screen.findByText("French-only environment")).toBeVisible();
    expect(screen.getByText("No hints")).toBeVisible();
    expect(screen.getByText("No English explanations")).toBeVisible();
    expect(screen.getByText("Timed experience")).toBeVisible();
    expect(
      screen.getByText(/Only Reading and Listening contribute/),
    ).toBeVisible();
  });
});

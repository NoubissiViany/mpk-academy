import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { AppProvider } from "@/components/providers/app-provider";
import { demoState } from "@/test/fixtures";
import { MockOverview, MockSetup } from "./mock-overview";

const audio = vi.hoisted(() => ({ ready: false }));
vi.mock("@/content/mock-summaries", async (original) => {
  const actual = await original<typeof import("@/content/mock-summaries")>();
  return {
    mockSummaries: actual.mockSummaries.map((mock) => ({
      ...mock,
      get ready() {
        return audio.ready;
      },
    })),
  };
});
beforeEach(() => {
  audio.ready = false;
});
afterEach(() => {
  cleanup();
  localStorage.clear();
});
describe("full mock disclosures", () => {
  it("shows the full structure and pending audio without a launch link", async () => {
    render(
      <AppProvider initialState={demoState}>
        <MockOverview />
      </AppProvider>,
    );
    expect(
      await screen.findByText(/Audio pending — the complete mock/),
    ).toBeVisible();
    expect(screen.getByText(/40 questions · 60 minutes/)).toBeVisible();
    expect(screen.getByText(/not an official examination/)).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Review simulation format" }),
    ).toHaveAttribute("href", "/exam/setup");
    expect(
      screen.queryByRole("link", { name: "Commencer la simulation" }),
    ).toBeNull();
  });
  it("keeps direct setup gated and explains hidden corrections", async () => {
    render(
      <AppProvider initialState={demoState}>
        <MockSetup />
      </AppProvider>,
    );
    expect(
      await screen.findByRole("button", { name: /Audio pending/ }),
    ).toBeDisabled();
    expect(screen.getByText(/Les corrections, les explications/)).toBeVisible();
    expect(screen.getByText(/80 mots minimum/)).toBeVisible();
    expect(
      screen.queryByRole("link", { name: "Commencer la simulation" }),
    ).toBeNull();
  });

  it("shows the overview without a pending notice when audio is ready", async () => {
    audio.ready = true;
    render(
      <AppProvider initialState={demoState}>
        <MockOverview />
      </AppProvider>,
    );
    expect(
      await screen.findByRole("link", { name: "Review simulation format" }),
    ).toHaveAttribute("href", "/exam/setup");
    expect(screen.queryByText(/Audio pending — the complete mock/)).toBeNull();
  });

  it("allows launching from setup when audio is ready", async () => {
    audio.ready = true;
    render(
      <AppProvider initialState={demoState}>
        <MockSetup />
      </AppProvider>,
    );
    expect(
      await screen.findByRole("link", { name: "Commencer la simulation" }),
    ).toHaveAttribute("href", "/exam/session");
    expect(screen.queryByRole("button", { name: /Audio pending/ })).toBeNull();
    expect(screen.getByText(/Les corrections, les explications/)).toBeVisible();
  });
});

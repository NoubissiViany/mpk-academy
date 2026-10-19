import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, it, expect } from "vitest";
import { AppProvider } from "@/components/providers/app-provider";
import { demoState } from "@/test/fixtures";
import { MockOverview, MockSetup } from "./mock-overview";
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
    expect(screen.queryByRole("link", { name: "Start mock exam" })).toBeNull();
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
  });
});

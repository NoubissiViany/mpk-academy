import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AppProvider } from "@/components/providers/app-provider";
import { demoState } from "@/test/fixtures";
import { MistakeDetail } from "./mistake-detail";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("mistake detail", () => {
  it("connects a repeated pattern to a lesson and targeted practice", async () => {
    render(
      <AppProvider initialState={demoState}>
        <MistakeDetail mistakeId="m1" />
      </AppProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Understanding specific details",
      }),
    ).toBeVisible();
    expect(
      screen.getByText(/struggled with this pattern 8 times/),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: "Listening for specific information",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: /Practice weakness/ }),
    ).toHaveAttribute(
      "href",
      "/practice/session?skill=listening&focus=listening-detail&count=10",
    );
  });
});

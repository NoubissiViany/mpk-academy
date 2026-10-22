import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppProvider } from "@/components/providers/app-provider";
import { demoState } from "@/test/fixtures";
import { Objections } from "./objections";

const played: string[] = [];
class FakeAudio {
  constructor(src: string) {
    played.push(src);
  }
  play() {
    return Promise.resolve();
  }
}

afterEach(() => {
  cleanup();
  played.length = 0;
  vi.unstubAllGlobals();
});

const objections = [
  {
    at: 60,
    text: "Je n’ai pas le temps.",
    audio: "/audio/one.mp3",
    seconds: 3,
  },
  { at: 150, text: "Je préfère les séries." },
];

describe("TEF section B objections", () => {
  it("announces when they come, then raises each once at its time", () => {
    vi.stubGlobal("Audio", FakeAudio);
    const onRaised = vi.fn();
    const view = (elapsed: number, active = true) => (
      <AppProvider initialState={demoState}>
        <Objections
          objections={objections}
          elapsed={elapsed}
          active={active}
          onRaised={onRaised}
        />
      </AppProvider>
    );
    const { rerender } = render(view(0, false));
    expect(screen.getByText(/at about 1:00 and 2:30/)).toBeVisible();

    rerender(view(30));
    expect(screen.queryByText(/Je n’ai pas le temps/)).not.toBeInTheDocument();

    rerender(view(61));
    expect(screen.getByText(/Je n’ai pas le temps/)).toBeVisible();
    expect(played).toEqual(["/audio/one.mp3"]);
    expect(onRaised).toHaveBeenCalledWith({ index: 0, at: 61, played: true });

    rerender(view(62));
    expect(played).toHaveLength(1);

    rerender(view(151));
    expect(screen.getByText(/Je préfère les séries/)).toBeVisible();
    expect(onRaised).toHaveBeenLastCalledWith({
      index: 1,
      at: 151,
      played: false,
    });
    expect(played).toHaveLength(1);
  });
});

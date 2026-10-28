import { describe, expect, it } from "vitest";
import {
  diagnosticWritingVersion,
  isDiagnosticWritingSample,
} from "./diagnostic-writing";

describe("diagnostic writing validation", () => {
  it.each([
    [79, false],
    [80, true],
    [120, true],
    [121, false],
  ])("validates the %i-word boundary", (words, valid) => {
    expect(
      isDiagnosticWritingSample({
        version: diagnosticWritingVersion,
        text: "mot ".repeat(Number(words)),
      }),
    ).toBe(valid);
  });
  it("rejects missing, stale, oversized and malformed samples", () => {
    for (const value of [
      undefined,
      {},
      { version: "old", text: "mot ".repeat(90) },
      { version: diagnosticWritingVersion, text: [] },
      {
        version: diagnosticWritingVersion,
        text: ("x".repeat(60) + " ").repeat(90),
      },
    ])
      expect(isDiagnosticWritingSample(value)).toBe(false);
  });
  it("counts newlines and French nonbreaking spaces consistently", () => {
    expect(
      isDiagnosticWritingSample({
        version: diagnosticWritingVersion,
        text: " \n" + "mot\u00a0".repeat(80),
      }),
    ).toBe(true);
  });
});

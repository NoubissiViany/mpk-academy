import { beforeEach, describe, expect, it } from "vitest";
import { productConfig } from "@/config/product";
import { defaultState } from "@/data/mock-state";
import { loadState, saveState } from "./persistence";
describe("versioned persistence", () => {
  beforeEach(() => localStorage.clear());
  it("falls back when stored data is invalid or obsolete", () => { localStorage.setItem(productConfig.storageKey, JSON.stringify({ schemaVersion: 0 })); expect(loadState().schemaVersion).toBe(1); });
  it("round-trips valid state", () => { saveState(defaultState); expect(loadState().user?.firstName).toBe("Alex"); });
});

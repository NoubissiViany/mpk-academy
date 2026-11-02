"use client";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
/** Mount random visitor-specific content only after hydration. */
export function useClientReady() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

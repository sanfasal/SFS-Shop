"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

// False during server render and hydration, true once running in the browser.
// Login state lives in localStorage, so auth-dependent UI waits for this to
// avoid flashing the wrong screen.
export function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

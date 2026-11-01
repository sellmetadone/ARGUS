import { bootstrapAppState } from './bootstrap';

/** Synchronous initial graph state — used by Zustand create() to avoid demo flash. */
export function getInitialCaseData() {
  return bootstrapAppState();
}

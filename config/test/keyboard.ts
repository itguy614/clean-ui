import { nextTick } from "vue";

/**
 * Keyboard helpers for every workspace package's tests, jsdom and browser alike. Imported by
 * relative path, like `browser-helpers.ts`, so the packages share one copy.
 */

/** Dispatch a keydown on the focused element (or `target`); resolves to the event, after a tick. */
export async function press(key: string, target: Element | null = document.activeElement) {
  const e = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
  (target ?? document.body).dispatchEvent(e);
  await nextTick();
  return e;
}

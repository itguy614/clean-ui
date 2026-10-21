import { vi } from "vitest";

/** A pointer event jsdom can dispatch: it has no PointerEvent, so a MouseEvent with an id. */
export function pointer(type: string, pointerId: number, init: MouseEventInit = {}) {
  const ev = new MouseEvent(type, init);
  Object.defineProperty(ev, "pointerId", { value: pointerId });
  return ev as PointerEvent;
}

/**
 * Spies on `document`'s listeners; the returned function lists the pointer listeners added
 * since and not removed. A listener is gone if it was removed explicitly, or added with an
 * AbortSignal that has since aborted. Pointer listeners only: the drags are what this
 * guards, and the first mount of a run also installs an unrelated mouseover/mouseout pair.
 * Restore with `vi.restoreAllMocks()` in `afterEach`.
 */
export function recordDocumentListeners() {
  const add = vi.spyOn(document, "addEventListener");
  const remove = vi.spyOn(document, "removeEventListener");
  const aborted = (options: unknown) => (options as AddEventListenerOptions | undefined)?.signal?.aborted === true;
  return () =>
    add.mock.calls
      .filter(([type]) => String(type).startsWith("pointer"))
      .filter(([type, listener, options]) => !aborted(options) && !remove.mock.calls.some(([t, l]) => t === type && l === listener))
      .map(([type]) => type);
}

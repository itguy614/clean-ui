/**
 * Focus restore for an opener that has gone (#232). Internal.
 *
 * An overlay hands focus back to the element that opened it. That element can be gone by
 * then: a virtualised grid row that scrolled out of the render window while a slideover was
 * open is unmounted, and focus would fall to <body>. An opener that can be re-rendered
 * carries `data-cui-restore-focus="<key>"`; the overlay remembers the key, and if the
 * element is no longer in the document on close, it dispatches this event with the key on
 * the document. Whatever owns that key — the grid — brings the element back and focuses it.
 *
 * It covers an overlay's opener only: a focused row wheeled out of the window with no
 * overlay open still loses focus. The event type below lands in the published types too, so
 * `cui-restore-focus` is typed in consumers' DocumentEventMap.
 */
export const RESTORE_FOCUS_EVENT = "cui-restore-focus";
export const RESTORE_FOCUS_ATTR = "data-cui-restore-focus";

declare global {
  interface DocumentEventMap {
    [RESTORE_FOCUS_EVENT]: CustomEvent<string>;
  }
}

/** The restore key of `el` or its nearest ancestor that carries one. */
export function restoreKeyOf(el: Element | null): string | null {
  return el?.closest(`[${RESTORE_FOCUS_ATTR}]`)?.getAttribute(RESTORE_FOCUS_ATTR) ?? null;
}

/** Focus `el` if it is still in the document; else ask the key's owner to restore it. */
export function returnFocus(el: HTMLElement | null, key: string | null) {
  if (el?.isConnected) el.focus();
  else if (key) document.dispatchEvent(new CustomEvent(RESTORE_FOCUS_EVENT, { detail: key }));
}

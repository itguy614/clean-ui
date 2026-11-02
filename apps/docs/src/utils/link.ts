/**
 * A plain primary click: no modifier and not the middle button. Anything else on a real link
 * should keep the browser's own behaviour (a new tab or window), so don't intercept it.
 */
export function isPlainClick(e: MouseEvent): boolean {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

/** Smooth unless the reader asked for reduced motion. */
export function scrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

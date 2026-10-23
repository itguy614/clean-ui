/** Everything that can take focus from the keyboard; `tabbableIn` filters it down. */
const CANDIDATES =
  'a[href], area[href], button, input, select, textarea, summary, iframe, audio[controls], video[controls], [contenteditable=""], [contenteditable="true"], [tabindex]';

/**
 * The elements inside `root` that Tab reaches, in document order: not disabled, not
 * `tabindex="-1"`, and not hidden, inert or inside a hidden or inert subtree. A focus trap
 * that counts a disabled last button as "last" never wraps (#339). Internal.
 */
export function tabbableIn(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(CANDIDATES)].filter(
    (el) =>
      el.tabIndex >= 0 &&
      !(el as HTMLButtonElement).disabled &&
      !el.closest("[hidden], [inert]") &&
      // Not rendered (display: none, a collapsed panel): checkVisibility where there is one.
      (typeof el.checkVisibility !== "function" || el.checkVisibility()),
  );
}

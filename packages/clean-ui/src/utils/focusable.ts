/** Every element that can be a Tab stop; `tabbableIn` filters it down. */
const CANDIDATES =
  'a[href], area[href], button, input, select, textarea, summary, iframe, audio[controls], video[controls], [contenteditable=""], [contenteditable="true"], [tabindex]';

/** Whether Tab stops on `el` by its own attributes: its tabindex, or editable content. */
const inTabOrder = (el: HTMLElement) =>
  // An editable element with no tabindex reports -1 but is still a Tab stop.
  el.tabIndex >= 0 || (el.isContentEditable && !el.hasAttribute("tabindex"));

/**
 * The elements inside `root` that Tab reaches, in document order. Not disabled (a
 * `<fieldset disabled>` ancestor included), not out of the tab order, not hidden, inert or
 * `visibility: hidden`, and, of a native radio group, only the radio Tab stops on. A focus
 * trap that counts one Tab skips as its last element never wraps (#339). Internal.
 */
export function tabbableIn(root: HTMLElement): HTMLElement[] {
  const found = [...root.querySelectorAll<HTMLElement>(CANDIDATES)].filter(
    (el) =>
      inTabOrder(el) &&
      !el.matches(":disabled") &&
      !el.closest("[hidden], [inert]") &&
      // Not rendered or not visible: checkVisibility where there is one (not in jsdom).
      (typeof el.checkVisibility !== "function" || el.checkVisibility({ visibilityProperty: true })),
  );
  return found.filter((el) => !(el instanceof HTMLInputElement) || el.type !== "radio" || isRadioStop(el, found));
}

/** A named radio group is one Tab stop: its checked radio, or else its first. */
function isRadioStop(radio: HTMLInputElement, found: HTMLElement[]) {
  if (!radio.name) return true;
  const group = found.filter(
    (el): el is HTMLInputElement => el instanceof HTMLInputElement && el.type === "radio" && el.name === radio.name && el.form === radio.form,
  );
  const checked = group.find((r) => r.checked);
  return radio === (checked ?? group[0]);
}

/**
 * Focus an element that may not be focusable yet.
 *
 * `CuiPopover` renders its teleported panel with `visibility: hidden` until
 * Floating UI has positioned it (the #88 flash guard) — and `focus()` on a
 * `visibility: hidden` element is a silent no-op. A single attempt therefore
 * lands nowhere, and whether it does is a race with positioning, so the failure
 * is intermittent.
 *
 * Retries for a bounded number of frames, and stops early once the element goes
 * away — closing the panel unmounts it, so `getEl()` returns nothing and the
 * chain ends on its own without needing cancellation.
 *
 * This is a workaround for CuiPopover not telling consumers when its panel is
 * ready; if that contract ever lands, delete this and call `focus()` directly.
 */
export function focusWhenReady(getEl: () => HTMLElement | null | undefined, frames = 10): void {
  const attempt = (remaining: number) => {
    const el = getEl();
    el?.focus();
    if (el && document.activeElement !== el && remaining > 0) {
      requestAnimationFrame(() => attempt(remaining - 1));
    }
  };
  attempt(frames);
}

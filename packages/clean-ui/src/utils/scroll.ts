/**
 * Scroll `scroller` — and only `scroller` — so that `el` sits inside it, clear of its
 * `scroll-padding`, moving it the least distance on each axis (`"nearest"`).
 *
 * `Element.scrollIntoView()` brings every scrollable ancestor into line, the window
 * included, so a tab bar or listbox below the fold drags the page down to it (#243). This
 * measures against the scroller alone. Rects are physical, so a right-to-left scroller
 * needs nothing special; `scrollBy` honours the scroller's `scroll-behavior`, smooth or not.
 *
 * Internal.
 */
export function scrollIntoViewWithin(scroller: HTMLElement, el: Element): void {
  const box = scroller.getBoundingClientRect();
  const target = el.getBoundingClientRect();
  const style = getComputedStyle(scroller);
  // `auto` (the default) parses to NaN: no padding.
  const pad = (value: string) => parseFloat(value) || 0;
  // Rects are scaled by any transform above the scroller (a modal scaling in); its client
  // sizes, padding and scroll offsets are not. Work in its own pixels.
  const sx = scroller.offsetWidth ? box.width / scroller.offsetWidth : 1;
  const sy = scroller.offsetHeight ? box.height / scroller.offsetHeight : 1;
  const x = (v: number) => (v - box.left) / sx - scroller.clientLeft;
  const y = (v: number) => (v - box.top) / sy - scroller.clientTop;
  const dx = nearest(
    x(target.left),
    x(target.right),
    pad(style.scrollPaddingLeft),
    scroller.clientWidth - pad(style.scrollPaddingRight),
  );
  const dy = nearest(
    y(target.top),
    y(target.bottom),
    pad(style.scrollPaddingTop),
    scroller.clientHeight - pad(style.scrollPaddingBottom),
  );
  if (dx || dy) scroller.scrollBy?.({ left: dx, top: dy });
}

/** The least move that puts [start, end] inside [min, max]; its start, if it can't fit. */
function nearest(start: number, end: number, min: number, max: number): number {
  if (start < min) return start - min;
  if (end > max) return Math.min(end - max, start - min);
  return 0;
}

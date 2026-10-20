import type { CuiOrientation } from "../types/common";

/**
 * The index maths shared by `useRovingFocus` (#144) and `useListbox` (#205). Internal —
 * not exported from the package.
 *
 * DOM-free: the caller passes the current items on every call and gets back the index a
 * key should move to. Disabled items are skipped. Scrolling the result into view is the
 * caller's: roving focus gets it from `el.focus()`, an `aria-activedescendant` listbox
 * calls `scrollIntoView({ block: "nearest" })` itself.
 */

export type ListOrientation = CuiOrientation | "both";

/** The items as they are now. */
export interface ListItems {
  count: number;
  /** Whether item `i` is skipped by navigation. */
  isDisabled?: (i: number) => boolean;
  /** Item `i`'s text, for type-ahead. */
  label?: (i: number) => string;
}

export interface ListNavigationOptions {
  /** Whether moving past either end comes round to the other. */
  wrap?: () => boolean;
  /** Which arrow keys move: left/right, up/down, or both. */
  orientation?: () => ListOrientation;
  /** Right-to-left: swaps the meaning of left and right. Read only for those two keys. */
  rtl?: () => boolean;
  /** Whether a printable key moves to the next item starting with it. */
  typeahead?: () => boolean;
}

/** How long a type-ahead buffer survives between keystrokes. */
const TYPEAHEAD_RESET_MS = 500;

const enabled = (items: ListItems, i: number) => !items.isDisabled?.(i);

/** The first enabled index scanning from one end, or -1 if every item is disabled. */
function edge(items: ListItems, delta: 1 | -1): number {
  for (let i = delta === 1 ? 0 : items.count - 1; i >= 0 && i < items.count; i += delta) if (enabled(items, i)) return i;
  return -1;
}

export const firstIndex = (items: ListItems) => edge(items, 1);
export const lastIndex = (items: ListItems) => edge(items, -1);

export function useListNavigation(options: ListNavigationOptions = {}) {
  const wrap = options.wrap ?? (() => false);
  const orientation = options.orientation ?? (() => "vertical");
  const typeaheadOn = options.typeahead ?? (() => false);

  /** The next enabled index from `from` in direction `delta`, or `from` if there is none. */
  function step(items: ListItems, from: number, delta: 1 | -1): number {
    const n = items.count;
    if (n === 0) return -1;
    if (from < 0) return edge(items, delta);
    let i = from;
    for (let tries = 0; tries < n; tries++) {
      i += delta;
      if (i < 0 || i >= n) {
        if (!wrap()) return from;
        i = (i + n) % n;
      }
      if (enabled(items, i)) return i;
    }
    return from;
  }

  let buffer = "";
  let lastKeyAt = 0;

  /**
   * The next enabled item whose label starts with what was typed in the last half second;
   * repeating one letter cycles through the items starting with it. `null` on no match.
   */
  function typeahead(items: ListItems, char: string, from: number): number | null {
    const n = items.count;
    if (!items.label || n === 0) return null;
    const now = Date.now();
    if (now - lastKeyAt > TYPEAHEAD_RESET_MS) buffer = "";
    lastKeyAt = now;
    buffer += char.toLowerCase();
    const cycling = buffer.length > 1 && [...buffer].every((c) => c === buffer[0]);
    const query = cycling ? buffer[0] : buffer;
    // A fresh or cycling search starts after the current item; a longer one refines it.
    const start = query.length === 1 ? from + 1 : Math.max(from, 0);
    for (let k = 0; k < n; k++) {
      const i = (start + k + n) % n;
      if (enabled(items, i) && items.label(i).trim().toLowerCase().startsWith(query)) return i;
    }
    return null;
  }

  /**
   * The index `e` moves to from `from`, or `null` when the key isn't navigation, or is a
   * type-ahead letter matching nothing — so the caller leaves the event alone. At an end
   * without wrap, an arrow returns `from`: still navigation, so the caller should still
   * swallow it rather than let the page scroll.
   */
  function indexForKey(e: KeyboardEvent, from: number, items: ListItems): number | null {
    const o = orientation();
    switch (e.key) {
      case "ArrowDown":
        return o === "horizontal" ? null : step(items, from, 1);
      case "ArrowUp":
        return o === "horizontal" ? null : step(items, from, -1);
      case "ArrowRight":
      case "ArrowLeft": {
        if (o === "vertical") return null;
        const forward = (e.key === "ArrowRight") !== (options.rtl?.() ?? false);
        return step(items, from, forward ? 1 : -1);
      }
      case "Home":
        return firstIndex(items);
      case "End":
        return lastIndex(items);
    }
    if (e.key.length === 1 && e.key !== " " && !e.ctrlKey && !e.metaKey && !e.altKey && typeaheadOn()) {
      return typeahead(items, e.key, from);
    }
    return null;
  }

  return { indexForKey };
}

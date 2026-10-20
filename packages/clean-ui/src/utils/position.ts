/**
 * The one positioner for panels anchored to a trigger (#204): dropdown menus and sub-menus,
 * and the listbox panels of CuiSelect, CuiCombobox and CuiTagInput.
 *
 * Synchronous, from the anchor's `getBoundingClientRect()`, so a panel that mounts under
 * `v-if` is placed in the same frame (the async Floating UI timing issue). It flips to the
 * roomier side when the preferred one is short, bounds the panel's height by the side it
 * actually opened to, and returns that side so a caller can set `transform-origin`.
 */

export type PanelSide = "bottom" | "top" | "left" | "right";

/**
 * The z-index of anchored panels and modal overlays, above page content. A CSS custom
 * property, so stylesheets (CuiModal) and inline styles share one value and a consumer can
 * re-layer the library: `:root { --cui-z-overlay: 50 }`.
 */
export const OVERLAY_Z_INDEX = "var(--cui-z-overlay, 9990)";
/** The gap between an anchor and its panel. */
export const PANEL_OFFSET = 4;
/** How close a panel may come to the viewport edge. */
export const VIEWPORT_PADDING = 16;
/** Tallest a panel gets before it scrolls internally, however much room there is. */
export const PANEL_MAX_HEIGHT = 400;

/** Below this much room on the preferred side, a panel flips if the other side has more. */
const FLIP_THRESHOLD = 200;

export interface PanelPositionOptions {
  /** Match the anchor's width and left edge (field listboxes). Vertical sides only. */
  matchWidth?: boolean;
  /** Upper bound for the panel's height, in px. */
  maxHeight?: number;
  /** Gap between anchor and panel, in px. */
  offset?: number;
  /** Minimum distance from the viewport edge, in px. */
  viewportPadding?: number;
}

export interface PanelPosition {
  styles: Record<string, string>;
  /** The side the panel opened to, after flipping. */
  side: PanelSide;
}

export function computeDropdownPosition(
  anchor: HTMLElement,
  preferredSide: PanelSide = "bottom",
  { matchWidth = false, maxHeight = PANEL_MAX_HEIGHT, offset = PANEL_OFFSET, viewportPadding = VIEWPORT_PADDING }: PanelPositionOptions = {},
): PanelPosition {
  const rect = anchor.getBoundingClientRect();
  const vh = typeof window !== "undefined" ? window.innerHeight : 0;
  const vw = typeof window !== "undefined" ? window.innerWidth : 0;
  const below = vh - rect.bottom;
  const right = vw - rect.right;

  let side = preferredSide;
  if (side === "bottom" && below < FLIP_THRESHOLD && rect.top > below) side = "top";
  else if (side === "top" && rect.top < FLIP_THRESHOLD && below > rect.top) side = "bottom";
  else if (side === "right" && right < FLIP_THRESHOLD && rect.left > right) side = "left";
  else if (side === "left" && rect.left < FLIP_THRESHOLD && right > rect.left) side = "right";

  const vertical = side === "bottom" || side === "top";
  // The room on the side actually opened to; never negative, so a panel with no room
  // collapses rather than emitting an invalid max-height.
  const room = side === "bottom" ? below - offset : side === "top" ? rect.top - offset : vh - rect.top;
  const styles: Record<string, string> = {
    position: "fixed",
    zIndex: OVERLAY_Z_INDEX,
    maxHeight: `${Math.max(0, Math.min(room - viewportPadding, maxHeight))}px`,
  };

  if (vertical) {
    if (side === "bottom") styles.top = `${rect.bottom + offset}px`;
    else styles.bottom = `${vh - rect.top + offset}px`;
    if (matchWidth) {
      styles.left = `${rect.left}px`;
      styles.width = `${rect.width}px`;
    } else if (rect.left + FLIP_THRESHOLD > vw) {
      // Too close to the right edge for a reasonable menu width: align right edges.
      styles.right = `${vw - rect.right}px`;
    } else {
      styles.left = `${rect.left}px`;
    }
  } else {
    styles.top = `${rect.top}px`;
    if (side === "right") styles.left = `${rect.right + offset}px`;
    else styles.right = `${vw - rect.left + offset}px`;
  }

  return { styles, side };
}

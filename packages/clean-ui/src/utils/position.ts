/**
 * The one positioner for panels anchored to a trigger (#204): dropdown menus and sub-menus,
 * and the listbox panels of CuiSelect, CuiCombobox and CuiTagInput.
 *
 * Synchronous, from the anchor's `getBoundingClientRect()`, so a panel that mounts under
 * `v-if` is placed in the same frame (the async Floating UI timing issue). It flips to the
 * roomier side when the preferred one is short, bounds the panel's height by the side it
 * actually opened to, and returns that side and the `transform-origin` that grows the panel
 * out of its anchor (#262).
 */

export type PanelSide = "bottom" | "top" | "left" | "right";

/**
 * The library's z-index scale, all derived from one CSS custom property so a consumer can
 * re-layer the whole library at once — `:root { --cui-z-overlay: 50 }` — and stylesheets
 * (CuiModal, CuiTooltip) and inline styles share it. Anchored panels and modal overlays
 * sit at the base; popovers and toasts above an open modal; tooltips above everything.
 */
export const OVERLAY_Z_INDEX = "var(--cui-z-overlay, 9990)";
export const POPOVER_Z_INDEX = "calc(var(--cui-z-overlay, 9990) + 8)";
export const TOOLTIP_Z_INDEX = "calc(var(--cui-z-overlay, 9990) + 9)";
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
  /** Where the panel grows from: its edge facing the anchor, at the end it is aligned to (#262). */
  transformOrigin: string;
}

/**
 * The `transform-origin` that makes a panel grow out of its trigger (#262): the panel's edge
 * nearest the trigger, at the end it is aligned to. `placement` is a side with an optional
 * alignment, Floating UI's form: `bottom`, `bottom-start`, `left-end`. A panel below its
 * trigger grows from its top; one aligned to the trigger's start grows from that corner.
 */
export type PanelPlacement = PanelSide | `${PanelSide}-${"start" | "end"}`;

const ORIGIN_PERCENT = { left: "0%", top: "0%", center: "50%", right: "100%", bottom: "100%" } as const;

/**
 * …and, given how far a positioner slid the panel along its side to keep it on screen
 * (Floating UI's `shift()`), moved back by as much, so it stays over the trigger — clamped
 * to the panel's edge, never a point outside it.
 */
export function transformOriginFor(placement: PanelPlacement, shift?: { x?: number; y?: number }): string {
  const [side, align] = placement.split("-") as [PanelSide, "start" | "end" | undefined];
  const vertical = side === "top" || side === "bottom";
  const edge = { top: "bottom", bottom: "top", left: "right", right: "left" }[side];
  const keyword = align === "start" ? (vertical ? "left" : "top") : align === "end" ? (vertical ? "right" : "bottom") : "center";
  const by = (vertical ? shift?.x : shift?.y) ?? 0;
  const along = by ? `clamp(0%, calc(${ORIGIN_PERCENT[keyword]} - ${by}px), 100%)` : keyword;
  return vertical ? `${along} ${edge}` : `${edge} ${along}`;
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

  // The edge the panel lines up with, for its transform-origin: a field listbox spans its
  // anchor, so it grows from the middle of its top.
  let align: "start" | "end" | undefined;
  if (vertical) {
    if (side === "bottom") styles.top = `${rect.bottom + offset}px`;
    else styles.bottom = `${vh - rect.top + offset}px`;
    if (matchWidth) {
      styles.left = `${rect.left}px`;
      styles.width = `${rect.width}px`;
    } else if (rect.left + FLIP_THRESHOLD > vw) {
      // Too close to the right edge for a reasonable menu width: align right edges.
      styles.right = `${vw - rect.right}px`;
      align = "end";
    } else {
      styles.left = `${rect.left}px`;
      align = "start";
    }
  } else {
    styles.top = `${rect.top}px`;
    align = "start";
    if (side === "right") styles.left = `${rect.right + offset}px`;
    else styles.right = `${vw - rect.left + offset}px`;
  }

  return { styles, side, transformOrigin: transformOriginFor(align ? `${side}-${align}` : side) };
}

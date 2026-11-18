import { OVERLAY_Z_INDEX } from "./position";

/**
 * Layering: the newest layer is on top (#541).
 *
 * Overlays (modal, confirm dialog, command palette, slideover, drawer) and the panels anchored
 * to a trigger (popover, dropdown menu and sub-menu, select, combobox, tag input, context
 * menu) share ONE open-order sequence. Each takes the next step above the newest one open when
 * it opens and gives it back when its exit has finished, so a layer is above its own overlay
 * and above everything opened before it, and is covered by whatever opens after it. A teleported
 * layer sits in `<body>` where its component *mounted*, not where it opened, so before this
 * the one shared z-index left DOM order in charge.
 *
 * Steps are offsets from `--cui-z-overlay` (default 9990), so a consumer re-layers the whole
 * library with that one property. The sequence is `0..MAX_LAYER_STEP` (39); past it the layers
 * share the last step and DOM order decides. Above the sequence, fixed: the toast region
 * (+48) and tooltips (+49, over the toast region, since a tooltip can belong to a toast's
 * own button). See `TOAST_Z_INDEX` and `TOOLTIP_Z_INDEX` in `position.ts`.
 *
 * A panel that is open when an overlay opens light-dismisses: `dismissPanels` calls each
 * panel's `dismiss` (its own close, so its v-model and events follow). A panel opened later,
 * from inside the overlay, is not touched.
 *
 * Module state, tiny and free of Vue, so `useOverlay` (and the editor's modal) pay almost
 * nothing, and the stack layer can read what it hands out. Only open and close touch it, in the
 * browser, so it is SSR safe.
 */
export const MAX_LAYER_STEP = 39;

export interface LayerToken {
  step: number;
  /** A panel's own close, called when an overlay opens over it. Overlays have none. */
  dismiss?: () => void;
}

const taken: LayerToken[] = [];

/** The next step above the newest open layer. A panel passes `dismiss` (its own close, called when an overlay opens over it); an overlay and a sub-menu pass none. */
export function takeLayerStep(dismiss?: () => void): LayerToken {
  const token: LayerToken = { step: taken.length ? Math.min(taken[taken.length - 1].step + 1, MAX_LAYER_STEP) : 0, dismiss };
  taken.push(token);
  return token;
}

/**
 * Light-dismisses every open panel older than the overlay that just opened: call it after the
 * overlay has noted where focus was, since a closing panel may move it.
 */
export function dismissPanels(newest: LayerToken): void {
  taken.slice(0, taken.indexOf(newest)).forEach((t) => t.dismiss?.());
}

/** Returns a step taken earlier; the others keep theirs. */
export function giveBackStep(token: LayerToken): void {
  const i = taken.indexOf(token);
  if (i !== -1) taken.splice(i, 1);
}

/** The CSS `z-index` of a layer at `step`. */
export function overlayZIndex(step: number): string {
  return step ? `calc(var(--cui-z-overlay, 9990) + ${step})` : OVERLAY_Z_INDEX;
}

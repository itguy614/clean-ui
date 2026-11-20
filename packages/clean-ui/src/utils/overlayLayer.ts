import type { InjectionKey } from "vue";
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
  /** The panel this one was opened from, by component tree: it stays open under an overlay it hosts. */
  parent?: LayerToken | null;
  /** The panel's element, so a press inside it can be told from a press outside its host. */
  el?: () => Element | null | undefined;
}

/** Provided by a panel (`useLayerStep`), so an overlay or panel declared inside it knows its host. */
export const LayerHostKey: InjectionKey<() => LayerToken | undefined> = Symbol("cui-layer-host");

const taken: LayerToken[] = [];

/** The next step above the newest open layer. A panel passes `dismiss` (its own close, called when an overlay opens over it); an overlay and a sub-menu pass none. */
export function takeLayerStep(dismiss?: () => void, parent?: LayerToken | null, el?: LayerToken["el"]): LayerToken {
  const token: LayerToken = { step: taken.length ? Math.min(taken[taken.length - 1].step + 1, MAX_LAYER_STEP) : 0, dismiss, parent, el };
  taken.push(token);
  return token;
}

/**
 * Light-dismisses every open panel older than the overlay that just opened: call it after the
 * overlay has noted where focus was, since a closing panel may move it. The panel the overlay is
 * declared in (`host`) and the panels that hold it stay open: closing them would unmount it.
 */
export function dismissPanels(newest: LayerToken, host?: LayerToken | null): void {
  const keep = new Set<LayerToken>();
  for (let t = host; t; t = t.parent) keep.add(t);
  taken.slice(0, taken.indexOf(newest)).forEach((t) => keep.has(t) || t.dismiss?.());
}

/**
 * Whether `target` is inside a panel that `host` opened (a select's list inside a popover): the
 * panel is teleported out of its host, so a press on it is a press outside the host's own element
 * unless the host asks. The nested panels are those holding a step whose `parent` chain reaches `host`.
 */
export function inChildLayer(host: LayerToken | undefined, target: Node): boolean {
  if (!host) return false;
  return taken.some((t) => {
    if (!t.el?.()?.contains(target)) return false;
    for (let p = t.parent; p; p = p.parent) if (p === host) return true;
    return false;
  });
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

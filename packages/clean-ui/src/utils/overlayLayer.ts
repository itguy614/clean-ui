import { OVERLAY_Z_INDEX } from "./position";

/**
 * Layering of overlays: the newest one is on top (#541).
 *
 * Every overlay (modal, confirm dialog, command palette, slideover, drawer) used to share the
 * one `--cui-z-overlay`, so which was on top came down to DOM order, and a teleported overlay
 * sits where its component *mounted*, not where it opened: a dialog that mounts late beat a
 * palette that opens later. Each overlay now takes the next step above the one open when it
 * opens, from the one counter below, and gives it back when its exit has finished.
 *
 * Steps are offsets from `--cui-z-overlay`, so a consumer re-layers the whole library with that
 * one property. A step is at most `MAX_OVERLAY_STEP` (7), which leaves the popover (+8) and
 * the tooltip (+9) above every open overlay, and a popover inside the newest overlay above
 * the overlay itself. A stack deeper than eight shares the top step and falls back to DOM order.
 * The counter is the open steps in order, newest last: with none open the next step is 0, so
 * z-index never climbs, and an out-of-order close just removes its own.
 *
 * Module state, tiny, and free of Vue, so `useOverlay` (and the editor's modal) pay almost
 * nothing, and the stack layer (`useOverlayStack`) can read what it hands out. It is only
 * touched from open and close, which run in the browser, so it is SSR safe.
 */
export const MAX_OVERLAY_STEP = 7;

const taken: number[] = [];

/** The next step above the newest open overlay's. Give it back with `giveBackOverlayStep`. */
export function takeOverlayStep(): number {
  const step = taken.length ? Math.min(taken[taken.length - 1] + 1, MAX_OVERLAY_STEP) : 0;
  taken.push(step);
  return step;
}

/** Returns a step taken earlier; the others keep theirs. */
export function giveBackOverlayStep(step: number): void {
  const i = taken.lastIndexOf(step);
  if (i !== -1) taken.splice(i, 1);
}

/** The CSS `z-index` of an overlay root at `step`. */
export function overlayZIndex(step: number): string {
  return step ? `calc(var(--cui-z-overlay, 9990) + ${step})` : OVERLAY_Z_INDEX;
}

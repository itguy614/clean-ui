import { nextTick, onScopeDispose, type Ref, type ShallowRef } from "vue";
import { usePointerDrag } from "./usePointerDrag";

export type DragEdge = "top" | "right" | "bottom" | "left";

export interface UseDragDismissOptions {
  /** The panel that moves. The drag writes `transform` straight onto it (see below). */
  panel: Ref<HTMLElement | undefined> | ShallowRef<HTMLElement | null> | Readonly<ShallowRef<HTMLElement | null>>;
  /** The edge the panel is anchored to, and so the direction a drag dismisses it. */
  edge: () => DragEdge;
  /** False turns the gesture off: a persistent overlay can't be closed, so it can't be flicked. */
  enabled: () => boolean;
  /**
   * The grab handle. A mouse drag has to start on it, so the content keeps text selection and
   * its own clicks; touch and pen drag from anywhere that isn't a field. Without one, the
   * gesture is touch and pen only.
   */
  handle?: () => HTMLElement | null | undefined;
  /**
   * Resting offsets in px from fully open, ascending (so `0` is fully open). The panel settles
   * on one of them, or closes. Defaults to `[0]`: open or closed.
   */
  stops?: () => readonly number[];
  /** False: a release never closes, it settles on the lowest stop (a persistent sheet still moves between stops). Default true. */
  dismissible?: () => boolean;
  /** Index into `stops` the panel rests at. Default 0. */
  stop?: () => number;
  /** The panel was let go and settles on `stops[index]` (also called for the one it was on). */
  onSettle?: (index: number) => void;
  /** The panel was let go past the point of closing, or flicked: close it. */
  onDismiss: () => void;
}

/** A drag short of this is a tap or a click, not a gesture. */
const SLOP = 4;
/** px per ms over the whole drag, above which a release closes (or moves a stop) however far it went (Vaul's 0.11). */
const VELOCITY = 0.11;
/** After the content last scrolled, a drag can't start for this long: a fast scroll past the top mustn't dismiss. */
const SCROLL_BLOCK_MS = 100;
/** Fraction of the way from the lowest stop to closed that a slow release has to pass to close. */
const CLOSE_AT = 0.4;
/** The furthest, px, a panel can be pulled past fully open. */
const DAMP_LIMIT = 80;
/** A flick needs at least this many px of travel: a twitch past the slop mustn't close it. */
const MIN_FLICK = 16;
/** A click this soon after a drag ended is the drag's own release, not a press. */
const CLICK_GUARD_MS = 80;

/** Elements a drag mustn't start on: it would take the caret, the selection or the slider thumb. */
const NO_DRAG = 'input, textarea, select, .cui-resizable-panels__handle, [contenteditable=""], [contenteditable="true"], [data-cui-no-drag]';

/** The further past the limit, the less it moves: tracks the finger at first, then gives up. */
function damp(overshoot: number): number {
  return DAMP_LIMIT * (1 - Math.exp(-overshoot / DAMP_LIMIT));
}

/**
 * Whether `el` is scrolled away from the dismiss end of its axis: a bottom sheet whose content
 * isn't at the top has to scroll back up before a pull-down can mean "close".
 */
function scrolledAway(el: HTMLElement, edge: DragEdge): boolean {
  const vertical = edge === "top" || edge === "bottom";
  const style = getComputedStyle(el);
  const overflow = vertical ? style.overflowY : style.overflowX;
  if (overflow !== "auto" && overflow !== "scroll") return false;
  const size = vertical ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth;
  if (size <= 1) return false;
  const pos = vertical ? el.scrollTop : el.scrollLeft;
  // Dismissing toward the start (a bottom/right edge) needs the content at its start, and
  // toward the end (top/left) at its end.
  return edge === "bottom" || edge === "right" ? pos > 1 : pos < size - 1;
}

/**
 * Drag a panel toward its edge to dismiss it (#268): the gesture behind CuiDrawer, and touch
 * drag-to-dismiss on CuiSlideover. Internal. Bind the three handlers it returns on the panel:
 * `@pointerdown`, `@click.capture`, `@scroll.capture`.
 *
 * - **Writes `transform` directly on the panel**, never an inline custom property (changing
 *   one recalculates style for every descendant on every move, which lagged a long list in
 *   Vaul) and never through Vue state, so a move re-renders nothing. The one exception to the
 *   themeable-properties pattern, like any gesture-driven motion.
 * - **Releases by velocity as well as distance**: over `VELOCITY` px/ms it closes, or moves a
 *   stop, however short the drag. Slower, it goes to the nearest stop, or closes once past
 *   `CLOSE_AT` of the way.
 * - **Dampens** a pull past fully open, which moves less the further it goes.
 * - **Scroll versus drag**: a drag that starts in scrolled content (not at the dismiss end)
 *   is left to the scroll, and for `SCROLL_BLOCK_MS` after any scroll none starts.
 * - **One pointer**: the pointer is captured once the drag starts and any other finger
 *   ignored, so the panel doesn't jump to a second touch.
 * - A pointer cancelled by the browser (it took over for scrolling) settles back, never closes.
 *
 * The panel should set `touch-action: pinch-zoom` (or `none`): a touch drag otherwise pans the
 * page instead. Scroll containers inside it keep their own native panning.
 */
export function useDragDismiss(options: UseDragDismissOptions) {
  const { panel, edge, enabled, handle, stops = () => [0], stop = () => 0, dismissible = () => true, onSettle, onDismiss } = options;
  const drag = usePointerDrag();

  let dragging = false;
  let lastScroll = -Infinity;
  let endedAt = -Infinity;
  // Per gesture:
  let originX = 0;
  let originY = 0;
  let originT = 0;
  let rest = 0;
  let size = 0;
  let offset = 0;
  let pointerId = 0;

  const vertical = () => edge() === "top" || edge() === "bottom";
  /** +1 when moving along the axis in the positive direction dismisses (bottom, right). */
  const sign = () => (edge() === "bottom" || edge() === "right" ? 1 : -1);

  const preventPan = (e: TouchEvent) => {
    if (e.cancelable) e.preventDefault();
  };

  function write(px: number) {
    const el = panel.value;
    if (!el) return;
    el.style.transform = `translate${vertical() ? "Y" : "X"}(${px * sign()}px)`;
  }

  /** Hand the panel back to its stylesheet, which carries it to wherever it rests or leaves to. */
  function release() {
    const el = panel.value;
    if (!el) return;
    el.style.transform = "";
    el.style.transition = "";
    el.removeAttribute("data-cui-dragging");
    el.removeEventListener("touchmove", preventPan);
    try {
      el.releasePointerCapture(pointerId);
    } catch {
      /* not captured, or already released */
    }
  }

  function onPointerdown(e: PointerEvent) {
    const el = panel.value;
    // A widget that tracks its own pointer (a color picker) prevents the default: not ours.
    if (!el || !enabled() || drag.active.value || e.isPrimary === false || e.defaultPrevented) return;
    const target = e.target as HTMLElement | null;
    if (!target || target.closest(NO_DRAG)) return;
    if (e.pointerType === "mouse" && !handle?.()?.contains(target)) return;
    if (performance.now() - lastScroll < SCROLL_BLOCK_MS) return;
    // Pressed in content that is scrolled away from the dismiss end: that's a scroll.
    for (let n: HTMLElement | null = target; n && n !== el; n = n.parentElement) {
      if (scrolledAway(n, edge())) return;
    }
    originX = e.clientX;
    originY = e.clientY;
    originT = performance.now();
    pointerId = e.pointerId;
    dragging = false;
    drag.start(e, onMove, onEnd);
  }

  function onMove(e: PointerEvent) {
    const el = panel.value;
    if (!el) return;
    if (!dragging) {
      const dx = e.clientX - originX;
      const dy = e.clientY - originY;
      const along = (vertical() ? dy : dx) * sign();
      const across = vertical() ? dx : dy;
      if (Math.max(Math.abs(along), Math.abs(across)) < SLOP) return;
      // Across, or away from the edge with no higher stop to go to: not ours (a swipe, a scroll).
      if (Math.abs(across) > Math.abs(along) || (along < 0 && stop() <= 0)) {
        drag.end();
        return;
      }
      dragging = true;
      const list = stops();
      rest = list[Math.max(0, Math.min(stop(), list.length - 1))] ?? 0;
      offset = rest;
      size = vertical() ? el.offsetHeight : el.offsetWidth;
      // From where the gesture committed, so the panel doesn't jump by the slop.
      originX = e.clientX;
      originY = e.clientY;
      originT = performance.now();
      try {
        el.setPointerCapture(pointerId);
      } catch {
        /* a synthetic or already-gone pointer */
      }
      el.style.transition = "none";
      el.setAttribute("data-cui-dragging", "");
      // Touch: a cancelable move is the browser's cue to scroll; refuse it.
      el.addEventListener("touchmove", preventPan, { passive: false });
      return;
    }
    const distance = (vertical() ? e.clientY - originY : e.clientX - originX) * sign();
    const next = rest + distance;
    offset = next < 0 ? -damp(-next) : Math.min(next, size);
    write(offset);
  }

  function onEnd(e: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    endedAt = performance.now();
    const list = stops();
    const current = Math.max(0, Math.min(stop(), list.length - 1));
    const velocity = (offset - rest) / Math.max(performance.now() - originT, 1);
    const lowest = list[list.length - 1] ?? 0;

    // null: close.
    let target: number | null;
    if (e.type === "pointercancel") {
      target = current;
    } else if (Math.abs(velocity) > VELOCITY && Math.abs(offset - rest) >= MIN_FLICK) {
      // A flick: one stop that way, or out past the last.
      target = velocity > 0 ? (current + 1 < list.length ? current + 1 : null) : Math.max(current - 1, 0);
    } else if (offset > lowest + (size - lowest) * CLOSE_AT) {
      target = null;
    } else {
      target = list.reduce((best, s, i) => (Math.abs(s - offset) < Math.abs((list[best] ?? 0) - offset) ? i : best), 0);
    }

    if (target === null && !dismissible()) target = list.length - 1;
    if (target === null) onDismiss();
    else onSettle?.(target);
    // The new stop, or the closing state, renders on the next tick; handing the panel back
    // before it does would carry it to the old position first.
    nextTick(release);
  }

  /** A drag's release is also a click on whatever is under the finger or pointer: swallow it. */
  function onClickCapture(e: MouseEvent) {
    if (performance.now() - endedAt < CLICK_GUARD_MS) {
      e.stopPropagation();
      e.preventDefault();
    }
  }

  function onScrollCapture() {
    lastScroll = performance.now();
  }

  onScopeDispose(() => {
    dragging = false;
    release();
  });

  return { onPointerdown, onClickCapture, onScrollCapture, dragging: drag.active };
}

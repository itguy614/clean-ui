import { onScopeDispose } from "vue";
import { prefersReducedMotion } from "../utils/motion";
import { __DEV__, warnOnce } from "../utils/devWarn";

declare const process: { env: { NODE_ENV?: string } };

export interface UseBackgroundScaleOptions {
  /** False turns it off: nothing is looked up and nothing is written. */
  enabled: () => boolean;
  /** CSS selector of the element that scales, resolved when the sheet opens. */
  selector: () => string;
}

/** How far the wrapper shrinks while a sheet is open (Vaul's 0.95). */
const SCALE_DELTA = 0.05;
/** Gap between the safe area (or the viewport) top and the scaled wrapper's top edge. */
const TOP_OFFSET = "14px";

const PROPS = ["transform", "transformOrigin", "borderRadius", "overflow", "transition"] as const;

interface Hold {
  /** How many open sheets are holding this wrapper scaled. */
  count: number;
  /** The wrapper's own inline values, handed back when the last sheet is gone. */
  saved: Record<(typeof PROPS)[number], string>;
}

/**
 * Wrappers currently scaled. A wrapper is scaled once however many sheets are open over it
 * (nested drawers share one scale rather than scaling the scaled), and only restored when the
 * last of them is gone.
 */
const holds = new WeakMap<HTMLElement, Hold>();

/** Where the wrapper is at progress `p`: 0 is its own size, 1 is fully scaled. */
function frame(el: HTMLElement, p: number) {
  el.style.transform = `translate3d(0, calc((env(safe-area-inset-top, 0px) + ${TOP_OFFSET}) * ${p}), 0) scale(${1 - SCALE_DELTA * p})`;
  el.style.borderRadius = `calc(var(--cui-radius-lg, 0.5rem) * ${p})`;
}

/** The sheet's own timing, from the tokens: the long open on the drawer curve, a fast exit. */
function transition(el: HTMLElement, mode: "enter" | "exit" | "none") {
  if (mode === "none") {
    el.style.transition = "none";
    return;
  }
  const duration = mode === "enter" ? "calc(var(--cui-duration-slow) * 2)" : "var(--cui-duration-fast)";
  el.style.transition = `transform ${duration} var(--cui-ease-drawer), border-radius ${duration} var(--cui-ease-drawer)`;
}

/** The transitions this writes: a wrapper's own animations (a loop on the app root) are none of its business and may never end. */
const ours = (a: Animation) => a instanceof CSSTransition && (a.transitionProperty === "transform" || a.transitionProperty === "border-radius");

function restore(el: HTMLElement) {
  const hold = holds.get(el);
  if (!hold || hold.count > 0) return;
  for (const p of PROPS) el.style[p] = hold.saved[p];
  holds.delete(el);
}

/**
 * The page behind a sheet scales back and rounds its corners while the sheet is open (#534),
 * following the sheet's drag. Internal; CuiDrawer's `scaleBackground`.
 *
 * - **Opt-in, and no assumed root.** The wrapper is whatever `selector` matches when the sheet
 *   opens; none found, nothing happens (and a dev warning says so).
 * - **`transform` and `border-radius` only**, written straight onto the wrapper, never through
 *   Vue state or a custom property on an ancestor: a drag writes a frame per move. Open and
 *   close are transitions on the drawer's tokens, a long open and a fast exit. The wrapper's
 *   own inline `transform`, `transform-origin`, `border-radius`, `overflow` and `transition`
 *   are saved on open and put back after the exit, or at once on unmount.
 * - **Origin** is the top of what is on screen: the wrapper's top edge, or, with the page
 *   scrolled, the viewport's, so the scaled page never slides off. The top offset keeps the
 *   safe-area inset (a notch) clear.
 * - **Nested sheets** over one wrapper share a single scale; only the sole open sheet drives it
 *   from its drag, so pulling the upper one down does not unscale the page under the lower.
 * - **Reduced motion** removes it altogether: a scale is movement.
 */
export function useBackgroundScale(options: UseBackgroundScaleOptions) {
  let el: HTMLElement | null = null;
  let counted = false;
  let dragged = false;

  function resolve(): HTMLElement | null {
    if (typeof document === "undefined") return null;
    const selector = options.selector();
    let found: Element | null = null;
    try {
      found = document.querySelector(selector);
    } catch {
      /* an invalid selector is the same as none */
    }
    if (!found && __DEV__ && process.env.NODE_ENV !== "production") {
      warnOnce(
        `[CuiDrawer] scale-background found no element matching "${selector}", so the page is not scaled. ` +
          `Mark the page wrapper with data-cui-drawer-wrapper, or set background-selector.`,
      );
    }
    return found as HTMLElement | null;
  }

  /** The sheet opened. */
  function show() {
    if (counted || !options.enabled() || prefersReducedMotion()) return;
    // A wrapper the app has since re-rendered is looked up again.
    const target = el?.isConnected ? el : resolve();
    if (!target) return;
    let hold = holds.get(target);
    if (!hold) {
      hold = { count: 0, saved: Object.fromEntries(PROPS.map((p) => [p, target.style[p]])) as Hold["saved"] };
      holds.set(target, hold);
      // The visible top: the page's own, or the viewport's once it is scrolled past.
      const rect = target.getBoundingClientRect();
      target.style.transformOrigin = `50% ${Math.min(Math.max(-rect.top, 0), rect.height)}px`;
      target.style.overflow = "hidden";
      // Laid out at its own size first, so what follows is a transition.
      frame(target, 0);
      transition(target, "none");
      void target.offsetHeight;
    }
    el = target;
    counted = true;
    hold.count++;
    if (hold.count === 1) {
      transition(target, "enter");
      frame(target, 1);
    }
  }

  /** The sheet is leaving: the page returns to its size. */
  function hide() {
    if (!counted || !el) return;
    counted = false;
    dragged = false;
    const hold = holds.get(el);
    if (!hold) return;
    hold.count--;
    if (hold.count === 0) {
      transition(el, "exit");
      frame(el, 0);
    }
  }

  /** The sheet is gone: hand the wrapper its own styles back, once its exit has played. */
  function finish(immediate = false) {
    const target = el;
    if (counted || !target) return;
    el = null;
    const running = !immediate && typeof target.getAnimations === "function" ? target.getAnimations().filter(ours) : [];
    if (running.length === 0) return restore(target);
    void Promise.allSettled(running.map((a) => a.finished)).then(() => restore(target));
  }

  /** A drag frame: `closed` is 0 with the sheet at rest and 1 with it gone. */
  function drag(closed: number) {
    if (!counted || !el || holds.get(el)?.count !== 1) return;
    dragged = true;
    transition(el, "none");
    frame(el, 1 - closed);
  }

  /** The drag let go. A dismissal leaves the page where it is for the exit to carry on from. */
  function dragEnd(dismissed: boolean) {
    if (!counted || !dragged || !el) return;
    dragged = false;
    // The last drag frame is computed before the timing changes: a transition runs from the last
    // computed value, and a flick can release in the same task as its final move.
    void el.offsetHeight;
    if (dismissed) return transition(el, "exit");
    transition(el, "enter");
    frame(el, 1);
  }

  onScopeDispose(() => {
    hide();
    finish(true);
  });

  return { show, hide, finish, drag, dragEnd };
}

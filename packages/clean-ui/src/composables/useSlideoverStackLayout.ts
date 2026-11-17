import { nextTick, onScopeDispose, ref, watch, watchPostEffect } from "vue";
import { layoutStack } from "../utils/stackLayout";
import { motionDuration, prefersReducedMotion } from "../utils/motion";
import { BREAKPOINT_ORDER, useBreakpoint } from "./useBreakpoint";
import { useEventListener } from "./useEventListener";
import type { OverlayStackContext } from "./overlay-stack-context";
import type { TailwindBreakpoint } from "../types/grid";

interface SlideoverStackLayoutOptions {
  mode: () => "auto" | "peek";
  push: () => "inward" | "outward";
  gap: () => number;
  minWidth: () => number;
  peekOffset: () => number;
  maxPeek: () => number;
  peekBelow: () => TailwindBreakpoint;
}

const VARS = ["--_stack-width", "--_stack-offset", "--_stack-max-width", "--_stack-shadow", "--_stack-seam", "--_stack-shadow-val"] as const;
const FLIP = "cui-stack-flip";

const cancelFlip = (el: HTMLElement) => el.getAnimations?.().forEach((a) => a.id === FLIP && a.cancel());

/**
 * Arranges the left or right slideovers of a stack (`layoutStack` decides where, this applies
 * it). The geometry is written as private custom properties straight onto each panel, which
 * the slideover's stylesheet reads: `--_stack-width` and `--_stack-offset`.
 *
 * Layout properties don't animate (see "Motion"), so a change that moves or resizes a panel
 * that is already open is played FLIP-style instead, on `transform` alone: the new layout is
 * applied at once, then each panel is animated from where it was drawn to where it now is, as
 * a translate and a scale about its docked edge. These are the individual `translate` and `scale`
 * properties, not `transform` with an additive composite: an additive `transform` animation starts
 * a painted frame later than the CSS transition that slides a closing panel out, which opened a dim
 * gap between the two for a frame (a flash). The individual properties start with it. A panel that is entering or leaving is not
 * part of this: it keeps the slideover's own slide. Under reduced motion the layout simply
 * snaps.
 */
export function useSlideoverStackLayout(stack: OverlayStackContext, options: SlideoverStackLayoutOptions) {
  const { breakpoint } = useBreakpoint();
  const viewport = ref(typeof window === "undefined" ? 0 : window.innerWidth);
  useEventListener("window", "resize", () => (viewport.value = window.innerWidth));

  // What each panel was last given, to know which ones moved.
  const given = new WeakMap<HTMLElement, { width: number; offset: number }>();
  let managed = new Set<HTMLElement>();
  let count = 0;
  let lastWidth = viewport.value;

  /**
   * Natural widths: what each panel measures with no stack width forced on it. Every property is
   * lifted, every width read, then every property put back, so it is one layout, not one per panel.
   */
  function naturalWidths(els: HTMLElement[]) {
    const kept = els.map((el) => [el.style.getPropertyValue("--_stack-width"), el.style.getPropertyValue("--_stack-max-width")]);
    els.forEach((el) => (el.style.removeProperty("--_stack-width"), el.style.removeProperty("--_stack-max-width")));
    const widths = els.map((el) => el.offsetWidth);
    els.forEach((el, i) => {
      if (kept[i][0]) el.style.setProperty("--_stack-width", kept[i][0]);
      if (kept[i][1]) el.style.setProperty("--_stack-max-width", kept[i][1]);
    });
    return widths;
  }

  function clear(el: HTMLElement) {
    VARS.forEach((v) => el.style.removeProperty(v));
    cancelFlip(el);
    given.delete(el);
  }

  function relayout() {
    // Reactive reads first: the effect reruns when panels open, close, mount or move.
    const gap = options.gap();
    const minWidth = options.minWidth();
    const peekOffset = options.peekOffset();
    const maxPeek = options.maxPeek();
    const peekBelow = options.peekBelow();
    const vw = viewport.value;
    const bp = breakpoint.value;
    const forcePeek = options.mode() === "peek" || (bp === "base" ? -1 : BREAKPOINT_ORDER.indexOf(bp)) < BREAKPOINT_ORDER.indexOf(peekBelow);
    const horizontal = stack.entries.filter((e) => e.side() === "left" || e.side() === "right");
    const side = horizontal[0]?.side();
    const items: HTMLElement[] = [];
    let snap = false;
    for (const entry of horizontal) {
      const el = entry.panel();
      // `hidden` is read here, so the layout re-runs when it changes: while it leaves it still
      // measures a width, and clearing it is no other trigger. A panel that is not laid out
      // either measures nothing; it takes no part.
      if (entry.hidden?.()) {
        // It vanishes at once, with no slide-out, so the others snap into the space (a FLIP
        // would leave the page showing through the hole), and it is a fresh entry when shown.
        if (el && given.delete(el)) snap = true;
        // One that has never been laid out would draw a lone panel's shadow for the instant it
        // is measured (shown, nothing set), and then fade it out to its real one: set none.
        if (el && !el.style.getPropertyValue("--_stack-shadow")) {
          el.style.setProperty("--_stack-shadow", "0");
          el.style.setProperty("--_stack-seam", "0");
        }
      } else if (el && el.offsetWidth > 0 && entry.side() === side) items.push(el);
    }

    // A panel that left the stack keeps the geometry it had, so it exits from where it stood
    // (through the docked edge) rather than jumping; its element goes when its exit ends.
    managed = new Set(items);
    // A panel leaving: the others slide back over its exit (the fast duration), not an entry's.
    const leaving = items.length < count;
    count = items.length;
    if (!items.length || typeof window === "undefined") return;

    // Where each is drawn now, running animations included, before anything changes.
    const first = new Map(items.map((el) => [el, el.getBoundingClientRect()]));
    const natural = naturalWidths(items);
    const layout = layoutStack({ natural, viewport: vw, gap, minWidth, peekOffset, maxPeek, forcePeek, push: options.push() });

    items.forEach(cancelFlip);
    // Attached panels are one surface: the shadow is the group's outer edge's alone, and the
    // seams get a hairline. Peeking panels overlap, so each casts a small one on the next.
    let outer = 0;
    layout.panels.forEach((p, i) => {
      if (p.offset + p.width > layout.panels[outer].offset + layout.panels[outer].width + 0.5) outer = i;
    });
    const moved: HTMLElement[] = [];
    const peek = layout.mode === "peek";
    items.forEach((el, i) => {
      el.style.setProperty("--_stack-shadow", peek || i === outer ? "1" : "0");
      el.style.setProperty("--_stack-seam", peek || i === outer ? "0" : "1");
      el.style.setProperty("--_stack-shadow-val", peek ? "var(--cui-shadow-md)" : "var(--cui-shadow-lg)");
      const { width, offset } = layout.panels[i];
      const before = given.get(el);
      el.style.setProperty("--_stack-width", `${width}px`);
      el.style.setProperty("--_stack-offset", `${offset}px`);
      el.style.setProperty("--_stack-max-width", "none");
      given.set(el, { width, offset });
      if (before && (Math.abs(before.width - width) > 0.5 || Math.abs(before.offset - offset) > 0.5)) moved.push(el);
    });

    // A resize snaps: panels follow the window, they do not trail it.
    const resized = vw !== lastWidth;
    lastWidth = vw;
    if (!moved.length || resized || snap || prefersReducedMotion() || typeof moved[0].animate !== "function") return;
    // Read every new rect, and the easing once, before the first animate() dirties style.
    const right = side === "right";
    const easing = getComputedStyle(moved[0]).getPropertyValue("--cui-ease-drawer").trim() || "cubic-bezier(0.32, 0.72, 0, 1)";
    const plays = moved.map((el) => {
      const from = first.get(el)!;
      const to = el.getBoundingClientRect();
      return { el, dx: right ? from.right - to.right : from.left - to.left, sx: to.width ? from.width / to.width : 1 };
    });
    for (const { el, dx, sx } of plays) {
      if (Math.abs(dx) < 0.5 && Math.abs(sx - 1) < 0.001) continue;
      el.animate(
        [{ translate: `${dx}px 0`, scale: `${sx} 1` }, { translate: "0 0", scale: "1 1" }],
        { id: FLIP, duration: motionDuration(leaving ? "fast" : "slow", el), easing },
      );
    }
  }

  watchPostEffect(relayout);
  // The effect above runs before the panel's own `v-show` has put its display back, so a panel
  // that was just shown still measures nothing there: one more pass, once the DOM has settled
  // (the same task, before a frame paints). Only a reveal needs it: a hide is read directly, and
  // a pass that moves nothing would cancel the slide the first one just started.
  watch(
    () => stack.entries.filter((e) => e.hidden?.()),
    (now, was) => {
      if (was.some((e) => !now.includes(e) && stack.entries.includes(e))) void nextTick(relayout);
    },
    { flush: "post" },
  );
  onScopeDispose(() => {
    for (const el of managed) clear(el);
    managed.clear();
  });
}

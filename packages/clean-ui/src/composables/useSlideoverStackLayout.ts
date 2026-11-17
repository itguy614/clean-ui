import { onScopeDispose, ref, watchPostEffect } from "vue";
import { layoutStack } from "../utils/stackLayout";
import { motionDuration, prefersReducedMotion } from "../utils/motion";
import { useBreakpoint } from "./useBreakpoint";
import { useEventListener } from "./useEventListener";
import type { OverlayStackContext, OverlayStackEntry } from "./overlay-stack-context";
import type { TailwindBreakpoint } from "../types/grid";

export interface SlideoverStackLayoutOptions {
  mode: () => "auto" | "peek";
  push: () => "inward" | "outward";
  gap: () => number;
  minWidth: () => number;
  peekOffset: () => number;
  maxPeek: () => number;
  peekBelow: () => TailwindBreakpoint;
}

const BREAKPOINT_ORDER = ["base", "sm", "md", "lg", "xl", "2xl"];
const VARS = ["--_stack-width", "--_stack-offset", "--_stack-max-width", "--_stack-shadow", "--_stack-seam", "--_stack-shadow-val"] as const;
const FLIP = "cui-stack-flip";

/**
 * Arranges the left or right slideovers of a stack (`layoutStack` decides where, this applies
 * it). The geometry is written as private custom properties straight onto each panel, which
 * the slideover's stylesheet reads: `--_stack-width` and `--_stack-offset`.
 *
 * Layout properties don't animate (see "Motion"), so a change that moves or resizes a panel
 * that is already open is played FLIP-style instead, on `transform` alone: the new layout is
 * applied at once, then each panel is animated from where it was drawn to where it now is, as
 * a translate and a scale about its docked edge. A panel that is entering or leaving is not
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

  /** Natural width: what the panel measures with no stack width forced on it. */
  function naturalWidth(el: HTMLElement) {
    const forced = el.style.getPropertyValue("--_stack-width");
    const cap = el.style.getPropertyValue("--_stack-max-width");
    el.style.removeProperty("--_stack-width");
    el.style.removeProperty("--_stack-max-width");
    const width = el.offsetWidth;
    if (forced) el.style.setProperty("--_stack-width", forced);
    if (cap) el.style.setProperty("--_stack-max-width", cap);
    return width;
  }

  function clear(el: HTMLElement) {
    VARS.forEach((v) => el.style.removeProperty(v));
    el.getAnimations?.().forEach((a) => a.id === FLIP && a.cancel());
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
    const forcePeek = options.mode() === "peek" || BREAKPOINT_ORDER.indexOf(breakpoint.value) < BREAKPOINT_ORDER.indexOf(peekBelow);
    const horizontal = stack.entries.filter((e) => e.side() === "left" || e.side() === "right");
    const side = horizontal[0]?.side();
    const items: { entry: OverlayStackEntry; el: HTMLElement }[] = [];
    for (const entry of horizontal) {
      const el = entry.panel();
      if (el && entry.side() === side) items.push({ entry, el });
    }

    // A panel that left the stack keeps the geometry it had, so it exits from where it stood
    // (through the docked edge) rather than jumping; its element goes when its exit ends.
    managed = new Set(items.map((i) => i.el));
    // A panel leaving: the others slide back over its exit (the fast duration), not an entry's.
    const leaving = items.length < count;
    count = items.length;
    if (!items.length || typeof window === "undefined") return;

    // Where each is drawn now, running animations included, before anything changes.
    const first = new Map(items.map(({ el }) => [el, el.getBoundingClientRect()]));
    const natural = items.map(({ el }) => naturalWidth(el));
    const layout = layoutStack({ natural, viewport: vw, gap, minWidth, peekOffset, maxPeek, forcePeek, push: options.push() });

    items.forEach(({ el }) => el.getAnimations?.().forEach((a) => a.id === FLIP && a.cancel()));
    // Attached panels are one surface: the shadow is the group's outer edge's alone, and the
    // seams get a hairline. Peeking panels overlap, so each casts a small one on the next.
    let outer = 0;
    layout.panels.forEach((p, i) => {
      if (p.offset + p.width > layout.panels[outer].offset + layout.panels[outer].width + 0.5) outer = i;
    });
    const moved: HTMLElement[] = [];
    items.forEach(({ el }, i) => {
      const peek = layout.mode === "peek";
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

    if (!moved.length || prefersReducedMotion() || typeof moved[0].animate !== "function") return;
    for (const el of moved) {
      const from = first.get(el)!;
      const to = el.getBoundingClientRect();
      const right = side === "right";
      const dx = right ? from.right - to.right : from.left - to.left;
      const sx = to.width ? from.width / to.width : 1;
      if (Math.abs(dx) < 0.5 && Math.abs(sx - 1) < 0.001) continue;
      const easing = getComputedStyle(el).getPropertyValue("--cui-ease-drawer").trim() || "cubic-bezier(0.32, 0.72, 0, 1)";
      el.animate(
        [{ transform: `translateX(${dx}px) scaleX(${sx})` }, { transform: "translateX(0) scaleX(1)" }],
        { id: FLIP, duration: motionDuration(leaving ? "fast" : "slow", el), easing, composite: "add" },
      );
    }
  }

  watchPostEffect(relayout);
  onScopeDispose(() => {
    for (const el of managed) clear(el);
    managed.clear();
  });
}

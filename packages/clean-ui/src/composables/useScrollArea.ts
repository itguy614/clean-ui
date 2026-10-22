import { computed, onBeforeUnmount, onMounted, ref, shallowRef, toValue, type CSSProperties, type MaybeRefOrGetter } from "vue";
import { useMessages } from "./useMessages";

/**
 * A scroll container, assembled once (#143): the non-scrolling wrapper, the scroller, edge
 * detection, the edge fades, and the region semantics that make an overflowing scroller
 * reachable by keyboard. CuiScrollArea is a thin shell over it; CuiTable uses it on its own
 * scroller.
 *
 * It was hand-assembled in three places, and the arrangement went wrong in two: the editor
 * toolbar's fades sat *inside* the scroller and scrolled away with the content (#125), and
 * CuiModalBody's scroller was never a tab stop, so a body with nothing focusable in it couldn't
 * be scrolled by keyboard (WCAG 2.1.1).
 *
 * ```vue
 * <div :style="area.wrapperStyle">
 *   <div :ref="area.setScroller" v-bind="area.scrollerAttrs.value"><slot /></div>
 * </div>
 * ```
 *
 * - **Edges** (`edges`, and `canScrollStart` / `canScrollEnd` along `orientation`) are logical:
 *   in a right-to-left page the start of a horizontal scroller is its right edge.
 * - **Fade.** `mask` (the default) fades the content itself with a `mask-image` on the
 *   scroller, so it works on any background. A mask makes a stacking context, which breaks a
 *   sticky header inside — so `overlay` instead hands back `overlayFades` to render as
 *   **siblings** of the scroller, painted in `--cui-scroll-area-fade-color`. Either way the
 *   scroller's scroll padding keeps an item scrolled into view clear of the fade.
 * - **Region.** While the content overflows, the scroller is `role="region"`, `tabindex="0"`
 *   and named (`ariaLabel`, `ariaLabelledby`, else the `scrollArea.region` message), so a
 *   keyboard can scroll it. When it fits, it is none of those, and adds no tab stop. Pass
 *   `region: false` when the content is itself keyboard-navigable — a toolbar's buttons.
 */
export type ScrollAreaOrientation = "horizontal" | "vertical" | "both";
export type ScrollAreaFade = "mask" | "overlay" | "none";
export type ScrollAreaEdge = "top" | "bottom" | "left" | "right";
/** A physical edge, or a horizontal one by direction: `inline-end` is the right in LTR, the left in RTL. */
export type ScrollAreaFadeEdge = ScrollAreaEdge | "inline-start" | "inline-end";

export interface UseScrollAreaOptions {
  /** Which axis scrolls. Default `vertical`. */
  orientation?: MaybeRefOrGetter<ScrollAreaOrientation>;
  /** How the edges fade. Default `mask`. */
  fade?: MaybeRefOrGetter<ScrollAreaFade>;
  /** The fade's depth. Default `1.5rem` (`--cui-scroll-area-fade-size` overrides it). */
  fadeSize?: MaybeRefOrGetter<string>;
  /** Room to keep clear at each edge beyond the fade — an overflow indicator's size. */
  edgeInset?: MaybeRefOrGetter<string | undefined>;
  /** Whether an overflowing scroller is a named, focusable region. Default `true`. */
  region?: MaybeRefOrGetter<boolean>;
  ariaLabel?: MaybeRefOrGetter<string | undefined>;
  ariaLabelledby?: MaybeRefOrGetter<string | undefined>;
  /**
   * The edges that fade and keep scroll padding. Default: every edge along `orientation`.
   * Leave out an edge something else already covers — a sticky header's top edge, where a
   * fade would lie over the header and the padding would leave a gap under it.
   */
  fadeEdges?: MaybeRefOrGetter<ScrollAreaFadeEdge[] | undefined>;
  /**
   * Called after each measurement the content or the scroller's size prompted, for a consumer
   * that derives its own state from it. Not on a scroll, which changes neither.
   */
  onUpdate?: () => void;
}

/** Sub-pixel layout rounding, and a scrollbar's last pixel, aren't overflow. */
const THRESHOLD = 1;

/**
 * The wrapper's style: the positioning context for overlay fades and indicators. Constant,
 * and structural only — the radius both wrapper and scroller should inherit belongs in the
 * consumer's stylesheet, where it can be overridden.
 */
const WRAPPER_STYLE: CSSProperties = Object.freeze({ position: "relative" });

export function useScrollArea(options: UseScrollAreaOptions = {}) {
  const messages = useMessages();
  const scroller = shallowRef<HTMLElement | null>(null);
  const edges = ref({ top: false, bottom: false, left: false, right: false });
  const rtl = ref(false);
  const overflowing = ref(false);

  const orientation = () => toValue(options.orientation) ?? "vertical";
  const fade = () => toValue(options.fade) ?? "mask";
  const fadeSize = () => `var(--cui-scroll-area-fade-size, ${toValue(options.fadeSize) ?? "1.5rem"})`;
  const horizontal = () => orientation() !== "vertical";
  const vertical = () => orientation() !== "horizontal";

  /** Measure the edges; `scrolled` when only the scroll position can have changed. */
  function measure(scrolled: boolean) {
    const el = scroller.value;
    if (!el) return;
    // Read every time, scrolls included: a page can switch direction without resizing anything.
    rtl.value = getComputedStyle(el).direction === "rtl";
    const overX = el.scrollWidth - el.clientWidth > THRESHOLD;
    const overY = el.scrollHeight - el.clientHeight > THRESHOLD;
    // Distance from the start: negative scrollLeft in a right-to-left page, in every engine now.
    const x = Math.abs(el.scrollLeft);
    const fromStartX = x > THRESHOLD;
    const fromEndX = el.scrollWidth - el.clientWidth - x > THRESHOLD;
    const next = {
      top: vertical() && overY && el.scrollTop > THRESHOLD,
      bottom: vertical() && overY && el.scrollHeight - el.clientHeight - el.scrollTop > THRESHOLD,
      left: horizontal() && overX && (rtl.value ? fromEndX : fromStartX),
      right: horizontal() && overX && (rtl.value ? fromStartX : fromEndX),
    };
    // Only on a change: a new object every scroll frame would re-render the owner — and the
    // slotted content with it, a whole table's rows in CuiTable — on every frame.
    const prev = edges.value;
    if (next.top !== prev.top || next.bottom !== prev.bottom || next.left !== prev.left || next.right !== prev.right) {
      edges.value = next;
    }
    overflowing.value = (horizontal() && overX) || (vertical() && overY);
    if (!scrolled) options.onUpdate?.();
  }

  const update = () => measure(false);
  const onScroll = () => measure(true);

  /** Content hidden before / after the visible part, along the scrolling axis. */
  const startEdge = (): ScrollAreaEdge => (orientation() === "vertical" ? "top" : rtl.value ? "right" : "left");
  const endEdge = (): ScrollAreaEdge => (orientation() === "vertical" ? "bottom" : rtl.value ? "left" : "right");
  const canScrollStart = computed(() => edges.value[startEdge()]);
  const canScrollEnd = computed(() => edges.value[endEdge()]);

  // --- Following the content ---
  // The scroller, and each of its children: content can grow without the scroller resizing,
  // and a child that grows reports it here. A child added is observed and one removed is
  // dropped — just those, so a growing list costs nothing per existing row — and observing
  // queues a first notification, which does the measuring. Scroll events re-measure directly.
  let resizeObserver: ResizeObserver | undefined;
  let mutationObserver: MutationObserver | undefined;

  function observe(el: HTMLElement) {
    resizeObserver?.disconnect();
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver ??= new ResizeObserver(update);
      resizeObserver.observe(el);
      for (const child of el.children) resizeObserver.observe(child);
    }
  }

  function onMutations(records: MutationRecord[]) {
    if (!resizeObserver) return update();
    for (const r of records) {
      for (const n of r.removedNodes) if (n instanceof Element) resizeObserver.unobserve(n);
      for (const n of r.addedNodes) if (n instanceof Element) resizeObserver.observe(n);
    }
    // A text node changes nothing a child's resize would report.
    update();
  }

  function setScroller(el: unknown) {
    const next = el instanceof HTMLElement ? el : null;
    if (next === scroller.value) return;
    scroller.value = next;
    mutationObserver?.disconnect();
    if (!next) {
      resizeObserver?.disconnect();
      return;
    }
    observe(next);
    if (typeof MutationObserver !== "undefined") {
      mutationObserver ??= new MutationObserver(onMutations);
      mutationObserver.observe(next, { childList: true });
    }
    update();
  }

  // Once more after the first layout settles (fonts, a parent that sizes itself late).
  let frame = 0;
  onMounted(() => {
    frame = requestAnimationFrame(update);
  });
  onBeforeUnmount(() => {
    cancelAnimationFrame(frame);
    resizeObserver?.disconnect();
    mutationObserver?.disconnect();
  });

  /**
   * Scroll by about three-quarters of the visible size toward an edge: always enough to
   * reveal at least one hidden item, never enough to skip one. Smooth, unless the user asks
   * for reduced motion.
   */
  function scrollByPage(edge: "start" | "end") {
    const el = scroller.value;
    if (!el) return;
    const sign = edge === "end" ? 1 : -1;
    const reduced = typeof matchMedia !== "undefined" && !!matchMedia("(prefers-reduced-motion: reduce)")?.matches;
    const behavior: ScrollBehavior = reduced ? "auto" : "smooth";
    if (orientation() === "vertical") el.scrollBy({ top: sign * el.clientHeight * 0.75, behavior });
    else el.scrollBy({ left: sign * (rtl.value ? -1 : 1) * el.clientWidth * 0.75, behavior });
  }

  // --- Fades ---
  const fadesAt = (edge: ScrollAreaEdge) => {
    const onAxis = edge === "top" || edge === "bottom" ? vertical() : horizontal();
    const allowed = toValue(options.fadeEdges);
    if (!onAxis || !allowed) return onAxis;
    const logical = edge === "left" ? (rtl.value ? "inline-end" : "inline-start") : edge === "right" ? (rtl.value ? "inline-start" : "inline-end") : edge;
    return allowed.includes(edge) || allowed.includes(logical);
  };
  /** Whether an edge is faded right now: it fades, and has something past it. */
  const faded = (edge: ScrollAreaEdge) => fadesAt(edge) && edges.value[edge];

  /** A mask gradient along one axis, fading only the edges that have something past them. */
  function maskAlong(axis: "x" | "y") {
    const size = fadeSize();
    const [a, b, dir] = axis === "x" ? (["left", "right", "to right"] as const) : (["top", "bottom", "to bottom"] as const);
    const start = faded(a) ? size : "0px";
    const end = faded(b) ? size : "0px";
    return `linear-gradient(${dir}, transparent, #000 ${start}, #000 calc(100% - ${end}), transparent)`;
  }

  const maskStyle = computed<CSSProperties>(() => {
    if (fade() !== "mask" || !overflowing.value) return {};
    const masks = [horizontal() ? maskAlong("x") : null, vertical() ? maskAlong("y") : null].filter(Boolean) as string[];
    const image = masks.join(", ");
    return masks.length > 1
      ? { maskImage: image, WebkitMaskImage: image, maskComposite: "intersect", WebkitMaskComposite: "source-in" }
      : { maskImage: image, WebkitMaskImage: image };
  });

  /** For `overlay`: one gradient per edge that has hidden content, to render beside the scroller. */
  const overlayFades = computed(() => {
    if (fade() !== "overlay") return [];
    const size = fadeSize();
    const color = "var(--cui-scroll-area-fade-color, var(--cui-surface-base, white))";
    const place: Record<ScrollAreaEdge, CSSProperties> = {
      top: { top: 0, left: 0, right: 0, height: size, background: `linear-gradient(to bottom, ${color}, transparent)` },
      bottom: { bottom: 0, left: 0, right: 0, height: size, background: `linear-gradient(to top, ${color}, transparent)` },
      left: { left: 0, top: 0, bottom: 0, width: size, background: `linear-gradient(to right, ${color}, transparent)` },
      right: { right: 0, top: 0, bottom: 0, width: size, background: `linear-gradient(to left, ${color}, transparent)` },
    };
    return (Object.keys(place) as ScrollAreaEdge[])
      .filter(faded)
      .map((edge) => ({
        edge,
        // `inherit`: on a rounded container a painted rectangle would square off its corner (#125).
        style: { position: "absolute", pointerEvents: "none", zIndex: 5, borderRadius: "inherit", ...place[edge] } as CSSProperties,
      }));
  });

  // --- Attributes ---

  const scrollerAttrs = computed(() => {
    const isRegion = (toValue(options.region) ?? true) && overflowing.value;
    const labelledby = toValue(options.ariaLabelledby);
    const inset = toValue(options.edgeInset);
    const full = fade() === "none" ? inset ?? "0px" : inset ? `calc(${fadeSize()} + ${inset})` : fadeSize();
    // Physical sides, like the edges: the padding stops a scrolled-into-view item clear of a fade.
    const pad = (edge: ScrollAreaEdge) => (fadesAt(edge) ? full : (inset ?? "0px"));
    const style: CSSProperties = {
      ...(horizontal() ? { scrollPaddingLeft: pad("left"), scrollPaddingRight: pad("right") } : {}),
      ...(vertical() ? { scrollPaddingTop: pad("top"), scrollPaddingBottom: pad("bottom") } : {}),
      ...maskStyle.value,
    };
    return {
      role: isRegion ? "region" : undefined,
      tabindex: isRegion ? 0 : undefined,
      "aria-labelledby": isRegion ? labelledby : undefined,
      "aria-label": isRegion && !labelledby ? toValue(options.ariaLabel) ?? messages.value.scrollArea.region : undefined,
      style,
      onScroll,
    };
  });

  return {
    setScroller,
    scroller,
    edges,
    canScrollStart,
    canScrollEnd,
    overflowing,
    rtl,
    wrapperStyle: WRAPPER_STYLE,
    scrollerAttrs,
    overlayFades,
    update,
    scrollByPage,
  };
}

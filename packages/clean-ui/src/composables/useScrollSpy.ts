import { computed, onMounted, onScopeDispose, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from "vue";
import { useEventListener } from "./useEventListener";
import { prefersReducedMotion } from "../utils/motion";

/** A section to watch: an element id, or the element itself (which must carry an id). */
export type ScrollSpyTarget = string | HTMLElement;

export interface UseScrollSpyOptions {
  /**
   * The observed band, as an IntersectionObserver `rootMargin`. Default
   * `"0px 0px -50% 0px"`: the top half of the scroller.
   */
  rootMargin?: MaybeRefOrGetter<string | undefined>;
  /**
   * Pixels to leave out at the top of the band, for a sticky header. Added to `rootMargin`'s
   * top inset when that is in pixels; it replaces it when that is a percentage, since an
   * IntersectionObserver margin cannot mix the two.
   */
  offset?: MaybeRefOrGetter<number | undefined>;
  /** The scrolling element. Default: the viewport. */
  root?: MaybeRefOrGetter<HTMLElement | null | undefined>;
  /**
   * The id reported while no section has reached the band: before the first observer
   * callback, during SSR, and above the first section. Usually the first section, so a
   * table of contents never renders with nothing marked. Default `null`.
   */
  initial?: MaybeRefOrGetter<string | null | undefined>;
}

export interface UseScrollSpyReturn {
  /** The id of the current section, or `initial` (default `null`) before any target has reached the band. */
  activeId: Readonly<Ref<string | null>>;
  /**
   * Make `id` the current section now, for a click on a nav entry. The observer stops
   * updating `activeId` until the scroll that follows settles (`scrollend`) or the user
   * scrolls themselves (wheel, touch, a pointer press, a scrolling key), so a smooth scroll that passes other sections
   * on the way, or a last section that can never reach the band, does not override it.
   */
  setActive: (id: string) => void;
  /**
   * Scroll section `id` into view and make it current at once: `setActive(id)` plus a scroll
   * that puts the section's top `offset` pixels below the scroller's top, so a sticky header
   * does not cover it. Smooth, or instant under `prefers-reduced-motion: reduce`. Does nothing
   * when no element has that id, or on the server.
   */
  scrollTo: (id: string) => void;
  /** Look the targets up again — after the ids in a static list appear in the DOM. */
  refresh: () => void;
}

const DEFAULT_ROOT_MARGIN = "0px 0px -50% 0px";
/** Keys that scroll a page. Others (Tab, Enter's key repeat) leave a click's hold alone. */
const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);

/** No root, or one naming the page's own scroller: the window scrolls. */
function isViewport(root: HTMLElement | null): boolean {
  return !root || root === document.documentElement || root === document.scrollingElement;
}

/** `rootMargin` with `offset` taken off its top inset. */
export function scrollSpyRootMargin(rootMargin = DEFAULT_ROOT_MARGIN, offset = 0): string {
  const parts = rootMargin.trim().split(/\s+/);
  // CSS shorthand: 1–4 values, top right bottom left.
  const [top, right = top, bottom = top, left = right] = parts;
  if (!offset) return [top, right, bottom, left].join(" ");
  const shifted = top.endsWith("%") ? -offset : (parseFloat(top) || 0) - offset;
  return [`${shifted}px`, right, bottom, left].join(" ");
}

/**
 * Tracks which section of a page the reader is in, for an on-page nav (#192). Uses an
 * IntersectionObserver, never a scroll listener.
 *
 * The rule: of the targets inside the observed band, the topmost (first in document order)
 * is current. When none is inside it — scrolled between two headings — the last one to have
 * passed above the band stays current. Before any has reached it, `activeId` is `initial` (default `null`).
 *
 * `targets` is a ref or getter, so the list can follow a page whose sections change; ids
 * are looked up on the client after mount. SSR-safe: nothing touches the DOM before mount.
 * Call in setup.
 */
export function useScrollSpy(
  targets: MaybeRefOrGetter<readonly ScrollSpyTarget[]>,
  options: UseScrollSpyOptions = {},
): UseScrollSpyReturn {
  // What the observer (or a click) says; `initial` fills in while that is null.
  const picked = ref<string | null>(null);
  const activeId = computed(() => picked.value ?? toValue(options.initial) ?? null);
  const generation = ref(0);
  // Set by setActive: the observer leaves activeId alone until the click's scroll settles.
  const locked = ref(false);

  let rootEl: HTMLElement | null = null;
  let observer: IntersectionObserver | null = null;
  let ordered: HTMLElement[] = [];
  const inBand = new Set<Element>();
  const above = new Set<Element>();

  function pick(): string | null {
    const current = ordered.find((el) => inBand.has(el));
    if (current) return current.id;
    for (let i = ordered.length - 1; i >= 0; i--) if (above.has(ordered[i])) return ordered[i].id;
    return null;
  }

  function onRecords(records: IntersectionObserverEntry[]) {
    for (const r of records) {
      if (r.isIntersecting) {
        inBand.add(r.target);
        above.delete(r.target);
      } else {
        inBand.delete(r.target);
        const rect = r.boundingClientRect;
        // A hidden or detached target has an all-zero rect: not scrolled past, just absent.
        const hidden = rect.width === 0 && rect.height === 0;
        if (!hidden && rect.bottom <= (r.rootBounds?.top ?? 0)) above.add(r.target);
        else above.delete(r.target);
      }
    }
    if (!locked.value) picked.value = pick();
  }

  function resolve(t: ScrollSpyTarget): HTMLElement | null {
    const el = typeof t === "string" ? document.getElementById(t) : t;
    return el?.id ? el : null;
  }

  function build() {
    observer?.disconnect();
    observer = null;
    inBand.clear();
    above.clear();
    rootEl = toValue(options.root) ?? null;
    const els = [...new Set(toValue(targets).map(resolve).filter((el): el is HTMLElement => !!el))];
    // Document order, not list order: "topmost" is about the page.
    ordered = els.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    // A clicked section that is no longer a target (the page changed under it) stops
    // holding, or the new observer's first records would be ignored.
    if (locked.value && !ordered.some((el) => el.id === picked.value)) locked.value = false;
    if (!ordered.length) {
      if (!locked.value) picked.value = null;
      return;
    }
    observer = new IntersectionObserver(onRecords, {
      root: rootEl,
      rootMargin: scrollSpyRootMargin(toValue(options.rootMargin), toValue(options.offset)),
      threshold: 0,
    });
    for (const el of ordered) observer.observe(el);
  }

  // Started on mount, so nothing touches the DOM on the server. Reading every entry (the
  // spread) tracks a reactive list mutated in place too; an equal list, such as a getter
  // mapping the same sections afresh, keeps the observer it has.
  onMounted(() =>
    watch(
      () => [generation.value, toValue(options.root), toValue(options.rootMargin), toValue(options.offset), ...toValue(targets)],
      (next, prev) => {
        if (!prev || next.length !== prev.length || next.some((v, i) => v !== prev[i])) build();
      },
      { flush: "post", immediate: true },
    ),
  );

  // The click's scroll ended: stop holding, but keep the clicked section until the next
  // change, since a last section may never reach the band.
  const settle = () => (locked.value = false);
  // The reader took over (it may have cut the scroll short): track where they are now.
  const takeOver = () => {
    locked.value = false;
    picked.value = pick();
  };
  // scrollend does not bubble from an element, hence capture; filter to our own scroller.
  // The viewport's scrollend fires at the document, whichever element names it as root.
  useEventListener(
    "document",
    "scrollend",
    (e) => {
      const viewport = isViewport(rootEl);
      if (e.target === (viewport ? document : rootEl)) settle();
    },
    { enabled: locked, capture: true },
  );
  // pointerdown covers a scrollbar drag, which fires no wheel or key event.
  useEventListener("window", ["wheel", "touchstart", "pointerdown"], takeOver, { enabled: locked, capture: true });
  useEventListener(
    "window",
    "keydown",
    (e) => {
      if (SCROLL_KEYS.has(e.key)) takeOver();
    },
    { enabled: locked, capture: true },
  );

  onScopeDispose(() => {
    observer?.disconnect();
    observer = null;
  });

  function setActive(id: string) {
    picked.value = id;
    locked.value = true;
  }

  function scrollTo(id: string) {
    if (typeof document === "undefined") return;
    const el = document.getElementById(id);
    if (!el) return;
    setActive(id);
    const root = toValue(options.root) ?? null;
    const offset = toValue(options.offset) ?? 0;
    const behavior: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth";
    const top = el.getBoundingClientRect().top - offset;
    if (!root || isViewport(root)) {
      window.scrollTo({ top: window.scrollY + top, behavior });
    } else {
      // Measured from the scroller's padding box, which is where its scrollTop counts from.
      const origin = root.getBoundingClientRect().top + root.clientTop;
      root.scrollTo({ top: root.scrollTop + top - origin, behavior });
    }
  }

  return {
    activeId,
    setActive,
    scrollTo,
    refresh: () => generation.value++,
  };
}

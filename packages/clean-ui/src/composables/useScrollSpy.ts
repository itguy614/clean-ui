import { onMounted, onScopeDispose, readonly, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from "vue";
import { useEventListener } from "./useEventListener";

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
}

export interface UseScrollSpyReturn {
  /** The id of the current section, or `null` before any target has reached the band. */
  activeId: Readonly<Ref<string | null>>;
  /**
   * Make `id` the current section now, for a click on a nav entry. The observer stops
   * updating `activeId` until the scroll that follows settles (`scrollend`) or the user
   * scrolls themselves (wheel, touch, a key), so a smooth scroll that passes other sections
   * on the way, or a last section that can never reach the band, does not override it.
   */
  setActive: (id: string) => void;
  /** Look the targets up again — after the ids in a static list appear in the DOM. */
  refresh: () => void;
}

const DEFAULT_ROOT_MARGIN = "0px 0px -50% 0px";

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
 * passed above the band stays current. Before any has reached it, `activeId` is `null`.
 *
 * `targets` is a ref or getter, so the list can follow a page whose sections change; ids
 * are looked up on the client after mount. SSR-safe: nothing touches the DOM before mount.
 * Call in setup.
 */
export function useScrollSpy(
  targets: MaybeRefOrGetter<readonly ScrollSpyTarget[]>,
  options: UseScrollSpyOptions = {},
): UseScrollSpyReturn {
  const activeId = ref<string | null>(null);
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
        const top = r.rootBounds?.top ?? 0;
        if (r.boundingClientRect.bottom <= top) above.add(r.target);
        else above.delete(r.target);
      }
    }
    if (!locked.value) activeId.value = pick();
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
    if (!ordered.length) {
      if (!locked.value) activeId.value = null;
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

  const unlock = () => (locked.value = false);
  // scrollend does not bubble from an element, hence capture; filter to our own scroller.
  useEventListener(
    "document",
    "scrollend",
    (e) => {
      if (e.target === (rootEl ?? document)) unlock();
    },
    { enabled: locked, capture: true },
  );
  useEventListener("window", ["wheel", "touchstart", "keydown"], unlock, { enabled: locked, capture: true });

  onScopeDispose(() => {
    observer?.disconnect();
    observer = null;
  });

  return {
    activeId: readonly(activeId),
    setActive(id: string) {
      activeId.value = id;
      locked.value = true;
    },
    refresh: () => generation.value++,
  };
}

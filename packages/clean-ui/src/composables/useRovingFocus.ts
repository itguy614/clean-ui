import { nextTick, onBeforeUnmount, onMounted, onUpdated, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from "vue";
import { firstIndex, nearestIndex, useListNavigation, type ListItems, type ListOrientation } from "./useListNavigation";

export type RovingOrientation = ListOrientation;

export interface UseRovingFocusOptions {
  /** The element containing the items. */
  container: MaybeRefOrGetter<HTMLElement | null | undefined>;
  /**
   * Selects the items inside `container`, in document order. For groups that can nest,
   * scope it to this one: `":scope > .item"`.
   */
  itemSelector: MaybeRefOrGetter<string>;
  /** Which arrow keys move. Default `vertical`. */
  orientation?: MaybeRefOrGetter<RovingOrientation>;
  /** Moving past either end comes round to the other. Default `false`. */
  wrap?: MaybeRefOrGetter<boolean>;
  /** Typing a letter moves to the next item starting with it. Default `false`. */
  typeahead?: MaybeRefOrGetter<boolean>;
  /**
   * The index holding the tab stop. Pass your own ref to start the stop somewhere other
   * than the first item (a selected tab), or to make selection follow focus (pass the
   * selected index itself). Default a new ref at 0.
   */
  activeIndex?: Ref<number>;
  /**
   * Write the tab stop onto the items yourself, rather than the host binding
   * `:tabindex="tabIndex(i)"`, and watch the container for items coming and going. For
   * items the host does not render — slot content, as in CuiToolbar. The stop then stays
   * with its item when others are added or removed before it. Default `false`.
   */
  manageTabindex?: boolean;
}

const DISABLED = ":disabled, [aria-disabled='true']";

/** Hidden inside the group (`hidden`, or `v-show`'s inline `display: none`): it can't take focus. */
function hiddenWithin(el: HTMLElement, root: HTMLElement | null | undefined): boolean {
  for (let n: HTMLElement | null = el; n && n !== root; n = n.parentElement) {
    if (n.hidden || n.style.display === "none") return true;
  }
  return false;
}

/**
 * Roving tabindex (#144): a group of items with **one** tab stop, where the arrow keys —
 * plus `Home`/`End`, and optionally type-ahead — move real focus between items. Toolbars,
 * steppers, transfer lists; the WAI-ARIA "roving tabindex" technique.
 *
 * ```vue
 * <div ref="list" @keydown="roving.onKeydown" @focusin="roving.onFocusin">
 *   <button v-for="(item, i) in items" class="item" :tabindex="roving.tabIndex(i)">…</button>
 * </div>
 * ```
 *
 * Items are read from the DOM with `itemSelector` when a key is pressed, so `i` in
 * `tabIndex(i)` must be the item's position among the matches — don't `v-if` an item out
 * inside the loop. A `disabled`, `aria-disabled="true"` or hidden item is skipped. An arrow
 * never moves focus out of the group, and `Tab` leaves it as usual. Focusing an item any
 * other way moves the tab stop to it; bind `onFocusin` to `click` as well, since Safari
 * doesn't focus a clicked button.
 *
 * For a listbox whose focus stays in an input, use `useListbox` (#205); both share the
 * index maths in `useListNavigation`.
 */
export function useRovingFocus(options: UseRovingFocusOptions) {
  const activeIndex = options.activeIndex ?? ref(0);
  const manage = options.manageTabindex ?? false;

  const container = () => toValue(options.container);
  const query = (): HTMLElement[] =>
    Array.from(container()?.querySelectorAll<HTMLElement>(toValue(options.itemSelector)) ?? []);
  const unavailable = (el: HTMLElement) => el.matches(DISABLED) || hiddenWithin(el, container());
  const asItems = (els: HTMLElement[]): ListItems => ({
    count: els.length,
    isDisabled: (i) => unavailable(els[i]),
    label: (i) => els[i].getAttribute("aria-label") ?? els[i].textContent ?? "",
  });

  const nav = useListNavigation({
    wrap: () => toValue(options.wrap) ?? false,
    orientation: () => toValue(options.orientation) ?? "vertical",
    typeahead: () => toValue(options.typeahead) ?? false,
    rtl: () => getComputedStyle(container()!).direction === "rtl",
  });

  // The stop when `activeIndex` can't hold it: its item is gone, disabled or hidden. Kept
  // apart from `activeIndex`, which may be the consumer's selection and isn't ours to
  // rewrite. null: no override, the stop is activeIndex. -1: no item can hold it.
  const fallback = ref<number | null>(null);

  function tabIndex(i: number): 0 | -1 {
    return i === (fallback.value ?? activeIndex.value) ? 0 : -1;
  }

  function focusItem(i: number, els = query()) {
    if (!els[i] || unavailable(els[i])) return;
    activeIndex.value = i;
    els[i].focus();
  }

  function onKeydown(e: KeyboardEvent) {
    // Already handled — by a nested roving group, or a control inside an item.
    if (e.defaultPrevented) return;
    const els = query();
    // Only a key on an item itself: one in a control inside an item (an inline rename
    // field), or beside the items (a search box in a toolbar), is that control's.
    const from = els.indexOf(e.target as HTMLElement);
    if (from === -1) return;
    const to = nav.indexForKey(e, from, asItems(els));
    if (to === null) return;
    e.preventDefault();
    if (to !== from && to !== -1) focusItem(to, els);
  }

  /**
   * Focus the enabled item nearest `i`, after the next render: for when the focused item has
   * just been removed (moved to another list, a tab closed), so focus lands on what took its
   * place rather than on <body>.
   */
  function focusNearest(i: number) {
    nextTick(() => {
      const els = query();
      const to = nearestIndex(asItems(els), i);
      if (to !== -1) focusItem(to, els);
    });
  }

  // Focus landing on an item, or inside one, moves the stop to that item. Also bound to
  // click: Safari doesn't focus a clicked button, so no focusin follows.
  function onFocusin(e: Event) {
    const target = e.target as Node;
    const els = query();
    const i = els.findIndex((el) => el === target || el.contains(target));
    // A click on an aria-disabled item can't take the stop.
    if (i !== -1 && !unavailable(els[i])) activeIndex.value = i;
  }

  // `manageTabindex`: the element last given the stop, so it keeps the stop when items
  // before it come or go.
  let stopEl: HTMLElement | undefined;

  // Writes the stop onto the items, as the attribute: a button's tabIndex is already 0
  // without one, and the markup should say which item holds the stop.
  function applyTabStops(els: HTMLElement[]) {
    els.forEach((el, i) => {
      const stop = tabIndex(i);
      if (stop === 0) stopEl = el;
      if (el.getAttribute("tabindex") !== String(stop)) el.setAttribute("tabindex", String(stop));
    });
  }

  // Keep exactly one tab stop as items come and go: when the active item is gone, disabled
  // or hidden, the first available item holds it instead. Runs after the host renders, and
  // — with `manageTabindex` — on every stop change and container DOM change.
  function refresh(follow = false) {
    const els = query();
    if (manage && follow && stopEl) {
      const moved = els.indexOf(stopEl);
      if (moved !== -1 && moved !== activeIndex.value) activeIndex.value = moved;
    }
    const active = els[activeIndex.value];
    fallback.value = active && !unavailable(active) ? null : firstIndex(asItems(els));
    if (manage) applyTabStops(els);
  }
  const follow = () => refresh(true);
  onMounted(follow);
  onUpdated(follow);

  let observer: MutationObserver | undefined;
  if (manage) {
    // The host doesn't re-render when the stop moves, so the fallback has to be recomputed
    // here: a stale one would keep the stop on the first enabled item.
    watch(activeIndex, () => refresh(), { flush: "sync" });
    onMounted(() => {
      const root = container();
      if (typeof MutationObserver === "undefined" || !root) return;
      observer = new MutationObserver(follow);
      observer.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["disabled", "aria-disabled", "hidden", "style"],
      });
    });
    onBeforeUnmount(() => observer?.disconnect());
  }

  return { activeIndex, tabIndex, onKeydown, onFocusin, focusItem, focusNearest };
}

import { nextTick, onMounted, onUpdated, ref, toValue, type MaybeRefOrGetter, type Ref } from "vue";
import { firstIndex, nearestIndex, useListNavigation, type ListItems, type ListOrientation } from "./useListNavigation";

export type RovingOrientation = ListOrientation;

export interface UseRovingFocusOptions {
  /** The element containing the items. */
  container: MaybeRefOrGetter<HTMLElement | null | undefined>;
  /**
   * Selects the items inside `container`, in document order. For groups that can nest,
   * scope it to this one: `":scope > .item"`.
   */
  itemSelector: string;
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
}

const DISABLED = ":disabled, [aria-disabled='true']";

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
 * inside the loop. A `disabled` or `aria-disabled="true"` item is skipped. An arrow never
 * moves focus out of the group, and `Tab` leaves it as usual. Focusing an item any other
 * way (a click) moves the tab stop to it.
 *
 * For a listbox whose focus stays in an input, use `useListbox` (#205); both share the
 * index maths in `useListNavigation`.
 */
export function useRovingFocus(options: UseRovingFocusOptions) {
  const activeIndex = options.activeIndex ?? ref(0);

  const container = () => toValue(options.container);
  const query = (): HTMLElement[] => Array.from(container()?.querySelectorAll<HTMLElement>(options.itemSelector) ?? []);
  const asItems = (els: HTMLElement[]): ListItems => ({
    count: els.length,
    isDisabled: (i) => els[i].matches(DISABLED),
    label: (i) => els[i].getAttribute("aria-label") ?? els[i].textContent ?? "",
  });

  const nav = useListNavigation({
    wrap: () => toValue(options.wrap) ?? false,
    orientation: () => toValue(options.orientation) ?? "vertical",
    typeahead: () => toValue(options.typeahead) ?? false,
    rtl: () => getComputedStyle(container()!).direction === "rtl",
  });

  // The stop when `activeIndex` can't hold it: its item is gone or disabled. Kept apart
  // from `activeIndex`, which may be the consumer's selection and isn't ours to rewrite.
  const fallback = ref(-1);

  function tabIndex(i: number): 0 | -1 {
    return i === (fallback.value === -1 ? activeIndex.value : fallback.value) ? 0 : -1;
  }

  function focusItem(i: number, els = query()) {
    if (!els[i] || els[i].matches(DISABLED)) return;
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

  // Focus landing on an item, or inside one, moves the stop to that item.
  function onFocusin(e: FocusEvent) {
    const target = e.target as Node;
    const i = query().findIndex((el) => el === target || el.contains(target));
    if (i !== -1) activeIndex.value = i;
  }

  // Keep exactly one tab stop as items come and go: when the active item is gone or
  // disabled, the first enabled item holds it instead. Runs after the host renders, so
  // items rendered by child components that update on their own aren't seen until it does.
  function settle() {
    const els = query();
    const active = els[activeIndex.value];
    fallback.value = active && !active.matches(DISABLED) ? -1 : firstIndex(asItems(els));
  }
  onMounted(settle);
  onUpdated(settle);

  return { activeIndex, tabIndex, onKeydown, onFocusin, focusItem, focusNearest };
}

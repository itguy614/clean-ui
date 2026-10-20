import { computed, nextTick, onScopeDispose, ref, watch, type Ref } from "vue";
import { useListNavigation, type ListItems } from "./useListNavigation";

/**
 * A listbox whose focus stays in an input or trigger (#205): the ARIA combobox pattern with
 * `aria-activedescendant`. CuiCombobox and CuiTagInput today, CuiSelect in #216. Internal —
 * not exported. Real focus moving between items is `useRovingFocus` instead; both share the
 * index maths in `useListNavigation`.
 *
 * The two kinds of combobox in the WAI-ARIA pattern differ in more than one key, so `mode`
 * names the kind rather than a flag per key:
 *
 * - `editable` (CuiCombobox, CuiTagInput): typing filters, so Home/End and Left/Right are
 *   the text cursor's — they hand the highlight back to the input instead of moving it.
 * - `select-only` (CuiSelect): Home/End reach the first and last option, a printable key
 *   type-aheads to an option (opening the list if needed), and Space selects like Enter.
 *
 * It owns the ids, the input's and panel's ARIA attributes, the navigation keys, Enter and
 * Escape (when given `select` / `close`), keeping a keyboard-moved highlight in view, and a
 * debounced results announcement. The component keeps the rest — Backspace on chips, focus
 * restore, its own Enter when that does more than select (TagInput's create row).
 */
export interface UseListboxOptions {
  /** Base for every id: the control's own `id` if it has one, else its useCuiId(). */
  id: string;
  mode: "editable" | "select-only";
  /** How many options are listed now. */
  count: () => number;
  isDisabled?: (i: number) => boolean;
  /** Option text, for select-only type-ahead. */
  label?: (i: number) => string;
  /** The highlighted option, -1 for none. */
  activeIndex: Ref<number>;
  /** Whether the list is showing. */
  isOpen: () => boolean;
  /** Show the list: ArrowDown/ArrowUp (and, select-only, a printable key) on a closed list. */
  open: () => void;
  /** Choose option `i`: Enter, and Space in select-only. Omit to handle Enter yourself. */
  select?: (i: number) => void;
  /** Hide the list: Escape while open. Marked handled, so an enclosing modal stays open (#278). */
  close?: () => void;
  /** Whether the component renders its own visible label; labels the input and listbox. */
  hasLabel: () => boolean;
  /** An external `aria-labelledby` (CuiFormField's), which takes precedence. */
  labelledby?: () => string | undefined;
  /** What to announce for the current results, or "" for silence. Debounced. */
  announce?: () => string;
}

/** Long enough that typing doesn't queue an announcement per keystroke. */
const ANNOUNCE_DELAY_MS = 600;

export function useListbox(options: UseListboxOptions) {
  const { id, activeIndex } = options;
  const selectOnly = options.mode === "select-only";
  const nav = useListNavigation({ typeahead: () => selectOnly && !!options.label });

  const labelId = `${id}-label`;
  const listboxId = `${id}-listbox`;
  // By position in the list as it is now. The component resets the highlight when the list
  // changes under it (typing), so an id never names a different option than it did; a
  // grouped list (#216) must still count options flat, never by DOM or group position.
  const optionId = (i: number) => `${id}-option-${i}`;

  const labelledby = computed(() => options.labelledby?.() ?? (options.hasLabel() ? labelId : undefined));

  const activeDescendant = computed(() => {
    const i = activeIndex.value;
    return options.isOpen() && i >= 0 && i < options.count() ? optionId(i) : undefined;
  });

  /** For `v-bind` on the input (editable) or trigger (select-only). */
  const inputAttrs = computed(() => ({
    role: "combobox",
    "aria-autocomplete": selectOnly ? undefined : ("list" as const),
    "aria-expanded": options.isOpen() ? ("true" as const) : ("false" as const),
    "aria-controls": options.isOpen() ? listboxId : undefined,
    "aria-activedescendant": activeDescendant.value,
    "aria-labelledby": labelledby.value,
  }));

  /** For `v-bind` on CuiListboxPanel. */
  const panelAttrs = computed(() => ({ id: listboxId, "aria-labelledby": labelledby.value }));

  const items = (): ListItems => ({ count: options.count(), isDisabled: options.isDisabled, label: options.label });

  // Only a keyboard move scrolls (and an opening that starts on the selection, which the
  // component asks for): a hover sets the highlight too, and scrolling then would drag the
  // list under the pointer.
  // Within the listbox only: scrollIntoView would scroll every scrollable ancestor too, the
  // page included, which moves the field under the pointer and repositions the panel.
  function scrollActiveIntoView() {
    const i = activeIndex.value;
    if (i < 0) return;
    nextTick(() => {
      const option = document.getElementById(optionId(i));
      const list = document.getElementById(listboxId);
      if (!option || !list) return;
      // The listbox is the panel, fixed-positioned, so it is the options' offsetParent.
      const top = option.offsetTop;
      const bottom = top + option.offsetHeight;
      if (top < list.scrollTop) list.scrollTop = top;
      else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
    });
  }

  /**
   * Handles the keys it owns and returns true if it did; the component handles the rest.
   * Call it first from the input's keydown.
   */
  function onKeydown(e: KeyboardEvent): boolean {
    // Keys confirming or navigating an IME composition are the IME's (keyCode 229 is
    // Safari's form of the same thing).
    if (e.isComposing || e.keyCode === 229) return false;
    const open = options.isOpen();

    // Alt+ArrowDown opens without moving the highlight. Other modified keys are someone
    // else's (Shift+arrow extends a text selection); useListNavigation ignores them too, but
    // the open-from-closed step below runs before it.
    if (e.altKey && e.key === "ArrowDown") {
      if (open) return false;
      e.preventDefault();
      options.open();
      return true;
    }
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return false;

    if (e.key === "Escape") {
      if (!open || !options.close) return false;
      e.preventDefault();
      options.close();
      return true;
    }

    if (e.key === "Enter" || (selectOnly && e.key === " ")) {
      if (!options.select) return false;
      e.preventDefault();
      const i = activeIndex.value;
      if (open && i >= 0 && i < options.count()) options.select(i);
      else if (!open && selectOnly) options.open();
      return true;
    }

    const vertical = e.key === "ArrowDown" || e.key === "ArrowUp";
    const homeEnd = e.key === "Home" || e.key === "End";
    // Editable: Home/End and Left/Right move the text cursor. Leave the event, but hand the
    // highlight back to the input.
    if (!selectOnly && (homeEnd || e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      if (open && activeIndex.value !== -1) activeIndex.value = -1;
      return false;
    }
    const typeahead = selectOnly && e.key.length === 1 && e.key !== " ";
    if (!vertical && !homeEnd && !typeahead) return false;

    if (!open && !typeahead) {
      e.preventDefault();
      options.open();
      return true;
    }
    if (!open) options.open();
    const to = nav.indexForKey(e, activeIndex.value, items());
    if (to === null) return false; // a type-ahead letter matching nothing
    e.preventDefault();
    if (to !== -1) activeIndex.value = to;
    scrollActiveIntoView();
    return true;
  }

  // The results announcement, debounced so typing doesn't queue one per keystroke, and
  // written only once it settles. The component renders it in a live region that is always
  // in the DOM — not in the panel, which mounts with its text and may not be announced.
  const announcement = ref("");
  let announceTimer: ReturnType<typeof setTimeout> | undefined;
  if (options.announce) {
    watch(options.announce, (text) => {
      clearTimeout(announceTimer);
      if (!text) announcement.value = "";
      else announceTimer = setTimeout(() => (announcement.value = text), ANNOUNCE_DELAY_MS);
    });
    onScopeDispose(() => clearTimeout(announceTimer));
  }

  return { listboxId, labelId, optionId, inputAttrs, panelAttrs, announcement, onKeydown, scrollActiveIntoView };
}

<script setup lang="ts">
import { ref, computed, nextTick, onBeforeUnmount, useTemplateRef, type Ref } from "vue";
import CuiButton from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";
import CuiInput from "./CuiInput.vue";
import CuiSortableList from "./CuiSortableList.vue";
import CuiToolbar from "./CuiToolbar.vue";
import type { HideableProps, DisableableProps, SizeableProps } from "../types/common";
import { clampSize } from "../utils/sizing";
import { useCuiId } from "../composables/useCuiId";
import { useLayerStack } from "../composables/useLayerStack";
import { useMessages } from "../composables/useMessages";
import { usePointerDrag } from "../composables/usePointerDrag";
import { useRovingFocus } from "../composables/useRovingFocus";
import { IconCaretDoubleLeft } from "../icons/generated/caret-double-left";
import { IconCaretDoubleRight } from "../icons/generated/caret-double-right";
import { IconCaretDown } from "../icons/generated/caret-down";
import { IconCaretLeft } from "../icons/generated/caret-left";
import { IconCaretRight } from "../icons/generated/caret-right";
import { IconCaretUp } from "../icons/generated/caret-up";
import { IconDotsSixVertical } from "../icons/generated/dots-six-vertical";
import { IconMagnifyingGlass } from "../icons/generated/magnifying-glass";

export interface TransferListItem {
  value: string | number;
  label: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
  [key: string]: unknown;
}

export interface CuiTransferListProps extends HideableProps, DisableableProps, SizeableProps {
  /** All available items */
  items: TransferListItem[];
  /** Selected values (right panel) — order is preserved */
  modelValue?: (string | number)[];
  /** Left panel title */
  sourceTitle?: string;
  /** Right panel title */
  targetTitle?: string;
  /** Show search filter on both panels */
  filterable?: boolean;
  /** Source search placeholder */
  sourcePlaceholder?: string;
  /** Target search placeholder */
  targetPlaceholder?: string;
  /** Height of each panel */
  height?: string;
  /**
   * The left list's order (v-model:sourceOrder). Unset, the left list is the unselected items in
   * `items` order and cannot be reordered. Set, it is orderable like the right one: items it names
   * come first in its order (a value that is not on the left is ignored), the rest follow in
   * `items` order, and a reorder emits `update:sourceOrder` with every left value in order.
   */
  sourceOrder?: (string | number)[];
}

const props = withDefaults(defineProps<CuiTransferListProps>(), {
  modelValue: () => [],
  filterable: true,
  height: "320px",
  size: "md",
  disabled: false,
  hidden: false,
});

// The prose props default to the message catalogue, so a localized app localizes them (#215).
const messages = useMessages();
const sourceLabel = computed(() => props.sourceTitle ?? messages.value.transferList.source);
const targetLabel = computed(() => props.targetTitle ?? messages.value.transferList.target);
const sourceFilterLabel = computed(() => props.sourcePlaceholder ?? messages.value.transferList.filterPlaceholder);
const targetFilterLabel = computed(() => props.targetPlaceholder ?? messages.value.transferList.filterPlaceholder);

const emit = defineEmits<{
  "update:modelValue": [value: (string | number)[]];
  /** The left list was reordered, or a row was dropped into it at a chosen slot (before `update:modelValue`, if both). */
  "update:sourceOrder": [value: (string | number)[]];
}>();

// State
const sourceSearch = ref("");
const targetSearch = ref("");
const sourceSelected = ref(new Set<string | number>());
const targetSelected = ref(new Set<string | number>());

const selectedSet = computed(() => new Set(props.modelValue));

// Source items (not in modelValue)
const sourceItems = computed(() => {
  const rest = props.items.filter((item) => !selectedSet.value.has(item.value));
  const named = props.sourceOrder;
  if (!named) return rest;
  // Named items first, in their order; the rest after, in `items` order (the sort is stable).
  const rank = new Map(named.map((v, i) => [v, i]));
  return rest.sort((a, b) => (rank.get(a.value) ?? named.length) - (rank.get(b.value) ?? named.length));
});

const filteredSourceItems = computed(() => {
  if (!sourceSearch.value) return sourceItems.value;
  const q = sourceSearch.value.toLowerCase();
  return sourceItems.value.filter((item) =>
    item.label.toLowerCase().includes(q) ||
    (item.description && item.description.toLowerCase().includes(q)),
  );
});

// Target items (in modelValue, preserving order)
const targetItems = computed(() =>
  props.modelValue
    .map((v) => props.items.find((item) => item.value === v))
    .filter(Boolean) as TransferListItem[],
);

const filteredTargetItems = computed(() => {
  if (!targetSearch.value) return targetItems.value;
  const q = targetSearch.value.toLowerCase();
  return targetItems.value.filter((item) =>
    item.label.toLowerCase().includes(q) ||
    (item.description && item.description.toLowerCase().includes(q)),
  );
});

// Actions
// Only the marked items the filter shows move: a mark on an item filtered out of sight
// stays, rather than moving something the user can't see. What each move would move is
// computed once, so a button is disabled exactly when its move would do nothing (#421).
const markedShown = (shown: TransferListItem[], marks: Set<string | number>) =>
  shown.filter((i) => marks.has(i.value)).map((i) => i.value);
const movableToTarget = computed(() => markedShown(filteredSourceItems.value, sourceSelected.value));
const movableAllToTarget = computed(() => sourceItems.value.filter((i) => !i.disabled).map((i) => i.value));
const movableToSource = computed(() => markedShown(filteredTargetItems.value, targetSelected.value));
/** The list whose one marked row Move up / down move: the last marked of the two, if both have one. */
const lastMarked = ref<"source" | "target">("target");
const reorderPick = computed(() => {
  const picks = [] as { side: "source" | "target"; full: (string | number)[]; index: number }[];
  const one = (marks: Set<string | number>, side: "source" | "target", full: (string | number)[]) =>
    marks.size === 1 && picks.push({ side, full, index: full.indexOf([...marks][0]) });
  one(targetSelected.value, "target", props.modelValue);
  if (props.sourceOrder) one(sourceSelected.value, "source", sourceItems.value.map((i) => i.value));
  return picks.find((p) => p.side === lastMarked.value) ?? picks[0] ?? null;
});
/** The marked row's place in its list, for Move up / down; -1 unless exactly one. */
const reorderIndex = computed(() => reorderPick.value?.index ?? -1);

function moveToTarget() {
  if (props.disabled) return;
  const moving = movableToTarget.value;
  sourceSelected.value = new Set([...sourceSelected.value].filter((v) => !moving.includes(v)));
  emit("update:modelValue", [...props.modelValue, ...moving]);
}

function moveAllToTarget() {
  if (props.disabled) return;
  const next = [...props.modelValue, ...movableAllToTarget.value];
  sourceSelected.value = new Set();
  emit("update:modelValue", next);
}

function moveToSource() {
  if (props.disabled) return;
  const remove = new Set(movableToSource.value);
  targetSelected.value = new Set([...targetSelected.value].filter((v) => !remove.has(v)));
  emit("update:modelValue", props.modelValue.filter((v) => !remove.has(v)));
}

function moveAllToSource() {
  if (props.disabled) return;
  targetSelected.value = new Set();
  emit("update:modelValue", []);
}

/** Swap the one marked item with its neighbor `by` places away, if there is one. */
function reorder(by: -1 | 1) {
  const pick = reorderPick.value;
  const to = (pick?.index ?? -1) + by;
  if (props.disabled || !pick || pick.index === -1 || to < 0 || to >= pick.full.length) return;
  const arr = [...pick.full];
  [arr[pick.index], arr[to]] = [arr[to], arr[pick.index]];
  emitOrder(pick.side, arr);
}

/** Emit a list's full order: the selected list's is the v-model, the left list's `sourceOrder`. */
const emitOrder = (side: "source" | "target", order: (string | number)[]) =>
  side === "source" ? emit("update:sourceOrder", order) : emit("update:modelValue", order);

type Marks = Ref<Set<string | number>>;

/** Mark or unmark `value` — or, with `on`, set it either way. A new Set, so it re-renders. */
function toggle(marks: Marks, value: string | number, on = !marks.value.has(value)) {
  if (marks.value.has(value) === on) return;
  const next = new Set(marks.value);
  if (on) next.add(value);
  else next.delete(value);
  marks.value = next;
}

function toggleSource(value: string | number) {
  if (props.disabled) return;
  lastMarked.value = "source";
  toggle(sourceSelected, value);
}
function toggleTarget(value: string | number) {
  if (props.disabled) return;
  lastMarked.value = "target";
  toggle(targetSelected, value);
}

// Double-click (or Enter) to move immediately. The item leaves its list's marks too, or
// "move selected" would later move it a second time.

function dblClickSource(item: TransferListItem) {
  if (props.disabled || item.disabled) return;
  toggle(sourceSelected, item.value, false);
  emit("update:modelValue", [...props.modelValue, item.value]);
}

function dblClickTarget(item: TransferListItem) {
  if (props.disabled || item.disabled) return;
  toggle(targetSelected, item.value, false);
  emit("update:modelValue", props.modelValue.filter((v) => v !== item.value));
}

// --- Drag between the lists ---
// A pointer drag from a row of either list (a source row anywhere, or a selected row's body: its
// handle is the sortable's own reorder). The row stays put, dimmed, and a ghost of it follows the
// pointer, tilted as CuiSortableList's is. Over the selected list the sortable shows its
// placeholder at the insertion point, the rows sliding aside; over the source list the panel is
// lit. Releasing commits, Escape or a cancelled pointer restores. Touch drags from the grip only
// (the rest of the row pans the panel).
type Side = "source" | "target";
interface Session {
  value: string | number;
  from: Side;
  row: HTMLElement;
  x0: number;
  y0: number;
  ghost: HTMLElement | null;
}
const drag = usePointerDrag();
let session: Session | null = null;
/** Set when a drag ends, so the click the browser sends after it does not mark the row. */
let swallowClick = false;
const dragging = ref<{ value: string | number; from: Side } | null>(null);
const overSide = ref<Side | null>(null);
const insertAt = ref<number | null>(null);
const insertSize = ref(0);
const DRAG_SLOP = 4;
const sourceScroller = useTemplateRef<HTMLElement>("sourceScroller");
const targetScroller = useTemplateRef<HTMLElement>("targetScroller");

function onRowPointerdown(e: PointerEvent, item: TransferListItem, from: Side) {
  swallowClick = false;
  const el = e.target as HTMLElement;
  if (props.disabled || item.disabled || el.closest("button, input, select, textarea, a")) return;
  if (e.pointerType === "touch" && !el.closest(".cui-transfer-list__grip")) return;
  const row = e.currentTarget as HTMLElement;
  if (drag.start(e, onDragMove, onDragEnd)) session = { value: item.value, from, row, x0: e.clientX, y0: e.clientY, ghost: null };
}

function beginDrag(s: Session) {
  const r = s.row.getBoundingClientRect();
  const ghost = s.row.cloneNode(true) as HTMLElement;
  ghost.removeAttribute("tabindex");
  ghost.removeAttribute("role");
  ghost.setAttribute("aria-hidden", "true");
  ghost.classList.add("cui-transfer-list__ghost");
  for (const [name, px] of Object.entries({ left: r.left, top: r.top, width: r.width, height: r.height })) {
    ghost.style.setProperty(`--_transfer-list-ghost-${name}`, `${px}px`);
  }
  rootEl.value?.append(ghost);
  void ghost.offsetWidth; // the lift eases in from the row's own look
  ghost.classList.add("cui-transfer-list__ghost--lifted");
  s.ghost = ghost;
  insertSize.value = r.height;
  dragging.value = { value: s.value, from: s.from };
}

const within = (el: HTMLElement | null, x: number, y: number) => {
  const r = el?.getBoundingClientRect();
  return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
};

/** The slot among a sortable's rows the pointer is at, by the rows' centers with the placeholder taken out. */
function slotAt(y: number, list: HTMLElement) {
  const rel = y - list.getBoundingClientRect().top;
  let shift = 0;
  let slot = 0;
  for (const el of list.querySelectorAll<HTMLElement>(".cui-sortable-list__item, .cui-sortable-list__placeholder")) {
    if (el.classList.contains("cui-sortable-list__placeholder")) shift = el.offsetHeight;
    else if (el.offsetTop - shift + el.offsetHeight / 2 > rel) break;
    else slot++;
  }
  return slot;
}

function onDragMove(e: PointerEvent) {
  const s = session;
  if (!s) return;
  if (!s.ghost) {
    if (Math.hypot(e.clientX - s.x0, e.clientY - s.y0) < DRAG_SLOP) return;
    beginDrag(s);
  }
  s.ghost!.style.transform = `translate3d(${e.clientX - s.x0}px, ${e.clientY - s.y0}px, 0)`;
  const side: Side | null = within(targetScroller.value, e.clientX, e.clientY) ? "target" : within(sourceScroller.value, e.clientX, e.clientY) ? "source" : null;
  overSide.value = side !== s.from ? side : null;
  // Over the left list there is a slot only when it is orderable (`sourceOrder`).
  const list = overSide.value === "target" ? targetList.value?.el : overSide.value === "source" && props.sourceOrder ? sourceList.value?.el : null;
  insertAt.value = list ? slotAt(e.clientY, list) : null;
}

/** Where in a list's full order the shown slot `slot` is: before the row there, or after the last shown. */
function fullIndex(full: (string | number)[], shown: TransferListItem[], slot: number) {
  if (slot < shown.length) return full.indexOf(shown[slot].value);
  return shown.length ? full.indexOf(shown[shown.length - 1].value) + 1 : full.length;
}

function endDrag(commit: boolean) {
  const s = session;
  session = null;
  if (!s?.ghost) return;
  const to = overSide.value;
  const slot = insertAt.value;
  s.ghost.remove();
  dragging.value = overSide.value = insertAt.value = null;
  swallowClick = true;
  if (!commit) return;
  if (to === "target") {
    toggle(sourceSelected, s.value, false);
    const next = [...props.modelValue];
    next.splice(fullIndex(next, filteredTargetItems.value, slot!), 0, s.value);
    emit("update:modelValue", next);
  } else if (to === "source") {
    toggle(targetSelected, s.value, false);
    if (slot !== null) {
      const order = sourceItems.value.map((i) => i.value);
      order.splice(fullIndex(order, filteredSourceItems.value, slot), 0, s.value);
      emit("update:sourceOrder", order); // the left order first, then the selected list that gave the row up
    }
    emit("update:modelValue", props.modelValue.filter((v) => v !== s.value));
  }
}

const onDragEnd = (e: PointerEvent) => endDrag(e.type === "pointerup");
useLayerStack({
  active: () => dragging.value !== null,
  onEscape: () => {
    drag.end();
    endDrag(false);
  },
});
onBeforeUnmount(() => {
  drag.end();
  session?.ghost?.remove();
  session = null;
});

/** The click that follows a drag must not mark or move the row it ended on. */
function onClickCapture(e: MouseEvent) {
  if (!swallowClick) return;
  swallowClick = false;
  e.stopPropagation();
}

/** A row's state modifiers: marked for transfer, disabled, and the one being dragged. */
function optionClass(marks: Set<string | number>, item: TransferListItem, side: Side) {
  return {
    "cui-transfer-list__option--selected": marks.has(item.value),
    "cui-transfer-list__option--disabled": item.disabled,
    "cui-transfer-list__option--lifted": dragging.value?.value === item.value && dragging.value.from === side,
  };
}

// --- Keyboard and ARIA (#170) ---
// Without `sourceOrder` the left list is a multiselectable role="listbox" of role="option"s with
// one tab stop (useRovingFocus): the arrows and Home/End move between items, Space marks one for
// transfer, and Enter moves the focused item across at once, as a double-click does.
// The selected list, and the left one with `sourceOrder`, are a CuiSortableList (#559): its drag
// handles are the tab stops, Space/Enter grab, and the keys below ride on a handle.
const baseId = useCuiId("transfer-list");
const ids = {
  sourceTitle: `${baseId}-source-title`,
  targetTitle: `${baseId}-target-title`,
  sourceFilter: `${baseId}-source-filter`,
  targetFilter: `${baseId}-target-filter`,
};

const OPTION = ".cui-transfer-list__option";
const HANDLE = ".cui-sortable-list__handle";
const sourceListEl = useTemplateRef<HTMLElement>("sourceListEl");
const sourceList = useTemplateRef<{ el: HTMLElement | null }>("sourceList");
const targetList = useTemplateRef<{ el: HTMLElement | null }>("targetList");
const handlesOf = (side: Side) => Array.from((side === "source" ? sourceList : targetList).value?.el?.querySelectorAll<HTMLElement>(HANDLE) ?? []);
/** A list's focusable rows, in order: the options of the plain left list, else the sortable's handles. */
const rowsOf = (side: Side) =>
  side === "source" && !props.sourceOrder ? Array.from(sourceListEl.value?.querySelectorAll<HTMLElement>(OPTION) ?? []) : handlesOf(side);
const shownOf = (side: Side) => (side === "source" ? filteredSourceItems.value : filteredTargetItems.value);
const sourceRoving = useRovingFocus({ container: sourceListEl, itemSelector: OPTION });

function onOptionKeydown(e: KeyboardEvent, item: TransferListItem, index: number) {
  // Only a key on the option itself: one in a control inside an #item slot is that control's.
  if (e.target !== e.currentTarget) return;
  if (e.altKey || e.ctrlKey || e.metaKey || props.disabled || item.disabled) return;
  if (e.key === " ") {
    e.preventDefault();
    toggleSource(item.value);
  } else if (e.key === "Enter") {
    e.preventDefault();
    dblClickSource(item);
    followMovedItem("source", item, index);
  }
}

/**
 * Keys on a sortable row's handle, taken before the sortable's own (capture): Shift+Space marks
 * the row for transfer, Delete or Backspace moves it to the other list. Space and Enter alone
 * stay the sortable's grab; a grabbed row keeps all its keys.
 */
function onSortableKeydown(e: KeyboardEvent, side: Side) {
  const handle = e.target as HTMLElement;
  if (!handle.matches?.(HANDLE) || handle.getAttribute("aria-pressed") === "true") return;
  const index = handlesOf(side).indexOf(handle);
  const item = shownOf(side)[index];
  const mark = e.key === " " && e.shiftKey;
  if (!item || e.altKey || e.ctrlKey || e.metaKey || props.disabled || item.disabled) return;
  if (!mark && e.key !== "Delete" && e.key !== "Backspace") return;
  e.preventDefault();
  e.stopPropagation();
  if (mark) return (side === "source" ? toggleSource : toggleTarget)(item.value);
  (side === "source" ? dblClickSource : dblClickTarget)(item);
  followMovedItem(side, item, index);
}

/** The enabled row nearest `index` (the later one on a tie). */
function nearestEnabled(rows: HTMLElement[], index: number) {
  for (let d = 0; d < rows.length; d++) {
    for (const el of [rows[index + d], rows[index - d]]) {
      if (el && !(el as HTMLButtonElement).disabled && el.getAttribute("aria-disabled") !== "true") return el;
    }
  }
}

/**
 * After a key moves an item across, focus what took its place in the list it left — or, if
 * that list is now empty, the item itself where it went — so focus is never dropped on <body>.
 */
function followMovedItem(from: Side, item: TransferListItem, index: number) {
  nextTick(() => {
    const stay = nearestEnabled(rowsOf(from), index);
    if (stay) return stay.focus();
    const to = from === "source" ? "target" : "source";
    rowsOf(to)[shownOf(to).findIndex((i) => i.value === item.value)]?.focus();
  });
}

const itemValue = (item: TransferListItem) => item.value;
const itemText = (item: TransferListItem) => item.label;
const itemOff = (item: TransferListItem) => !!item.disabled;

/**
 * A sortable reorders the items it shows: put them back into the list's full order, in the slots
 * the shown ones held, so an item the filter hides (or that has no entry in `items`) stays where it was.
 */
function onReorder(side: Side, next: TransferListItem[]) {
  const shown = new Set(next.map((i) => i.value));
  const values = next.map((i) => i.value);
  const full = side === "source" ? sourceItems.value.map((i) => i.value) : props.modelValue;
  emitOrder(side, full.map((v) => (shown.has(v) ? values.shift()! : v)));
}

// Expose imperative handle — the source list's tab stop, else the selected list's.
const rootEl = useTemplateRef<HTMLElement>("rootEl");
const tabStop = () =>
  [sourceListEl.value, sourceList.value?.el, targetList.value?.el].map((el) => el?.querySelector<HTMLElement>('[tabindex="0"]')).find(Boolean);
defineExpose({
  el: rootEl,
  focus: (opts?: FocusOptions) => tabStop()?.focus(opts),
  blur: () => {
    const a = document.activeElement;
    if (a instanceof HTMLElement && rootEl.value?.contains(a)) a.blur();
  },
});

// The move toolbar's buttons, top to bottom. Each is disabled exactly when it has nothing to do.
const moveButtons = computed(() => {
  const t = messages.value.transferList;
  const idx = reorderIndex.value;
  const len = reorderPick.value?.full.length;
  return [
    { key: "to-target", label: t.moveSelectedTo(targetLabel.value), icon: IconCaretRight, idle: movableToTarget.value.length === 0, run: moveToTarget },
    { key: "all-to-target", label: t.moveAllTo(targetLabel.value), icon: IconCaretDoubleRight, idle: movableAllToTarget.value.length === 0, run: moveAllToTarget },
    { key: "to-source", label: t.moveSelectedTo(sourceLabel.value), icon: IconCaretLeft, idle: movableToSource.value.length === 0, run: moveToSource },
    { key: "all-to-source", label: t.moveAllTo(sourceLabel.value), icon: IconCaretDoubleLeft, idle: targetItems.value.length === 0, run: moveAllToSource },
    { key: "up", label: t.moveUp, icon: IconCaretUp, idle: idx <= 0, run: () => reorder(-1), gapBefore: true },
    { key: "down", label: t.moveDown, icon: IconCaretDown, idle: idx === -1 || idx === len! - 1, run: () => reorder(1) },
  ];
});

// Size config. Emitted as private `--_transfer-list-*` properties on the root; the stylesheet
// reads each back through its public `--cui-transfer-list-*` token.
const SUPPORTED_SIZES = ["sm", "md", "lg"] as const;
const sizeConfig: Record<(typeof SUPPORTED_SIZES)[number], { optionFont: string; py: string; px: string; titleFont: string }> = {
  sm: { optionFont: "0.8125rem", py: "0.3125rem", px: "0.5rem", titleFont: "0.75rem" },
  md: { optionFont: "0.875rem", py: "0.4375rem", px: "0.625rem", titleFont: "0.8125rem" },
  lg: { optionFont: "0.9375rem", py: "0.5rem", px: "0.75rem", titleFont: "0.875rem" },
};
const cfg = computed(() => sizeConfig[clampSize(props.size, SUPPORTED_SIZES)]);

const rootStyle = computed(() => ({
  "--_transfer-list-font-size": cfg.value.optionFont,
  "--_transfer-list-py": cfg.value.py,
  "--_transfer-list-px": cfg.value.px,
  "--_transfer-list-title-font-size": cfg.value.titleFont,
  "--_transfer-list-max-height": props.height,
}));
</script>

<template>
  <div
    ref="rootEl"
    class="cui-transfer-list"
    :class="{ 'cui-transfer-list--disabled': disabled, 'cui-transfer-list--dragging': dragging }"
    v-show="!hidden"
    :style="rootStyle"
    @click.capture="onClickCapture"
  >
    <!-- Source panel -->
    <div class="cui-transfer-list__panel">
      <div class="cui-transfer-list__header">
        <span :id="ids.sourceTitle" class="cui-transfer-list__title">{{ sourceLabel }}</span>
        <span class="cui-transfer-list__count">{{ filteredSourceItems.length }}</span>
      </div>
      <div v-if="filterable" class="cui-transfer-list__filter">
        <span :id="ids.sourceFilter" class="cui-sr-only">{{ messages.transferList.filter(sourceLabel) }}</span>
        <CuiInput v-model="sourceSearch" :placeholder="sourceFilterLabel" size="sm" :aria-labelledby="ids.sourceFilter" :disabled="disabled">
          <template #prefix><CuiIcon :icon="IconMagnifyingGlass" size="0.75rem" /></template>
        </CuiInput>
      </div>
      <div
        ref="sourceScroller"
        class="cui-transfer-list__scroller"
        :class="{ 'cui-transfer-list__scroller--drop': overSide === 'source' && !sourceOrder }"
      >
        <!-- The listbox holds only its options; the empty message sits beside it. -->
        <div
          v-if="!sourceOrder"
          ref="sourceListEl"
          role="listbox"
          aria-multiselectable="true"
          :aria-labelledby="ids.sourceTitle"
          :aria-disabled="disabled || undefined"
          @keydown="sourceRoving.onKeydown"
          @focusin="sourceRoving.onFocusin"
        >
          <div
            v-for="(item, i) in filteredSourceItems"
            :key="String(item.value)"
            class="cui-transfer-list__option"
            :class="optionClass(sourceSelected, item, 'source')"
            role="option"
            :aria-selected="sourceSelected.has(item.value) ? 'true' : 'false'"
            :aria-disabled="item.disabled || disabled || undefined"
            :tabindex="sourceRoving.tabIndex(i)"
            :data-value="String(item.value)"
            @keydown="onOptionKeydown($event, item, i)"
            @pointerdown="onRowPointerdown($event, item, 'source')"
            @click="!item.disabled && toggleSource(item.value)"
            @dblclick="dblClickSource(item)"
          >
            <CuiIcon :icon="IconDotsSixVertical" size="0.75rem" aria-hidden="true" class="cui-transfer-list__grip" />
            <slot name="item" :item="item" :side="'source'">
              <CuiIcon v-if="item.icon" :name="item.icon" size="0.875rem" class="cui-transfer-list__item-icon" />
              <div class="cui-transfer-list__item-body">
                <div class="cui-transfer-list__label">{{ item.label }}</div>
                <div v-if="item.description" class="cui-transfer-list__description">{{ item.description }}</div>
              </div>
            </slot>
          </div>
        </div>
        <!-- With `sourceOrder` the left list is orderable: a sortable of rows, as the right one is. -->
        <CuiSortableList
          v-else
          ref="sourceList"
          class="cui-transfer-list__sortable"
          :model-value="filteredSourceItems"
          :item-key="itemValue"
          :item-label="itemText"
          :item-disabled="itemOff"
          :label="sourceLabel"
          :move-buttons="false"
          :insert-at="overSide === 'source' ? insertAt : null"
          :insert-size="insertSize"
          :disabled="disabled"
          @update:model-value="onReorder('source', $event)"
          @keydown.capture="onSortableKeydown($event, 'source')"
        >
          <template #item="{ item }">
            <div
              class="cui-transfer-list__option"
              :class="optionClass(sourceSelected, item, 'source')"
              :aria-disabled="item.disabled || disabled || undefined"
              :data-value="String(item.value)"
              @pointerdown="onRowPointerdown($event, item, 'source')"
              @click="!item.disabled && toggleSource(item.value)"
              @dblclick="dblClickSource(item)"
            >
              <slot name="item" :item="item" :side="'source'">
                <CuiIcon v-if="item.icon" :name="item.icon" size="0.875rem" class="cui-transfer-list__item-icon" />
                <div class="cui-transfer-list__item-body">
                  <div class="cui-transfer-list__label">{{ item.label }}</div>
                  <div v-if="item.description" class="cui-transfer-list__description">{{ item.description }}</div>
                </div>
              </slot>
              <span v-if="sourceSelected.has(item.value)" class="cui-sr-only">{{ messages.transferList.marked }}</span>
            </div>
          </template>
        </CuiSortableList>
        <div v-if="filteredSourceItems.length === 0 && !(sourceOrder && overSide === 'source')" class="cui-transfer-list__empty">
          {{ messages.transferList.empty }}
        </div>
      </div>
    </div>

    <!-- Move buttons: one vertical toolbar, one tab stop between the lists, Up/Down between
         its buttons (#421). A button disabled by the marks (nothing marked yet) stays
         focusable, so the stop doesn't vanish and focus isn't dropped when a move empties
         the marks; a disabled transfer list disables them outright. -->
    <CuiToolbar class="cui-transfer-list__actions" orientation="vertical" :label="messages.transferList.actions">
      <template v-for="b in moveButtons" :key="b.key">
        <div v-if="b.gapBefore" class="cui-transfer-list__actions-gap" aria-hidden="true" />
        <CuiButton
          variant="outline"
          size="xs"
          :focusable-when-disabled="!disabled"
          :aria-label="b.label"
          :disabled="disabled || b.idle"
          @click="b.run"
        >
          <CuiIcon :icon="b.icon" size="0.875rem" />
        </CuiButton>
      </template>
    </CuiToolbar>

    <!-- Target panel -->
    <div class="cui-transfer-list__panel">
      <div class="cui-transfer-list__header">
        <span :id="ids.targetTitle" class="cui-transfer-list__title">{{ targetLabel }}</span>
        <span class="cui-transfer-list__count">{{ filteredTargetItems.length }}</span>
      </div>
      <div v-if="filterable" class="cui-transfer-list__filter">
        <span :id="ids.targetFilter" class="cui-sr-only">{{ messages.transferList.filter(targetLabel) }}</span>
        <CuiInput v-model="targetSearch" :placeholder="targetFilterLabel" size="sm" :aria-labelledby="ids.targetFilter" :disabled="disabled">
          <template #prefix><CuiIcon :icon="IconMagnifyingGlass" size="0.75rem" /></template>
        </CuiInput>
      </div>
      <div
        ref="targetScroller"
        class="cui-transfer-list__scroller"
      >
        <!-- A sortable list of the rows (#559); the empty message sits beside it. -->
        <CuiSortableList
          ref="targetList"
          class="cui-transfer-list__sortable"
          :model-value="filteredTargetItems"
          :item-key="itemValue"
          :item-label="itemText"
          :item-disabled="itemOff"
          :label="targetLabel"
          :move-buttons="false"
          :insert-at="overSide === 'target' ? insertAt : null"
          :insert-size="insertSize"
          :disabled="disabled"
          @update:model-value="onReorder('target', $event)"
          @keydown.capture="onSortableKeydown($event, 'target')"
        >
          <template #item="{ item }">
            <div
              class="cui-transfer-list__option"
              :class="optionClass(targetSelected, item, 'target')"
              :aria-disabled="item.disabled || disabled || undefined"
              :data-value="String(item.value)"
              @pointerdown="onRowPointerdown($event, item, 'target')"
              @click="!item.disabled && toggleTarget(item.value)"
              @dblclick="dblClickTarget(item)"
            >
              <slot name="item" :item="item" :side="'target'">
                <CuiIcon v-if="item.icon" :name="item.icon" size="0.875rem" class="cui-transfer-list__item-icon" />
                <div class="cui-transfer-list__item-body">
                  <div class="cui-transfer-list__label">{{ item.label }}</div>
                  <div v-if="item.description" class="cui-transfer-list__description">{{ item.description }}</div>
                </div>
              </slot>
              <span v-if="targetSelected.has(item.value)" class="cui-sr-only">{{ messages.transferList.marked }}</span>
            </div>
          </template>
        </CuiSortableList>
        <div v-if="filteredTargetItems.length === 0 && overSide !== 'target'" class="cui-transfer-list__empty">
          {{ messages.transferList.empty }}
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Structural: the move toolbar sits between the lists, its buttons centered down the middle. */
.cui-transfer-list__actions {
  justify-content: center;
  flex-shrink: 0;
}

.cui-transfer-list__actions-gap {
  height: 0.5rem;
}

/* The selected list's rows are CuiSortableList items that draw as the flat transfer rows: the
   sortable's card paint is set to nothing here, the row's own padding and font stay on
   .cui-transfer-list__option inside. Its drag ghost and focus ring are the sortable's. */
.cui-transfer-list__sortable {
  --cui-sortable-list-gap: 0;
  --cui-sortable-list-px: 0;
  --cui-sortable-list-py: 0;
  --cui-sortable-list-border: 0 none;
  --cui-sortable-list-pressed-border: 0 none;
  --cui-sortable-list-radius: var(--cui-radius-sm, 0.25rem);
  --cui-sortable-list-focus-ring: var(--cui-transfer-list-focus-ring, var(--cui-primary-focus-ring));
  --cui-sortable-list-bg: var(--cui-transfer-list-bg, var(--cui-surface-base, white));
}

.cui-transfer-list__sortable .cui-sortable-list__item:has(.cui-transfer-list__option--selected) {
  background: var(--cui-transfer-list-pressed-bg, var(--cui-primary-bg));
}
</style>

<style scoped>
/* Structural rules sit at normal specificity: they are the component's layout. Everything a
   consumer might repaint sits in `:where()` (zero specificity, the whole compound, so the
   scoped `[data-v-…]` attribute adds nothing) and reads its public `--cui-transfer-list-*`
   token, falling back to a private `--_transfer-list-*` the component emits per size. */
.cui-transfer-list {
  display: flex;
  align-items: stretch;
}

:where(.cui-transfer-list) {
  gap: var(--cui-transfer-list-gap, calc(0.5rem * var(--cui-density-scale, 1)));
}

.cui-transfer-list--disabled {
  opacity: 0.5;
}

/* --- Panels --- */
.cui-transfer-list__panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:where(.cui-transfer-list__panel) {
  border: var(--cui-transfer-list-border, 1px solid var(--cui-border));
  border-radius: var(--cui-transfer-list-radius, var(--cui-radius-lg, 0.5rem));
  background: var(--cui-transfer-list-bg, var(--cui-surface-base, white));
}

.cui-transfer-list__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

:where(.cui-transfer-list__header) {
  padding: calc(0.625rem * var(--cui-density-scale, 1)) calc(0.75rem * var(--cui-density-scale, 1));
}

:where(.cui-transfer-list__title) {
  font-size: var(--_transfer-list-title-font-size);
  font-weight: 600;
  color: var(--cui-text-body);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

:where(.cui-transfer-list__count) {
  font-size: 0.6875rem;
  color: var(--cui-text-tertiary);
}

:where(.cui-transfer-list__filter) {
  padding: 0 calc(0.5rem * var(--cui-density-scale, 1)) calc(0.375rem * var(--cui-density-scale, 1));
}

.cui-transfer-list__scroller {
  flex: 1;
  overflow-y: auto;
  max-height: var(--_transfer-list-max-height);
  outline-offset: -2px;
}

:where(.cui-transfer-list__scroller) {
  padding: 0 calc(0.375rem * var(--cui-density-scale, 1)) calc(0.375rem * var(--cui-density-scale, 1));
  border-radius: 0 0 var(--cui-transfer-list-radius, var(--cui-radius-lg, 0.5rem)) var(--cui-transfer-list-radius, var(--cui-radius-lg, 0.5rem));
}

/* The source panel, lit while a selected row is dragged over it: a drag cue, not paint, so
   restyling the scroller can't erase it. The selected list shows the sortable's placeholder. */
.cui-transfer-list__scroller--drop {
  outline: 2px solid var(--cui-primary);
  background: var(--cui-primary-bg);
}

:where(.cui-transfer-list__empty) {
  padding: calc(1rem * var(--cui-density-scale, 1));
  text-align: center;
  font-size: 0.8125rem;
  color: var(--cui-text-tertiary);
}

/* --- Rows. Keyboard-crossed, so a color change has no transition (CLAUDE.md, Motion). --- */
.cui-transfer-list__option {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.cui-transfer-list__option--disabled {
  cursor: default;
}

:where(.cui-transfer-list__option) {
  gap: calc(0.5rem * var(--cui-density-scale, 1));
  padding: var(--cui-transfer-list-py, var(--_transfer-list-py)) var(--cui-transfer-list-px, var(--_transfer-list-px));
  font-size: var(--cui-transfer-list-font-size, var(--_transfer-list-font-size));
  border-radius: var(--cui-radius-sm, 0.25rem);
  background: transparent;
  color: var(--cui-transfer-list-color, var(--cui-text-body));
}

/* A row marked for transfer: the tinted selected fill, as a pressed toggle. */
:where(.cui-transfer-list__option--selected) {
  background: var(--cui-transfer-list-pressed-bg, var(--cui-primary-bg));
}

:where(.cui-transfer-list__option--disabled) {
  color: var(--cui-text-tertiary);
  opacity: 0.5;
}

/* The row a ghost was lifted from stays in place, faint. */
.cui-transfer-list__option--lifted {
  opacity: 0.4;
}

/* The ghost: a clone of the row following the pointer, lifted like CuiSortableList's dragged item
   (the same `--cui-sortable-list-drag-*` tokens). Its position follows the pointer, so it is
   geometry written by script, not a themeable slot. */
.cui-transfer-list__ghost {
  position: fixed;
  inset: var(--_transfer-list-ghost-top) auto auto var(--_transfer-list-ghost-left);
  width: var(--_transfer-list-ghost-width);
  height: var(--_transfer-list-ghost-height);
  margin: 0;
  z-index: var(--cui-z-overlay, 9990);
  box-sizing: border-box;
  pointer-events: none;
  background: var(--cui-transfer-list-bg, var(--cui-surface-base, white));
  box-shadow: var(--cui-shadow-md);
  transition: rotate var(--cui-duration-fast) var(--cui-ease-out), scale var(--cui-duration-fast) var(--cui-ease-out);
}

.cui-transfer-list__ghost--lifted {
  rotate: var(--cui-sortable-list-drag-rotate, 2deg);
  scale: var(--cui-sortable-list-drag-scale, 1.02);
  opacity: var(--cui-sortable-list-drag-opacity, 0.9);
}

.cui-transfer-list--dragging,
.cui-transfer-list--dragging * {
  cursor: grabbing;
  user-select: none;
}

@media (prefers-reduced-motion: reduce) {
  .cui-transfer-list__ghost--lifted {
    rotate: none;
    scale: none;
  }
}

:where(.cui-transfer-list__option:focus-visible) {
  outline: 2px solid var(--cui-transfer-list-focus-ring, var(--cui-primary-focus-ring));
  outline-offset: -2px;
}

:where(.cui-transfer-list__grip) {
  flex-shrink: 0;
  touch-action: none;
  color: var(--cui-text-tertiary);
  cursor: grab;
  opacity: 0.4;
}

:where(.cui-transfer-list__item-icon) {
  flex-shrink: 0;
  color: var(--cui-text-secondary);
}

.cui-transfer-list__item-body {
  flex: 1;
  min-width: 0;
}

.cui-transfer-list__label {
  line-height: 1.3;
}

:where(.cui-transfer-list__description) {
  font-size: 0.6875rem;
  color: var(--cui-text-tertiary);
  line-height: 1.3;
}
</style>

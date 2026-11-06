<script setup lang="ts">
import { ref, computed, nextTick, useTemplateRef, type Ref } from "vue";
import CuiButton from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";
import CuiInput from "./CuiInput.vue";
import CuiToolbar from "./CuiToolbar.vue";
import type { HideableProps, DisableableProps, SizeableProps } from "../types/common";
import { clampSize } from "../utils/sizing";
import { useCuiId } from "../composables/useCuiId";
import { useMessages } from "../composables/useMessages";
import { useRovingFocus } from "../composables/useRovingFocus";

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
}

const props = withDefaults(defineProps<CuiTransferListProps>(), {
  modelValue: () => [],
  filterable: true,
  height: "320px",
  size: "md",
  disabled: false,
  hidden: false,
});

// The prose props default to the message catalogue, so a localised app localises them (#215).
const messages = useMessages();
const sourceLabel = computed(() => props.sourceTitle ?? messages.value.transferList.source);
const targetLabel = computed(() => props.targetTitle ?? messages.value.transferList.target);
const sourceFilterLabel = computed(() => props.sourcePlaceholder ?? messages.value.transferList.filterPlaceholder);
const targetFilterLabel = computed(() => props.targetPlaceholder ?? messages.value.transferList.filterPlaceholder);

const emit = defineEmits<{
  "update:modelValue": [value: (string | number)[]];
}>();

// State
const sourceSearch = ref("");
const targetSearch = ref("");
const sourceSelected = ref(new Set<string | number>());
const targetSelected = ref(new Set<string | number>());

const selectedSet = computed(() => new Set(props.modelValue));

// Source items (not in modelValue)
const sourceItems = computed(() =>
  props.items.filter((item) => !selectedSet.value.has(item.value)),
);

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
/** The one marked item's place in the selected list, for Move up / down; -1 unless exactly one. */
const reorderIndex = computed(() =>
  targetSelected.value.size === 1 ? props.modelValue.indexOf([...targetSelected.value][0]) : -1,
);

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

/** Swap the one marked item with its neighbour `by` places away, if there is one. */
function reorder(by: -1 | 1) {
  const idx = reorderIndex.value;
  const to = idx + by;
  if (props.disabled || idx === -1 || to < 0 || to >= props.modelValue.length) return;
  const arr = [...props.modelValue];
  [arr[idx], arr[to]] = [arr[to], arr[idx]];
  emit("update:modelValue", arr);
}

type Marks = Ref<Set<string | number>>;

/** Mark or unmark `value` — or, with `on`, set it either way. A new Set, so it re-renders. */
function toggle(marks: Marks, value: string | number, on = !marks.value.has(value)) {
  if (marks.value.has(value) === on) return;
  const next = new Set(marks.value);
  if (on) next.add(value);
  else next.delete(value);
  marks.value = next;
}

const toggleSource = (value: string | number) => !props.disabled && toggle(sourceSelected, value);
const toggleTarget = (value: string | number) => !props.disabled && toggle(targetSelected, value);

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

// --- Drag and drop ---
const dragItem = ref<{ value: string | number; from: "source" | "target" } | null>(null);
const dropTarget = ref<{ value: string | number; side: "source" | "target"; position: "before" | "after" } | null>(null);
const dropSide = ref<"source" | "target" | null>(null);

function onDragStart(e: DragEvent, value: string | number, from: "source" | "target") {
  if (props.disabled) { e.preventDefault(); return; }
  dragItem.value = { value, from };
  e.dataTransfer!.effectAllowed = "move";
  e.dataTransfer!.setData("text/plain", String(value));
}

function onDragEnd() {
  dragItem.value = null;
  dropTarget.value = null;
  dropSide.value = null;
}

function onDragOverItem(e: DragEvent, value: string | number, side: "source" | "target") {
  e.preventDefault();
  e.dataTransfer!.dropEffect = "move";
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const midY = rect.top + rect.height / 2;
  const position = e.clientY < midY ? "before" : "after";
  dropTarget.value = { value, side, position };
}

function onDragOverPanel(e: DragEvent, side: "source" | "target") {
  e.preventDefault();
  e.dataTransfer!.dropEffect = "move";
  dropSide.value = side;
}

function onDragLeavePanel() {
  dropSide.value = null;
}

function onDropPanel(e: DragEvent, side: "source" | "target") {
  e.preventDefault();
  if (!dragItem.value) return;

  const { value, from } = dragItem.value;

  if (from === "source" && side === "target") {
    // Move to target — insert at drop position or append
    const arr = [...props.modelValue];
    if (dropTarget.value && dropTarget.value.side === "target") {
      const targetIdx = arr.indexOf(dropTarget.value.value as any);
      if (targetIdx >= 0) {
        const insertIdx = dropTarget.value.position === "after" ? targetIdx + 1 : targetIdx;
        arr.splice(insertIdx, 0, value);
      } else {
        arr.push(value);
      }
    } else {
      arr.push(value);
    }
    emit("update:modelValue", arr);
  } else if (from === "target" && side === "source") {
    // Move back to source
    emit("update:modelValue", props.modelValue.filter((v) => v !== value));
  } else if (from === "target" && side === "target") {
    // Reorder within target
    const arr = props.modelValue.filter((v) => v !== value);
    if (dropTarget.value && dropTarget.value.side === "target") {
      const targetIdx = arr.indexOf(dropTarget.value.value as any);
      if (targetIdx >= 0) {
        const insertIdx = dropTarget.value.position === "after" ? targetIdx + 1 : targetIdx;
        arr.splice(insertIdx, 0, value);
      } else {
        arr.push(value);
      }
    } else {
      arr.push(value);
    }
    emit("update:modelValue", arr);
  }

  dragItem.value = null;
  dropTarget.value = null;
  dropSide.value = null;
}

/** The modifier that draws the drop line above or below the row the drag is over. */
function dropClass(value: string | number, side: "source" | "target"): string | undefined {
  if (!dropTarget.value || dropTarget.value.value !== value || dropTarget.value.side !== side) return undefined;
  return `cui-transfer-list__option--drop-${dropTarget.value.position}`;
}

/** A row's state modifiers: marked for transfer, disabled, and the drop line. */
function optionClass(marks: Set<string | number>, item: TransferListItem, side: "source" | "target") {
  return [
    { "cui-transfer-list__option--selected": marks.has(item.value), "cui-transfer-list__option--disabled": item.disabled },
    dropClass(item.value, side),
  ];
}

// --- Keyboard and ARIA (#170) ---
// Each list is a multiselectable role="listbox" of role="option"s with one tab stop
// (useRovingFocus): the arrows and Home/End move between items, Space marks one for
// transfer, and Enter moves the focused item across at once, as a double-click does.
const baseId = useCuiId("transfer-list");
const ids = {
  sourceTitle: `${baseId}-source-title`,
  targetTitle: `${baseId}-target-title`,
  sourceFilter: `${baseId}-source-filter`,
  targetFilter: `${baseId}-target-filter`,
};

const OPTION = ".cui-transfer-list__option";
const sourceListEl = useTemplateRef<HTMLElement>("sourceListEl");
const targetListEl = useTemplateRef<HTMLElement>("targetListEl");
const sourceRoving = useRovingFocus({ container: sourceListEl, itemSelector: OPTION });
const targetRoving = useRovingFocus({ container: targetListEl, itemSelector: OPTION });

function onOptionKeydown(e: KeyboardEvent, item: TransferListItem, side: "source" | "target", index: number) {
  // Only a key on the option itself: one in a control inside an #item slot is that control's.
  if (e.target !== e.currentTarget) return;
  if (e.altKey || e.ctrlKey || e.metaKey || props.disabled || item.disabled) return;
  if (e.key === " ") {
    e.preventDefault();
    toggle(side === "source" ? sourceSelected : targetSelected, item.value);
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (side === "source") dblClickSource(item);
    else dblClickTarget(item);
    followMovedItem(side, item, index);
  }
}

/**
 * After Enter moves an item across, focus what took its place in the list it left — or, if
 * that list is now empty, the item itself where it went — so focus is never dropped on <body>.
 */
function followMovedItem(from: "source" | "target", item: TransferListItem, index: number) {
  const [left, leftRoving, arrived, arrivedRoving] =
    from === "source"
      ? [sourceListEl, sourceRoving, targetListEl, targetRoving]
      : [targetListEl, targetRoving, sourceListEl, sourceRoving];
  nextTick(() => {
    if (left.value?.querySelector(OPTION)) return leftRoving.focusNearest(index);
    const opts = Array.from(arrived.value?.querySelectorAll<HTMLElement>(OPTION) ?? []);
    const at = opts.findIndex((o) => o.dataset.value === String(item.value));
    if (at !== -1) arrivedRoving.focusItem(at, opts);
  });
}

// Expose imperative handle — the source list's tab stop, else the selected list's.
const rootEl = useTemplateRef<HTMLElement>("rootEl");
const tabStop = () =>
  sourceListEl.value?.querySelector<HTMLElement>('[tabindex="0"]') ?? targetListEl.value?.querySelector<HTMLElement>('[tabindex="0"]');
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
  return [
    { key: "to-target", label: t.moveSelectedTo(targetLabel.value), icon: "caret-right", idle: movableToTarget.value.length === 0, run: moveToTarget },
    { key: "all-to-target", label: t.moveAllTo(targetLabel.value), icon: "caret-double-right", idle: movableAllToTarget.value.length === 0, run: moveAllToTarget },
    { key: "to-source", label: t.moveSelectedTo(sourceLabel.value), icon: "caret-left", idle: movableToSource.value.length === 0, run: moveToSource },
    { key: "all-to-source", label: t.moveAllTo(sourceLabel.value), icon: "caret-double-left", idle: targetItems.value.length === 0, run: moveAllToSource },
    { key: "up", label: t.moveUp, icon: "caret-up", idle: idx <= 0, run: () => reorder(-1), gapBefore: true },
    { key: "down", label: t.moveDown, icon: "caret-down", idle: idx === -1 || idx === props.modelValue.length - 1, run: () => reorder(1) },
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
    :class="{ 'cui-transfer-list--disabled': disabled }"
    v-show="!hidden"
    :style="rootStyle"
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
          <template #prefix><CuiIcon name="magnifying-glass" size="0.75rem" /></template>
        </CuiInput>
      </div>
      <div
        class="cui-transfer-list__scroller"
        :class="{ 'cui-transfer-list__scroller--drop': dropSide === 'source' && dragItem?.from === 'target' }"
        @dragover="onDragOverPanel($event, 'source')"
        @dragleave="onDragLeavePanel"
        @drop="onDropPanel($event, 'source')"
      >
        <!-- The listbox holds only its options; the empty message sits beside it. -->
        <div
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
            @keydown="onOptionKeydown($event, item, 'source', i)"
            :draggable="!item.disabled && !disabled"
            @click="!item.disabled && toggleSource(item.value)"
            @dblclick="dblClickSource(item)"
            @dragstart="onDragStart($event, item.value, 'source')"
            @dragend="onDragEnd"
            @dragover="onDragOverItem($event, item.value, 'source')"
          >
            <CuiIcon name="dots-six-vertical" size="0.75rem" aria-hidden="true" class="cui-transfer-list__grip" />
            <slot name="item" :item="item" :side="'source'">
              <CuiIcon v-if="item.icon" :name="item.icon" size="0.875rem" class="cui-transfer-list__item-icon" />
              <div class="cui-transfer-list__item-body">
                <div class="cui-transfer-list__label">{{ item.label }}</div>
                <div v-if="item.description" class="cui-transfer-list__description">{{ item.description }}</div>
              </div>
            </slot>
          </div>
        </div>
        <div v-if="filteredSourceItems.length === 0" class="cui-transfer-list__empty">
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
          <CuiIcon :name="b.icon" size="0.875rem" />
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
          <template #prefix><CuiIcon name="magnifying-glass" size="0.75rem" /></template>
        </CuiInput>
      </div>
      <div
        class="cui-transfer-list__scroller"
        :class="{ 'cui-transfer-list__scroller--drop': dropSide === 'target' && dragItem?.from === 'source' }"
        @dragover="onDragOverPanel($event, 'target')"
        @dragleave="onDragLeavePanel"
        @drop="onDropPanel($event, 'target')"
      >
        <!-- The listbox holds only its options; the empty message sits beside it. -->
        <div
          ref="targetListEl"
          role="listbox"
          aria-multiselectable="true"
          :aria-labelledby="ids.targetTitle"
          :aria-disabled="disabled || undefined"
          @keydown="targetRoving.onKeydown"
          @focusin="targetRoving.onFocusin"
        >
          <div
            v-for="(item, i) in filteredTargetItems"
            :key="String(item.value)"
            class="cui-transfer-list__option"
            :class="optionClass(targetSelected, item, 'target')"
            role="option"
            :aria-selected="targetSelected.has(item.value) ? 'true' : 'false'"
            :aria-disabled="item.disabled || disabled || undefined"
            :tabindex="targetRoving.tabIndex(i)"
            :data-value="String(item.value)"
            @keydown="onOptionKeydown($event, item, 'target', i)"
            :draggable="!item.disabled && !disabled"
            @click="!item.disabled && toggleTarget(item.value)"
            @dblclick="dblClickTarget(item)"
            @dragstart="onDragStart($event, item.value, 'target')"
            @dragend="onDragEnd"
            @dragover="onDragOverItem($event, item.value, 'target')"
          >
            <CuiIcon name="dots-six-vertical" size="0.75rem" aria-hidden="true" class="cui-transfer-list__grip" />
            <slot name="item" :item="item" :side="'target'">
              <CuiIcon v-if="item.icon" :name="item.icon" size="0.875rem" class="cui-transfer-list__item-icon" />
              <div class="cui-transfer-list__item-body">
                <div class="cui-transfer-list__label">{{ item.label }}</div>
                <div v-if="item.description" class="cui-transfer-list__description">{{ item.description }}</div>
              </div>
            </slot>
          </div>
        </div>
        <div v-if="filteredTargetItems.length === 0" class="cui-transfer-list__empty">
          {{ messages.transferList.empty }}
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Structural: the move toolbar sits between the lists, its buttons centred down the middle. */
.cui-transfer-list__actions {
  justify-content: center;
  flex-shrink: 0;
}

.cui-transfer-list__actions-gap {
  height: 0.5rem;
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

/* The dashed drop zone, while a row from the other list is dragged over this one. A drag
   cue, not paint: at normal specificity, so restyling the scroller can't erase it. */
.cui-transfer-list__scroller--drop {
  outline: 2px dashed var(--cui-primary);
}

:where(.cui-transfer-list__empty) {
  padding: calc(1rem * var(--cui-density-scale, 1));
  text-align: center;
  font-size: 0.8125rem;
  color: var(--cui-text-tertiary);
}

/* --- Rows. Keyboard-crossed, so a colour change has no transition (CLAUDE.md, Motion). --- */
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

/* The line where a dragged row would land: a drag cue, at normal specificity. */
.cui-transfer-list__option--drop-before {
  border-top: 2px solid var(--cui-primary);
}

.cui-transfer-list__option--drop-after {
  border-bottom: 2px solid var(--cui-primary);
}

:where(.cui-transfer-list__option:focus-visible) {
  outline: 2px solid var(--cui-transfer-list-focus-ring, var(--cui-primary-focus-ring));
  outline-offset: -2px;
}

:where(.cui-transfer-list__grip) {
  flex-shrink: 0;
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

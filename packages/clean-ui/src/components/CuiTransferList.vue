<script setup lang="ts">
import { ref, computed, nextTick, useTemplateRef, type Ref } from "vue";
import CuiButton from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";
import CuiInput from "./CuiInput.vue";
import type { HideableProps, DisableableProps } from "../types/common";
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

export interface CuiTransferListProps extends HideableProps, DisableableProps {
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
  /** Size */
  size?: "sm" | "md" | "lg";
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
// stays, rather than moving something the user can't see.
function moveToTarget() {
  if (props.disabled) return;
  const moving = filteredSourceItems.value.filter((i) => sourceSelected.value.has(i.value)).map((i) => i.value);
  sourceSelected.value = new Set([...sourceSelected.value].filter((v) => !moving.includes(v)));
  emit("update:modelValue", [...props.modelValue, ...moving]);
}

function moveAllToTarget() {
  if (props.disabled) return;
  const next = [...props.modelValue, ...sourceItems.value.filter((i) => !i.disabled).map((i) => i.value)];
  sourceSelected.value = new Set();
  emit("update:modelValue", next);
}

function moveToSource() {
  if (props.disabled) return;
  const remove = new Set(filteredTargetItems.value.filter((i) => targetSelected.value.has(i.value)).map((i) => i.value));
  targetSelected.value = new Set([...targetSelected.value].filter((v) => !remove.has(v)));
  emit("update:modelValue", props.modelValue.filter((v) => !remove.has(v)));
}

function moveAllToSource() {
  if (props.disabled) return;
  targetSelected.value = new Set();
  emit("update:modelValue", []);
}

function moveUp() {
  if (props.disabled || targetSelected.value.size !== 1) return;
  const val = [...targetSelected.value][0];
  const arr = [...props.modelValue];
  const idx = arr.indexOf(val);
  if (idx > 0) {
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    emit("update:modelValue", arr);
  }
}

function moveDown() {
  if (props.disabled || targetSelected.value.size !== 1) return;
  const val = [...targetSelected.value][0];
  const arr = [...props.modelValue];
  const idx = arr.indexOf(val);
  if (idx < arr.length - 1) {
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    emit("update:modelValue", arr);
  }
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

function dropIndicatorStyle(value: string | number, side: "source" | "target"): Record<string, string> | undefined {
  if (!dropTarget.value || dropTarget.value.value !== value || dropTarget.value.side !== side) return undefined;
  const border = "2px solid var(--cui-primary)";
  return dropTarget.value.position === "before"
    ? { borderTop: border }
    : { borderBottom: border };
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

// Size config
const sizeConfig: Record<string, { fontSize: string; itemPad: string; titleFont: string }> = {
  sm: { fontSize: "0.8125rem", itemPad: "0.3125rem 0.5rem", titleFont: "0.75rem" },
  md: { fontSize: "0.875rem", itemPad: "0.4375rem 0.625rem", titleFont: "0.8125rem" },
  lg: { fontSize: "0.9375rem", itemPad: "0.5rem 0.75rem", titleFont: "0.875rem" },
};
const cfg = computed(() => sizeConfig[props.size]);

function itemStyle(selected: boolean, disabled?: boolean) {
  return {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.5rem * var(--cui-density-scale, 1))",
    padding: cfg.value.itemPad,
    fontSize: cfg.value.fontSize,
    cursor: disabled ? "default" : "pointer",
    borderRadius: "0.25rem",
    background: selected ? "var(--cui-primary-bg)" : "transparent",
    color: disabled ? "var(--cui-text-tertiary)" : "var(--cui-text-body)",
    opacity: disabled ? "0.5" : "1",
    transition: "background 0.1s ease",
    userSelect: "none" as const,
  };
}

const panelStyle = computed(() => ({
  flex: "1",
  minWidth: "0",
  border: "1px solid var(--cui-border)",
  borderRadius: "0.5rem",
  background: "var(--cui-surface-base, white)",
  display: "flex",
  flexDirection: "column" as const,
  overflow: "hidden",
}));
</script>

<template>
  <div
    ref="rootEl"
    class="cui-transfer-list"
    v-show="!hidden"
    :style="{
      display: 'flex',
      gap: 'calc(0.5rem * var(--cui-density-scale, 1))',
      alignItems: 'stretch',
      opacity: disabled ? '0.5' : '1',
    }"
  >
    <!-- Source panel -->
    <div :style="panelStyle">
      <div :style="{ padding: 'calc(0.625rem * var(--cui-density-scale, 1)) calc(0.75rem * var(--cui-density-scale, 1))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }">
        <span :id="ids.sourceTitle" :style="{ fontSize: cfg.titleFont, fontWeight: '600', color: 'var(--cui-text-body)', textTransform: 'uppercase', letterSpacing: '0.03em' }">{{ sourceLabel }}</span>
        <span :style="{ fontSize: '0.6875rem', color: 'var(--cui-text-tertiary)' }">{{ filteredSourceItems.length }}</span>
      </div>
      <div v-if="filterable" :style="{ padding: '0 calc(0.5rem * var(--cui-density-scale, 1)) calc(0.375rem * var(--cui-density-scale, 1))' }">
        <span :id="ids.sourceFilter" class="cui-sr-only">{{ messages.transferList.filter(sourceLabel) }}</span>
        <CuiInput v-model="sourceSearch" :placeholder="sourceFilterLabel" size="sm" :aria-labelledby="ids.sourceFilter" :disabled="disabled">
          <template #prefix><CuiIcon name="magnifying-glass" size="0.75rem" /></template>
        </CuiInput>
      </div>
      <div
        :style="{
          flex: '1', overflowY: 'auto', padding: '0 calc(0.375rem * var(--cui-density-scale, 1)) calc(0.375rem * var(--cui-density-scale, 1))', maxHeight: height,
          outline: dropSide === 'source' && dragItem?.from === 'target' ? '2px dashed var(--cui-primary)' : 'none',
          outlineOffset: '-2px', borderRadius: '0 0 0.5rem 0.5rem',
        }"
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
            role="option"
            :aria-selected="sourceSelected.has(item.value) ? 'true' : 'false'"
            :aria-disabled="item.disabled || disabled || undefined"
            :tabindex="sourceRoving.tabIndex(i)"
            :data-value="String(item.value)"
            @keydown="onOptionKeydown($event, item, 'source', i)"
            :draggable="!item.disabled && !disabled"
            :style="{ ...itemStyle(sourceSelected.has(item.value), item.disabled), ...dropIndicatorStyle(item.value, 'source') }"
            @click="!item.disabled && toggleSource(item.value)"
            @dblclick="dblClickSource(item)"
            @dragstart="onDragStart($event, item.value, 'source')"
            @dragend="onDragEnd"
            @dragover="onDragOverItem($event, item.value, 'source')"
          >
            <CuiIcon name="dots-six-vertical" size="0.75rem" aria-hidden="true" :style="{ flexShrink: '0', color: 'var(--cui-text-tertiary)', cursor: 'grab', opacity: '0.4' }" />
            <slot name="item" :item="item" :side="'source'">
              <CuiIcon v-if="item.icon" :name="item.icon" size="0.875rem" :style="{ flexShrink: '0', color: 'var(--cui-text-secondary)' }" />
              <div :style="{ flex: '1', minWidth: '0' }">
                <div :style="{ lineHeight: '1.3' }">{{ item.label }}</div>
                <div v-if="item.description" :style="{ fontSize: '0.6875rem', color: 'var(--cui-text-tertiary)', lineHeight: '1.3' }">{{ item.description }}</div>
              </div>
            </slot>
          </div>
        </div>
        <div v-if="filteredSourceItems.length === 0" :style="{ padding: 'calc(1rem * var(--cui-density-scale, 1))', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--cui-text-tertiary)' }">
          {{ messages.transferList.empty }}
        </div>
      </div>
    </div>

    <!-- Action buttons -->
    <div :style="{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'calc(0.25rem * var(--cui-density-scale, 1))', flexShrink: '0' }">
      <CuiButton variant="outline" size="xs" :aria-label="messages.transferList.moveSelectedTo(targetLabel)" :disabled="disabled || sourceSelected.size === 0" @click="moveToTarget">
        <CuiIcon name="caret-right" size="0.875rem" />
      </CuiButton>
      <CuiButton variant="outline" size="xs" :aria-label="messages.transferList.moveAllTo(targetLabel)" :disabled="disabled || sourceItems.length === 0" @click="moveAllToTarget">
        <CuiIcon name="caret-double-right" size="0.875rem" />
      </CuiButton>
      <CuiButton variant="outline" size="xs" :aria-label="messages.transferList.moveSelectedTo(sourceLabel)" :disabled="disabled || targetSelected.size === 0" @click="moveToSource">
        <CuiIcon name="caret-left" size="0.875rem" />
      </CuiButton>
      <CuiButton variant="outline" size="xs" :aria-label="messages.transferList.moveAllTo(sourceLabel)" :disabled="disabled || targetItems.length === 0" @click="moveAllToSource">
        <CuiIcon name="caret-double-left" size="0.875rem" />
      </CuiButton>
      <div :style="{ height: '0.5rem' }" />
      <CuiButton variant="outline" size="xs" :aria-label="messages.transferList.moveUp" :disabled="disabled || targetSelected.size !== 1" @click="moveUp">
        <CuiIcon name="caret-up" size="0.875rem" />
      </CuiButton>
      <CuiButton variant="outline" size="xs" :aria-label="messages.transferList.moveDown" :disabled="disabled || targetSelected.size !== 1" @click="moveDown">
        <CuiIcon name="caret-down" size="0.875rem" />
      </CuiButton>
    </div>

    <!-- Target panel -->
    <div :style="panelStyle">
      <div :style="{ padding: 'calc(0.625rem * var(--cui-density-scale, 1)) calc(0.75rem * var(--cui-density-scale, 1))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }">
        <span :id="ids.targetTitle" :style="{ fontSize: cfg.titleFont, fontWeight: '600', color: 'var(--cui-text-body)', textTransform: 'uppercase', letterSpacing: '0.03em' }">{{ targetLabel }}</span>
        <span :style="{ fontSize: '0.6875rem', color: 'var(--cui-text-tertiary)' }">{{ filteredTargetItems.length }}</span>
      </div>
      <div v-if="filterable" :style="{ padding: '0 calc(0.5rem * var(--cui-density-scale, 1)) calc(0.375rem * var(--cui-density-scale, 1))' }">
        <span :id="ids.targetFilter" class="cui-sr-only">{{ messages.transferList.filter(targetLabel) }}</span>
        <CuiInput v-model="targetSearch" :placeholder="targetFilterLabel" size="sm" :aria-labelledby="ids.targetFilter" :disabled="disabled">
          <template #prefix><CuiIcon name="magnifying-glass" size="0.75rem" /></template>
        </CuiInput>
      </div>
      <div
        :style="{
          flex: '1', overflowY: 'auto', padding: '0 calc(0.375rem * var(--cui-density-scale, 1)) calc(0.375rem * var(--cui-density-scale, 1))', maxHeight: height,
          outline: dropSide === 'target' && dragItem?.from === 'source' ? '2px dashed var(--cui-primary)' : 'none',
          outlineOffset: '-2px', borderRadius: '0 0 0.5rem 0.5rem',
        }"
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
            role="option"
            :aria-selected="targetSelected.has(item.value) ? 'true' : 'false'"
            :aria-disabled="item.disabled || disabled || undefined"
            :tabindex="targetRoving.tabIndex(i)"
            :data-value="String(item.value)"
            @keydown="onOptionKeydown($event, item, 'target', i)"
            :draggable="!item.disabled && !disabled"
            :style="{ ...itemStyle(targetSelected.has(item.value), item.disabled), ...dropIndicatorStyle(item.value, 'target') }"
            @click="!item.disabled && toggleTarget(item.value)"
            @dblclick="dblClickTarget(item)"
            @dragstart="onDragStart($event, item.value, 'target')"
            @dragend="onDragEnd"
            @dragover="onDragOverItem($event, item.value, 'target')"
          >
            <CuiIcon name="dots-six-vertical" size="0.75rem" aria-hidden="true" :style="{ flexShrink: '0', color: 'var(--cui-text-tertiary)', cursor: 'grab', opacity: '0.4' }" />
            <slot name="item" :item="item" :side="'target'">
              <CuiIcon v-if="item.icon" :name="item.icon" size="0.875rem" :style="{ flexShrink: '0', color: 'var(--cui-text-secondary)' }" />
              <div :style="{ flex: '1', minWidth: '0' }">
                <div :style="{ lineHeight: '1.3' }">{{ item.label }}</div>
                <div v-if="item.description" :style="{ fontSize: '0.6875rem', color: 'var(--cui-text-tertiary)', lineHeight: '1.3' }">{{ item.description }}</div>
              </div>
            </slot>
          </div>
        </div>
        <div v-if="filteredTargetItems.length === 0" :style="{ padding: 'calc(1rem * var(--cui-density-scale, 1))', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--cui-text-tertiary)' }">
          {{ messages.transferList.empty }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* --- Themeable: zero specificity, so a consumer's own rule wins (see CuiButton.vue) --- */
:where(.cui-transfer-list__option:focus-visible) {
  outline: 2px solid var(--cui-transfer-list-focus-ring, var(--cui-primary-focus-ring));
  outline-offset: -2px;
}
</style>

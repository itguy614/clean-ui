<script setup lang="ts">
import { ref, computed } from "vue";
import CuiButton from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";
import CuiInput from "./CuiInput.vue";

export interface TransferListItem {
  value: string | number;
  label: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
  [key: string]: unknown;
}

export interface CuiTransferListProps {
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
  /** Disabled */
  disabled?: boolean;
  /** Hidden */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiTransferListProps>(), {
  modelValue: () => [],
  sourceTitle: "Available",
  targetTitle: "Selected",
  filterable: true,
  sourcePlaceholder: "Filter...",
  targetPlaceholder: "Filter...",
  height: "320px",
  size: "md",
  disabled: false,
  hidden: false,
});

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
function moveToTarget() {
  if (props.disabled) return;
  const next = [...props.modelValue, ...sourceSelected.value];
  sourceSelected.value = new Set();
  emit("update:modelValue", next);
}

function moveAllToTarget() {
  if (props.disabled) return;
  const next = [...props.modelValue, ...sourceItems.value.filter((i) => !i.disabled).map((i) => i.value)];
  sourceSelected.value = new Set();
  emit("update:modelValue", next);
}

function moveToSource() {
  if (props.disabled) return;
  const remove = targetSelected.value;
  const next = props.modelValue.filter((v) => !remove.has(v));
  targetSelected.value = new Set();
  emit("update:modelValue", next);
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

function toggleSource(value: string | number) {
  if (props.disabled) return;
  const next = new Set(sourceSelected.value);
  next.has(value) ? next.delete(value) : next.add(value);
  sourceSelected.value = next;
}

function toggleTarget(value: string | number) {
  if (props.disabled) return;
  const next = new Set(targetSelected.value);
  next.has(value) ? next.delete(value) : next.add(value);
  targetSelected.value = next;
}

// Double-click to move immediately
function dblClickSource(item: TransferListItem) {
  if (props.disabled || item.disabled) return;
  emit("update:modelValue", [...props.modelValue, item.value]);
}

function dblClickTarget(item: TransferListItem) {
  if (props.disabled) return;
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
    gap: "0.5rem",
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
    v-show="!hidden"
    :style="{
      display: 'flex',
      gap: '0.5rem',
      alignItems: 'stretch',
      opacity: disabled ? '0.5' : '1',
    }"
  >
    <!-- Source panel -->
    <div :style="panelStyle">
      <div :style="{ padding: '0.625rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }">
        <span :style="{ fontSize: cfg.titleFont, fontWeight: '600', color: 'var(--cui-text-body)', textTransform: 'uppercase', letterSpacing: '0.03em' }">{{ sourceTitle }}</span>
        <span :style="{ fontSize: '0.6875rem', color: 'var(--cui-text-tertiary)' }">{{ filteredSourceItems.length }}</span>
      </div>
      <div v-if="filterable" :style="{ padding: '0 0.5rem 0.375rem' }">
        <CuiInput v-model="sourceSearch" :placeholder="sourcePlaceholder" size="sm">
          <template #prefix><CuiIcon name="magnifying-glass" size="0.75rem" /></template>
        </CuiInput>
      </div>
      <div
        :style="{
          flex: '1', overflowY: 'auto', padding: '0 0.375rem 0.375rem', maxHeight: height,
          outline: dropSide === 'source' && dragItem?.from === 'target' ? '2px dashed var(--cui-primary)' : 'none',
          outlineOffset: '-2px', borderRadius: '0 0 0.5rem 0.5rem',
        }"
        @dragover="onDragOverPanel($event, 'source')"
        @dragleave="onDragLeavePanel"
        @drop="onDropPanel($event, 'source')"
      >
        <div
          v-for="item in filteredSourceItems"
          :key="String(item.value)"
          :draggable="!item.disabled && !disabled"
          :style="{ ...itemStyle(sourceSelected.has(item.value), item.disabled), ...dropIndicatorStyle(item.value, 'source') }"
          @click="!item.disabled && toggleSource(item.value)"
          @dblclick="dblClickSource(item)"
          @dragstart="onDragStart($event, item.value, 'source')"
          @dragend="onDragEnd"
          @dragover="onDragOverItem($event, item.value, 'source')"
        >
          <CuiIcon name="dots-six-vertical" size="0.75rem" :style="{ flexShrink: '0', color: 'var(--cui-text-tertiary)', cursor: 'grab', opacity: '0.4' }" />
          <slot name="item" :item="item" :side="'source'">
            <CuiIcon v-if="item.icon" :name="item.icon" size="0.875rem" :style="{ flexShrink: '0', color: 'var(--cui-text-secondary)' }" />
            <div :style="{ flex: '1', minWidth: '0' }">
              <div :style="{ lineHeight: '1.3' }">{{ item.label }}</div>
              <div v-if="item.description" :style="{ fontSize: '0.6875rem', color: 'var(--cui-text-tertiary)', lineHeight: '1.3' }">{{ item.description }}</div>
            </div>
          </slot>
        </div>
        <div v-if="filteredSourceItems.length === 0" :style="{ padding: '1rem', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--cui-text-tertiary)' }">
          No items
        </div>
      </div>
    </div>

    <!-- Action buttons -->
    <div :style="{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.25rem', flexShrink: '0' }">
      <CuiButton variant="outline" size="xs" :disabled="disabled || sourceSelected.size === 0" @click="moveToTarget">
        <CuiIcon name="caret-right" size="0.875rem" />
      </CuiButton>
      <CuiButton variant="outline" size="xs" :disabled="disabled || sourceItems.length === 0" @click="moveAllToTarget">
        <CuiIcon name="caret-double-right" size="0.875rem" />
      </CuiButton>
      <CuiButton variant="outline" size="xs" :disabled="disabled || targetSelected.size === 0" @click="moveToSource">
        <CuiIcon name="caret-left" size="0.875rem" />
      </CuiButton>
      <CuiButton variant="outline" size="xs" :disabled="disabled || targetItems.length === 0" @click="moveAllToSource">
        <CuiIcon name="caret-double-left" size="0.875rem" />
      </CuiButton>
      <div :style="{ height: '0.5rem' }" />
      <CuiButton variant="outline" size="xs" :disabled="disabled || targetSelected.size !== 1" @click="moveUp">
        <CuiIcon name="caret-up" size="0.875rem" />
      </CuiButton>
      <CuiButton variant="outline" size="xs" :disabled="disabled || targetSelected.size !== 1" @click="moveDown">
        <CuiIcon name="caret-down" size="0.875rem" />
      </CuiButton>
    </div>

    <!-- Target panel -->
    <div :style="panelStyle">
      <div :style="{ padding: '0.625rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }">
        <span :style="{ fontSize: cfg.titleFont, fontWeight: '600', color: 'var(--cui-text-body)', textTransform: 'uppercase', letterSpacing: '0.03em' }">{{ targetTitle }}</span>
        <span :style="{ fontSize: '0.6875rem', color: 'var(--cui-text-tertiary)' }">{{ filteredTargetItems.length }}</span>
      </div>
      <div v-if="filterable" :style="{ padding: '0 0.5rem 0.375rem' }">
        <CuiInput v-model="targetSearch" :placeholder="targetPlaceholder" size="sm">
          <template #prefix><CuiIcon name="magnifying-glass" size="0.75rem" /></template>
        </CuiInput>
      </div>
      <div
        :style="{
          flex: '1', overflowY: 'auto', padding: '0 0.375rem 0.375rem', maxHeight: height,
          outline: dropSide === 'target' && dragItem?.from === 'source' ? '2px dashed var(--cui-primary)' : 'none',
          outlineOffset: '-2px', borderRadius: '0 0 0.5rem 0.5rem',
        }"
        @dragover="onDragOverPanel($event, 'target')"
        @dragleave="onDragLeavePanel"
        @drop="onDropPanel($event, 'target')"
      >
        <div
          v-for="item in filteredTargetItems"
          :key="String(item.value)"
          draggable="true"
          :style="{ ...itemStyle(targetSelected.has(item.value)), ...dropIndicatorStyle(item.value, 'target') }"
          @click="toggleTarget(item.value)"
          @dblclick="dblClickTarget(item)"
          @dragstart="onDragStart($event, item.value, 'target')"
          @dragend="onDragEnd"
          @dragover="onDragOverItem($event, item.value, 'target')"
        >
          <CuiIcon name="dots-six-vertical" size="0.75rem" :style="{ flexShrink: '0', color: 'var(--cui-text-tertiary)', cursor: 'grab', opacity: '0.4' }" />
          <slot name="item" :item="item" :side="'target'">
            <CuiIcon v-if="item.icon" :name="item.icon" size="0.875rem" :style="{ flexShrink: '0', color: 'var(--cui-text-secondary)' }" />
            <div :style="{ flex: '1', minWidth: '0' }">
              <div :style="{ lineHeight: '1.3' }">{{ item.label }}</div>
              <div v-if="item.description" :style="{ fontSize: '0.6875rem', color: 'var(--cui-text-tertiary)', lineHeight: '1.3' }">{{ item.description }}</div>
            </div>
          </slot>
        </div>
        <div v-if="filteredTargetItems.length === 0" :style="{ padding: '1rem', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--cui-text-tertiary)' }">
          No items
        </div>
      </div>
    </div>
  </div>
</template>

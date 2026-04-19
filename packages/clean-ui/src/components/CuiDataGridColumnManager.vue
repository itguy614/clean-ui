<script setup lang="ts">
import { ref } from "vue";
import { useDataGridState } from "../composables/useDataGrid";
import CuiPopover from "./CuiPopover.vue";
import CuiButton from "./CuiButton.vue";
import CuiCheckbox from "./CuiCheckbox.vue";
import CuiIcon from "./CuiIcon.vue";

const grid = useDataGridState();

const dragIndex = ref<number | null>(null);
const dropIndex = ref<number | null>(null);

function getLabel(key: string): string {
  return grid.columns.find((c) => c.key === key)?.label ?? key;
}

function onDragStart(e: DragEvent, index: number) {
  dragIndex.value = index;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  }
}

function onDragOver(e: DragEvent, index: number) {
  e.preventDefault();
  dropIndex.value = index;
}

function onDragLeave() {
  dropIndex.value = null;
}

function onDrop(e: DragEvent, toIndex: number) {
  e.preventDefault();
  if (dragIndex.value !== null && dragIndex.value !== toIndex) {
    grid.reorderColumns(dragIndex.value, toIndex);
  }
  dragIndex.value = null;
  dropIndex.value = null;
}

function onDragEnd() {
  dragIndex.value = null;
  dropIndex.value = null;
}
</script>

<template>
  <CuiPopover placement="bottom" width="240px" title="Columns">
    <CuiButton variant="outline" size="sm">
      <template #prefix><CuiIcon name="columns" size="0.875rem" /></template>
      Columns
    </CuiButton>
    <template #content>
      <div style="display: flex; flex-direction: column; gap: 0.125rem;">
        <div
          v-for="(cs, index) in grid.columnState.value"
          :key="cs.key"
          draggable="true"
          style="display: flex; align-items: center; gap: 0.5rem; padding: 0.375rem 0; border-radius: 0.25rem; cursor: grab;"
          :style="{
            opacity: dragIndex === index ? 0.5 : 1,
            borderTop: dropIndex === index ? '2px solid var(--cui-primary)' : '2px solid transparent',
          }"
          @dragstart="onDragStart($event, index)"
          @dragover="onDragOver($event, index)"
          @dragleave="onDragLeave"
          @drop="onDrop($event, index)"
          @dragend="onDragEnd"
        >
          <CuiIcon name="dots-six-vertical" size="0.875rem" style="color: var(--cui-text-tertiary); flex-shrink: 0;" />
          <CuiCheckbox
            :model-value="cs.visible"
            :label="getLabel(cs.key)"
            @update:model-value="grid.toggleColumnVisibility(cs.key)"
          />
        </div>
      </div>
    </template>
  </CuiPopover>
</template>

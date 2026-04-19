<script setup lang="ts">
import { computed } from "vue";
import { useDataGridState } from "../composables/useDataGrid";
import type { DataGridBulkAction, DataGridRow } from "../types/data-grid";
import CuiButton from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";

const props = defineProps<{
  actions: DataGridBulkAction[];
}>();

const emit = defineEmits<{
  "bulk-action": [payload: { action: DataGridBulkAction; rows: DataGridRow[] }];
}>();

const grid = useDataGridState();

const selectedCount = computed(() => grid.selectedRows.value.size);
const isVisible = computed(() => selectedCount.value > 0);

function getSelectedRows(): DataGridRow[] {
  return grid.displayData.value.filter((row) =>
    grid.selectedRows.value.has(String(row.id ?? "")),
  );
}

function onAction(action: DataGridBulkAction) {
  emit("bulk-action", { action, rows: getSelectedRows() });
}
</script>

<template>
  <Transition name="cui-bulk-bar">
    <div v-if="isVisible" class="cui-data-grid-bulk-bar">
      <div class="cui-data-grid-bulk-bar__inner">
        <span class="cui-data-grid-bulk-bar__count">
          {{ selectedCount }} item{{ selectedCount === 1 ? "" : "s" }} selected
        </span>

        <div class="cui-data-grid-bulk-bar__actions">
          <CuiButton
            v-for="action in actions"
            :key="action.key"
            size="xs"
            :variant="action.variant === 'destructive' ? 'solid' : 'outline'"
            :color="action.variant === 'destructive' ? 'error' : 'primary'"
            @click="onAction(action)"
          >
            {{ action.label }}
          </CuiButton>
        </div>

        <CuiButton
          variant="ghost"
          size="xs"
          @click="grid.clearSelection()"
          style="margin-left: auto;"
        >
          <template #prefix><CuiIcon name="x" size="0.75rem" /></template>
          Clear
        </CuiButton>
      </div>
    </div>
  </Transition>
</template>

<style>
.cui-data-grid-bulk-bar {
  position: sticky;
  bottom: 0;
  z-index: 20;
  padding: 0.5rem;
}

.cui-data-grid-bulk-bar__inner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: var(--cui-primary);
  color: var(--cui-primary-text);
  border-radius: var(--cui-button-radius, 0.375rem);
  box-shadow: 0 -2px 12px rgb(0 0 0 / 0.15);
  max-width: 48rem;
  margin: 0 auto;
}

.cui-data-grid-bulk-bar__count {
  font-size: 0.8125rem;
  font-weight: 500;
  white-space: nowrap;
}

.cui-data-grid-bulk-bar__actions {
  display: flex;
  gap: 0.375rem;
}

/* Transition */
.cui-bulk-bar-enter-active,
.cui-bulk-bar-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.cui-bulk-bar-enter-from,
.cui-bulk-bar-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>

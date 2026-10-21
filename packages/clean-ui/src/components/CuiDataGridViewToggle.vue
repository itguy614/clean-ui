<script setup lang="ts">
import { useDataGridState } from "../composables/useDataGrid";
import CuiButton from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";
import { useMessages } from "../composables/useMessages";

const grid = useDataGridState();
// Icon-only, so named, with the active view pressed (#161).
const messages = useMessages();
</script>

<template>
  <div class="cui-data-grid-view-toggle">
    <CuiButton
      variant="ghost"
      size="xs"
      :aria-label="messages.dataGrid.tableView"
      :aria-pressed="grid.viewMode.value === 'grid'"
      :style="{ background: grid.viewMode.value === 'grid' ? 'var(--cui-primary-bg)' : undefined }"
      @click="grid.setViewMode('grid')"
    >
      <CuiIcon name="table" size="0.875rem" />
    </CuiButton>
    <CuiButton
      variant="ghost"
      size="xs"
      :aria-label="messages.dataGrid.cardView"
      :aria-pressed="grid.viewMode.value === 'card'"
      :style="{ background: grid.viewMode.value === 'card' ? 'var(--cui-primary-bg)' : undefined }"
      @click="grid.setViewMode('card')"
    >
      <CuiIcon name="squares-four" size="0.875rem" />
    </CuiButton>
  </div>
</template>

<style>
.cui-data-grid-view-toggle {
  display: inline-flex;
  align-items: center;
  gap: calc(0.125rem * var(--cui-density-scale, 1));
  border: 1px solid var(--cui-border);
  border-radius: var(--cui-button-radius, var(--cui-radius-md, 0.375rem));
  padding: calc(0.125rem * var(--cui-density-scale, 1));
}
</style>

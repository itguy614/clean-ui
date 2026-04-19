<script setup lang="ts">
import { useDataGridState } from "../composables/useDataGrid";
import CuiButton from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";

const grid = useDataGridState();
</script>

<template>
  <div class="cui-data-grid-view-toggle">
    <CuiButton
      variant="ghost"
      size="xs"
      :style="{ background: grid.viewMode.value === 'grid' ? 'var(--cui-primary-bg)' : undefined }"
      @click="grid.setViewMode('grid')"
    >
      <CuiIcon name="table" size="0.875rem" />
    </CuiButton>
    <CuiButton
      variant="ghost"
      size="xs"
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
  gap: 0.125rem;
  border: 1px solid var(--cui-border);
  border-radius: var(--cui-button-radius, 0.375rem);
  padding: 0.125rem;
}
</style>

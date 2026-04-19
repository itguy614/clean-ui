<script setup lang="ts">
import { computed } from "vue";
import { useDataGridState } from "../composables/useDataGrid";
import type { DataGridViewAdapter } from "../types/data-grid";
import CuiDataGridSearch from "./CuiDataGridSearch.vue";
import CuiDataGridColumnManager from "./CuiDataGridColumnManager.vue";
import CuiDataGridViewToggle from "./CuiDataGridViewToggle.vue";
import CuiDataGridViewManager from "./CuiDataGridViewManager.vue";
import CuiButton from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";
import CuiBadge from "./CuiBadge.vue";

const props = defineProps<{
  hideSearch?: boolean;
  hideColumnManager?: boolean;
  hideFilterToggle?: boolean;
  hideViewToggle?: boolean;
  hasCardSlot?: boolean;
  gridId?: string;
  viewAdapter?: DataGridViewAdapter;
}>();

const grid = useDataGridState();

const activeFilterCount = computed(() => grid.filters.value.length);
</script>

<template>
  <div class="cui-data-grid-toolbar">
    <div class="cui-data-grid-toolbar__start">
      <slot name="toolbar-start" />
      <CuiDataGridSearch v-if="!hideSearch" />
    </div>
    <div class="cui-data-grid-toolbar__end">
      <slot name="toolbar-end" />

      <!-- Filter toggle -->
      <CuiButton
        v-if="!hideFilterToggle && grid.filterableColumns.value.length > 0"
        variant="outline"
        size="sm"
        :style="{ background: grid.filterPanelOpen.value ? 'var(--cui-primary-bg)' : undefined }"
        @click="grid.toggleFilterPanel()"
      >
        <template #prefix><CuiIcon name="funnel" size="0.875rem" /></template>
        Filters
        <CuiBadge
          v-if="activeFilterCount > 0"
          color="primary"
          size="sm"
          style="margin-left: 0.25rem;"
        >
          {{ activeFilterCount }}
        </CuiBadge>
      </CuiButton>

      <CuiDataGridColumnManager v-if="!hideColumnManager" />

      <!-- View toggle (grid/card) -->
      <CuiDataGridViewToggle v-if="!hideViewToggle && hasCardSlot" />

      <!-- Saved views -->
      <CuiDataGridViewManager
        v-if="gridId"
        :grid-id="gridId"
        :adapter="viewAdapter"
      />
    </div>
  </div>
</template>

<style>
.cui-data-grid-toolbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.cui-data-grid-toolbar__start {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.cui-data-grid-toolbar__end {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}
</style>

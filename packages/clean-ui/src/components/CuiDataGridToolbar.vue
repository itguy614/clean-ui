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
import CuiToolbar from "./CuiToolbar.vue";
import { useMessages } from "../composables/useMessages";

const messages = useMessages();

const props = defineProps<{
  hideSearch?: boolean;
  searchDebounce?: number;
  searchLabel?: string;
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
  <!-- One tab stop for the grid's buttons (#190). The search box is not an item: it keeps
       its own tab stop and its own arrow keys. -->
  <CuiToolbar class="cui-data-grid-toolbar" :label="messages.dataGrid.toolbar">
    <div class="cui-data-grid-toolbar__start">
      <slot name="toolbar-start" />
      <CuiDataGridSearch v-if="!hideSearch" :debounce="searchDebounce" :label="searchLabel" />
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
        {{ messages.dataGrid.filters }}
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
  </CuiToolbar>
</template>

<style>
.cui-data-grid-toolbar {
  --cui-toolbar-gap: calc(0.75rem * var(--cui-density-scale, 1));
}

.cui-data-grid-toolbar__start {
  display: flex;
  align-items: center;
  gap: calc(0.75rem * var(--cui-density-scale, 1));
  flex: 1;
  min-width: 0;
}

.cui-data-grid-toolbar__end {
  display: flex;
  align-items: center;
  gap: calc(0.5rem * var(--cui-density-scale, 1));
  flex-shrink: 0;
}
</style>

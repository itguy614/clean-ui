<script setup lang="ts">
import { toRef, watch, useSlots } from "vue";
import { useDataGrid, provideDataGrid } from "../composables/useDataGrid";
import type {
  DataGridColumn,
  DataGridRow,
  DataGridBulkAction,
  DataGridRowAction,
  DataGridQueryParams,
  DataGridViewConfig,
  DataGridViewAdapter,
  PaginatedData,
} from "../types/data-grid";
import type { TableSize } from "./table-context";
import CuiDataGridToolbar from "./CuiDataGridToolbar.vue";
import CuiDataGridTable from "./CuiDataGridTable.vue";
import CuiDataGridCardView from "./CuiDataGridCardView.vue";
import CuiDataGridPagination from "./CuiDataGridPagination.vue";
import CuiDataGridBulkBar from "./CuiDataGridBulkBar.vue";
import CuiDataGridFilterPanel from "./CuiDataGridFilterPanel.vue";
import CuiDataGridActiveFilters from "./CuiDataGridActiveFilters.vue";
import CuiEmptyState from "./CuiEmptyState.vue";
import CuiSkeleton from "./CuiSkeleton.vue";

export interface CuiDataGridProps {
  /** Column definitions */
  columns: DataGridColumn[];
  /** Data source — array for client-side, PaginatedData for server-side */
  data: DataGridRow[] | PaginatedData;
  /** Server-side mode — emits navigate events instead of processing locally */
  serverSide?: boolean;
  /** Row identifier key */
  rowKey?: string;
  /** Bulk action definitions */
  bulkActions?: DataGridBulkAction[];
  /** Show select-all checkbox in header */
  showSelectAll?: boolean;
  /** Sticky table header */
  stickyHeader?: boolean;
  /** Max height for table scroll */
  maxHeight?: string;
  /** Striped rows */
  striped?: boolean;
  /** Hoverable rows */
  hoverable?: boolean;
  /** Bordered cells */
  bordered?: boolean;
  /** Table size */
  size?: TableSize;
  /** Loading state */
  loading?: boolean;
  /** Per-page options for pagination */
  perPageOptions?: number[];
  /** Hide toolbar */
  hideToolbar?: boolean;
  /** Hide pagination */
  hidePagination?: boolean;
  /** Hide search */
  hideSearch?: boolean;
  /** Hide column manager */
  hideColumnManager?: boolean;
  /** Hide filter panel toggle */
  hideFilterPanel?: boolean;
  /** Filter panel side */
  filterPanelSide?: "left" | "right";
  /** Grid ID for saved views persistence */
  gridId?: string;
  /** Custom view persistence adapter */
  viewAdapter?: DataGridViewAdapter;
  /** Initial view config */
  initialView?: DataGridViewConfig;
  /** Hydrate state from URL query params on init */
  hydrateUrl?: boolean;
  /** Hide the component */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiDataGridProps>(), {
  serverSide: false,
  rowKey: "id",
  showSelectAll: true,
  stickyHeader: true,
  striped: false,
  hoverable: true,
  bordered: false,
  size: "md",
  loading: false,
  perPageOptions: () => [15, 25, 50, 100],
  hideToolbar: false,
  hidePagination: false,
  hideSearch: false,
  hideColumnManager: false,
  hideFilterPanel: false,
  filterPanelSide: "right",
  hydrateUrl: false,
  hidden: false,
});

const emit = defineEmits<{
  navigate: [params: DataGridQueryParams];
  "row-click": [payload: { row: DataGridRow }];
  "row-action": [payload: { action: DataGridRowAction; row: DataGridRow }];
  "bulk-action": [payload: { action: DataGridBulkAction; rows: DataGridRow[] }];
  "selection-change": [selectedIds: string[]];
}>();

const slots = useSlots();

const grid = useDataGrid({
  columns: props.columns,
  data: toRef(props, "data"),
  serverSide: props.serverSide,
  rowKey: props.rowKey,
  defaultPerPage: props.perPageOptions?.[0] ?? 15,
  initialView: props.initialView,
  hydrateFromUrl: props.hydrateUrl,
});

provideDataGrid(grid);

// Emit selection changes
watch(
  () => grid.selectedRows.value,
  (val) => {
    emit("selection-change", [...val]);
  },
);

function onNavigate() {
  if (props.serverSide) {
    emit("navigate", grid.getQueryParams());
  }
}

// Watch sort/filter/search/page changes for server-side mode
watch(
  [() => grid.sort.value, () => grid.filters.value, () => grid.searchQuery.value, () => grid.page.value, () => grid.perPage.value],
  () => {
    onNavigate();
  },
);

const hasCardSlot = !!slots.card;

defineExpose({
  clearSelection: grid.clearSelection,
  getQueryParams: grid.getQueryParams,
  getConfig: grid.getConfig,
  loadConfig: grid.loadConfig,
  resetToDefaults: grid.resetToDefaults,
});
</script>

<template>
  <div v-show="!hidden" class="cui-data-grid">
    <!-- Toolbar -->
    <CuiDataGridToolbar
      v-if="!hideToolbar"
      :hide-search="hideSearch"
      :hide-column-manager="hideColumnManager"
      :hide-filter-toggle="hideFilterPanel"
      :has-card-slot="hasCardSlot"
      :grid-id="gridId"
      :view-adapter="viewAdapter"
    >
      <template #toolbar-start>
        <slot name="toolbar-start" />
      </template>
      <template #toolbar-end>
        <slot name="toolbar-end" />
      </template>
    </CuiDataGridToolbar>

    <!-- Active filters -->
    <CuiDataGridActiveFilters />

    <!-- Loading skeleton -->
    <div v-if="loading" style="padding: 1rem;">
      <CuiSkeleton :lines="8" />
    </div>

    <!-- Empty state -->
    <div v-else-if="grid.displayData.value.length === 0">
      <slot name="empty">
        <CuiEmptyState
          icon="magnifying-glass"
          title="No results found"
          description="Try adjusting your search or filters."
          size="md"
          color="secondary"
        />
      </slot>
    </div>

    <!-- Content area: table/card + filter panel -->
    <template v-else>
      <div
        class="cui-data-grid__content"
        :style="{ flexDirection: filterPanelSide === 'left' ? 'row-reverse' : 'row' }"
      >
        <!-- Table or Card view -->
        <div style="flex: 1; min-width: 0;">
          <!-- Card view -->
          <CuiDataGridCardView
            v-if="grid.viewMode.value === 'card' && hasCardSlot"
            :row-key="rowKey"
          >
            <template #card="cardProps">
              <slot name="card" v-bind="cardProps" />
            </template>
          </CuiDataGridCardView>

          <!-- Table view -->
          <CuiDataGridTable
            v-else
            :row-key="rowKey"
            :bulk-actions="bulkActions"
            :show-select-all="showSelectAll"
            :sticky-header="stickyHeader"
            :max-height="maxHeight"
            :striped="striped"
            :hoverable="hoverable"
            :bordered="bordered"
            :size="size"
            @row-click="emit('row-click', $event)"
            @row-action="emit('row-action', $event)"
          >
            <!-- Forward cell slots -->
            <template
              v-for="col in grid.visibleColumns.value"
              :key="col.key"
              #[`cell-${col.key}`]="slotProps"
            >
              <slot :name="`cell-${col.key}`" v-bind="slotProps">
                {{ slotProps.value }}
              </slot>
            </template>
          </CuiDataGridTable>
        </div>

        <!-- Filter panel -->
        <CuiDataGridFilterPanel />
      </div>
    </template>

    <!-- Pagination -->
    <CuiDataGridPagination
      v-if="!hidePagination && !loading && grid.displayData.value.length > 0"
      @navigate="onNavigate"
    />

    <!-- Bulk action bar -->
    <CuiDataGridBulkBar
      v-if="bulkActions && bulkActions.length > 0"
      :actions="bulkActions"
      @bulk-action="emit('bulk-action', $event)"
    />
  </div>
</template>

<style>
.cui-data-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cui-data-grid__content {
  display: flex;
  gap: 0.75rem;
}
</style>

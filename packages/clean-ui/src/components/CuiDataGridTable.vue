<script setup lang="ts">
import { computed, ref } from "vue";
import { useDataGridState } from "../composables/useDataGrid";
import { useVirtualScroll } from "../composables/useVirtualScroll";
import type { DataGridRow, DataGridRowAction, DataGridBulkAction } from "../types/data-grid";
import CuiTable from "./CuiTable.vue";
import CuiTableHead from "./CuiTableHead.vue";
import CuiTableBody from "./CuiTableBody.vue";
import CuiTableRow from "./CuiTableRow.vue";
import CuiTableCell from "./CuiTableCell.vue";
import CuiCheckbox from "./CuiCheckbox.vue";
import CuiIcon from "./CuiIcon.vue";
import CuiDropdown from "./CuiDropdown.vue";
import CuiDropdownTrigger from "./CuiDropdownTrigger.vue";
import CuiDropdownMenu from "./CuiDropdownMenu.vue";
import CuiDropdownItem from "./CuiDropdownItem.vue";
import CuiButton from "./CuiButton.vue";
import CuiContextMenu from "./CuiContextMenu.vue";
import type { TableSize } from "./table-context";

export interface CuiDataGridTableProps {
  rowKey?: string;
  bulkActions?: DataGridBulkAction[];
  showSelectAll?: boolean;
  stickyHeader?: boolean;
  maxHeight?: string;
  striped?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  size?: TableSize;
  /**
   * Enable row virtualization for large datasets.
   *
   * When true the table renders only the rows visible in the viewport plus a
   * small overscan buffer, keeping the DOM lean regardless of dataset size.
   *
   * Requires `maxHeight` to be set so there is a fixed-height scroll container.
   * Without a bounded height the browser has no viewport to window against and
   * all rows would always be visible anyway.
   *
   * Recommended threshold: enable at >= 500 rows for client-side mode.
   * Server-side grids paginate at the API layer and rarely need this.
   */
  virtualize?: boolean;
  /**
   * Fixed row height in px used by the virtualizer.
   * Omit to let the virtualizer auto-measure from the first rendered row.
   * Providing an explicit value is slightly more efficient and avoids a
   * one-frame layout measurement.
   */
  virtualRowHeight?: number;
}

const props = withDefaults(defineProps<CuiDataGridTableProps>(), {
  rowKey: "id",
  showSelectAll: true,
  stickyHeader: true,
  hoverable: true,
  bordered: false,
  striped: false,
  size: "md",
  virtualize: false,
});

const emit = defineEmits<{
  "row-click": [payload: { row: DataGridRow }];
  "row-action": [payload: { action: DataGridRowAction; row: DataGridRow }];
}>();

const grid = useDataGridState();

const hasBulkActions = computed(() => (props.bulkActions?.length ?? 0) > 0);

const hasRowActions = computed(() =>
  grid.displayData.value.some((row) => row._actions && (row._actions as DataGridRowAction[]).length > 0),
);

function getRowId(row: DataGridRow): string {
  return String(row[props.rowKey] ?? "");
}

function isSelected(row: DataGridRow): boolean {
  return grid.selectedRows.value.has(getRowId(row));
}

const selectAllState = computed<boolean | "indeterminate">(() => {
  const rows = grid.displayData.value;
  if (rows.length === 0) return false;
  const selectedCount = rows.filter((r) => isSelected(r)).length;
  if (selectedCount === 0) return false;
  if (selectedCount === rows.length) return true;
  return "indeterminate";
});

function handleSelectAll(val: boolean | "indeterminate") {
  if (val) {
    grid.selectAll(grid.displayData.value);
  } else {
    grid.clearSelection();
  }
}

function rowActions(row: DataGridRow): DataGridRowAction[] {
  return (row._actions as DataGridRowAction[] | undefined) ?? [];
}

function getSortIcon(key: string): string {
  const col = grid.columns.find((c) => c.key === key);
  const sortKey = col?.sortKey ?? key;
  if (grid.sort.value?.key === sortKey) {
    return grid.sort.value.direction === "asc" ? "caret-up" : "caret-down";
  }
  return "caret-up-down";
}

function getSortOpacity(key: string): string {
  const col = grid.columns.find((c) => c.key === key);
  const sortKey = col?.sortKey ?? key;
  return grid.sort.value?.key === sortKey ? "1" : "0.3";
}

// Compute table min-width from column widths (enables horizontal scroll)
const tableMinWidth = computed(() => {
  const cols = grid.visibleColumns.value;
  const hasWidths = cols.some((c) => c.width);
  if (!hasWidths) return undefined;

  let total = 0;
  if (hasBulkActions.value) total += 48;
  for (const col of cols) {
    total += parseInt(col.width ?? "150", 10) || 150;
  }
  if (hasRowActions.value) total += 48;
  return `${total}px`;
});

// Sticky column offsets — compute left position for each sticky column
const stickyColumnOffsets = computed(() => {
  const offsets = new Map<string, string>();
  let left = 0;

  // Account for bulk actions checkbox column
  if (hasBulkActions.value) {
    left += 48; // 3rem ~ 48px
  }

  for (const col of grid.visibleColumns.value) {
    if (col.sticky && col.width) {
      offsets.set(col.key, `${left}px`);
      left += parseInt(col.width, 10) || 0;
    } else if (col.sticky) {
      // Sticky without explicit width — pin at current offset
      offsets.set(col.key, `${left}px`);
    }
  }
  return offsets;
});

// Check if this is the last sticky column (for right border)
const lastStickyKey = computed(() => {
  const cols = grid.visibleColumns.value;
  for (let i = cols.length - 1; i >= 0; i--) {
    if (cols[i].sticky) return cols[i].key;
  }
  return null;
});

function stickyColStyle(colKey: string): Record<string, string | number> | undefined {
  const leftVal = stickyColumnOffsets.value.get(colKey);
  if (!leftVal) return undefined;
  const style: Record<string, string | number> = {
    position: "sticky",
    left: leftVal,
    zIndex: 5,
    background: "var(--cui-table-head-bg, var(--color-surface-50))",
  };
  if (colKey === lastStickyKey.value) {
    style.boxShadow = "2px 0 4px -1px rgba(0,0,0,0.08)";
  }
  return style;
}

function stickyBodyColStyle(colKey: string): Record<string, string | number> | undefined {
  const leftVal = stickyColumnOffsets.value.get(colKey);
  if (!leftVal) return undefined;
  const style: Record<string, string | number> = {
    position: "sticky",
    left: leftVal,
    zIndex: 4,
    background: "var(--cui-table-head-bg, var(--color-surface-50))",
  };
  if (colKey === lastStickyKey.value) {
    style.boxShadow = "2px 0 4px -1px rgba(0,0,0,0.08)";
  }
  return style;
}

function headerCellStyle(col: { key: string; sortable?: boolean; sticky?: boolean }) {
  return {
    ...(col.sortable ? { cursor: "pointer", userSelect: "none" as const } : {}),
    ...stickyColStyle(col.key),
  };
}

// ---------------------------------------------------------------------------
// Virtualization
// ---------------------------------------------------------------------------
// The scrollable element is CuiTable's internal wrapper div, which it exposes
// via defineExpose({ scrollWrapper }) and only exists when maxHeight is set.
// We capture it through CuiTable's :ref and hand it to the virtualizer so it
// can listen for scroll events. When virtualization is off (or maxHeight is
// unset) we leave the container null and the virtualizer stays dormant.
const scrollContainerRef = ref<HTMLElement | null>(null);

function setScrollContainer(wrapper: HTMLElement | null) {
  scrollContainerRef.value = props.virtualize && props.maxHeight ? wrapper : null;
}

const vScroll = useVirtualScroll(
  computed(() => grid.displayData.value),
  {
    containerRef: scrollContainerRef,
    rowHeight: props.virtualRowHeight,
  },
);

// The rows we actually render — either the full set or the virtual window
const renderedRows = computed<DataGridRow[]>(() =>
  props.virtualize ? vScroll.visibleRows.value : grid.displayData.value,
);

// Total column count — used for colspan on spacer rows
const totalCols = computed(() => {
  let n = grid.visibleColumns.value.length;
  if (hasBulkActions.value) n += 1;
  if (hasRowActions.value)  n += 1;
  return n;
});
</script>

<template>
  <CuiTable
    :ref="(instance: any) => setScrollContainer(instance?.scrollWrapper ?? null)"
    :size="size"
    :striped="striped"
    :hoverable="hoverable"
    :bordered="bordered"
    :sticky-header="stickyHeader"
    :max-height="maxHeight"
    :min-width="tableMinWidth"
    :aria-rowcount="virtualize ? grid.displayData.value.length + 1 : undefined"
  >
    <CuiTableHead>
      <!-- aria-rowindex is 1-based incl. the header row; only meaningful when windowed -->
      <CuiTableRow :aria-rowindex="virtualize ? 1 : undefined">
        <!-- Bulk selection checkbox -->
        <CuiTableCell v-if="hasBulkActions" width="3rem" align="center">
          <CuiCheckbox
            v-if="showSelectAll"
            :model-value="selectAllState === true"
            :indeterminate="selectAllState === 'indeterminate'"
            @update:model-value="handleSelectAll"
          />
        </CuiTableCell>

        <!-- Column headers -->
        <CuiTableCell
          v-for="col in grid.visibleColumns.value"
          :key="col.key"
          :align="col.align"
          :width="col.width"
          :nowrap="col.nowrap"
          :style="headerCellStyle(col)"
          @click="col.sortable ? grid.applySort(col.key) : undefined"
        >
          <span style="display: inline-flex; align-items: center; gap: calc(0.25rem * var(--cui-density-scale, 1));">
            {{ col.label }}
            <CuiIcon
              v-if="col.sortable"
              :name="getSortIcon(col.key)"
              size="0.875rem"
              :style="{ opacity: getSortOpacity(col.key) }"
            />
          </span>
        </CuiTableCell>

        <!-- Row actions column -->
        <CuiTableCell v-if="hasRowActions" width="3rem" />
      </CuiTableRow>
    </CuiTableHead>

    <CuiTableBody>
      <!--
        Virtual top spacer — replaces the rows above the render window.
        A zero-height row with padding-top avoids collapsing border weirdness
        that a plain <tr style="height:Npx"> can suffer in some browsers.
      -->
      <tr
        v-if="virtualize && vScroll.paddingTop.value > 0"
        aria-hidden="true"
        :style="{ height: `${vScroll.paddingTop.value}px`, padding: 0, border: 0 }"
      >
        <td :colspan="totalCols" style="padding: 0; border: none;" />
      </tr>

      <CuiContextMenu
        v-for="(row, idx) in renderedRows"
        :key="getRowId(row)"
        :disabled="rowActions(row).length === 0"
      >
        <CuiTableRow
          :ref="(instance: any) => { if (virtualize && idx === 0) vScroll.measureRow(instance?.rowEl ?? null) }"
          :selected="isSelected(row)"
          :aria-rowindex="virtualize ? vScroll.firstVisibleIndex.value + idx + 2 : undefined"
          style="cursor: pointer;"
          @click="emit('row-click', { row })"
        >
          <!-- Bulk selection checkbox -->
          <CuiTableCell v-if="hasBulkActions" align="center" @click.stop>
            <CuiCheckbox
              :model-value="isSelected(row)"
              @update:model-value="grid.toggleSelection(getRowId(row))"
            />
          </CuiTableCell>

          <!-- Data cells -->
          <CuiTableCell
            v-for="col in grid.visibleColumns.value"
            :key="col.key"
            :align="col.align"
            :nowrap="col.nowrap"
            :style="stickyBodyColStyle(col.key)"
          >
            <slot :name="`cell-${col.key}`" :value="row[col.key]" :row="row">
              {{ row[col.key] }}
            </slot>
          </CuiTableCell>

          <!-- Row actions dropdown -->
          <CuiTableCell v-if="hasRowActions" align="right" @click.stop>
            <CuiDropdown v-if="rowActions(row).length > 0">
              <CuiDropdownTrigger>
                <CuiButton variant="ghost" size="xs" style="opacity: 0.4;">
                  <CuiIcon name="dots-three" size="1rem" />
                </CuiButton>
              </CuiDropdownTrigger>
              <CuiDropdownMenu>
                <CuiDropdownItem
                  v-for="action in rowActions(row)"
                  :key="action.key"
                  @select="emit('row-action', { action, row })"
                >
                  {{ action.label }}
                </CuiDropdownItem>
              </CuiDropdownMenu>
            </CuiDropdown>
          </CuiTableCell>
        </CuiTableRow>

        <!-- Context menu for right-click -->
        <template #menu>
          <CuiDropdownItem
            v-for="action in rowActions(row)"
            :key="action.key"
            @select="emit('row-action', { action, row })"
          >
            {{ action.label }}
          </CuiDropdownItem>
        </template>
      </CuiContextMenu>

      <!-- Virtual bottom spacer -->
      <tr
        v-if="virtualize && vScroll.paddingBottom.value > 0"
        aria-hidden="true"
        :style="{ height: `${vScroll.paddingBottom.value}px`, padding: 0, border: 0 }"
      >
        <td :colspan="totalCols" style="padding: 0; border: none;" />
      </tr>
    </CuiTableBody>
  </CuiTable>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useDataGridState } from "../composables/useDataGrid";
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
}

const props = withDefaults(defineProps<CuiDataGridTableProps>(), {
  rowKey: "id",
  showSelectAll: true,
  stickyHeader: true,
  hoverable: true,
  bordered: false,
  striped: false,
  size: "md",
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
    left += 48; // 3rem ≈ 48px
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
</script>

<template>
  <CuiTable
    :size="size"
    :striped="striped"
    :hoverable="hoverable"
    :bordered="bordered"
    :sticky-header="stickyHeader"
    :max-height="maxHeight"
    :min-width="tableMinWidth"
  >
    <CuiTableHead>
      <CuiTableRow>
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
          <span style="display: inline-flex; align-items: center; gap: 0.25rem;">
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
      <CuiContextMenu
        v-for="row in grid.displayData.value"
        :key="getRowId(row)"
        :disabled="rowActions(row).length === 0"
      >
        <CuiTableRow
          :selected="isSelected(row)"
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
    </CuiTableBody>
  </CuiTable>
</template>

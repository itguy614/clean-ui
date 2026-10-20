<script setup lang="ts">
import { computed, ref } from "vue";
import { useDataGridState } from "../composables/useDataGrid";
import { useVirtualScroll } from "../composables/useVirtualScroll";
import { useMessages } from "../composables/useMessages";
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

const messages = useMessages();

/** Which way `col` is sorted, or null when it isn't the sorted column. */
function sortDirection(col: { key: string; sortKey?: string }): "asc" | "desc" | null {
  const sort = grid.sort.value;
  return sort?.key === (col.sortKey ?? col.key) ? sort.direction : null;
}

function sortIcon(col: { key: string; sortKey?: string }) {
  const dir = sortDirection(col);
  return dir === "asc" ? "caret-up" : dir === "desc" ? "caret-down" : "caret-up-down";
}

/** The <th>'s aria-sort: the direction is otherwise only a caret icon (#161). */
function ariaSort(col: { key: string; sortKey?: string }) {
  const dir = sortDirection(col);
  return dir === "asc" ? "ascending" : dir === "desc" ? "descending" : "none";
}

/** What names a row to a screen reader: its first visible column's value. */
function rowLabel(row: DataGridRow): string {
  const first = grid.visibleColumns.value[0];
  const value = first ? row[first.key] : undefined;
  return value == null || value === "" ? getRowId(row) : String(value);
}


// The bulk-select and row-actions columns' width. Their cells drop their horizontal
// padding (AUX_CELL_STYLE) so they render at exactly this width — padding plus the
// checkbox or the actions button would otherwise overflow it. That is what lets the
// sticky offsets below add this value rather than assume a pixel width, and lets the
// table's min-width sum to what the columns actually take: an overflowing actions
// column made the table squeeze every other column to fit, so each frozen column came
// out narrower than the offset of the one after it, leaving a gap (#233).
const SELECT_COLUMN_WIDTH = "3rem";
const AUX_CELL_STYLE = { paddingInline: 0 };

const PINNED_BG = "var(--cui-table-head-bg, var(--color-surface-50))";
const PINNED_EDGE_SHADOW = "2px 0 4px -1px rgba(0,0,0,0.08)";

const ROW_ACTIONS_COLUMN_WIDTH = SELECT_COLUMN_WIDTH;

/**
 * A width usable in calc(), or undefined. A keyword like "auto" (or "") is not
 * one and would void the sum. A bare number is read as px, as parseInt did —
 * left as-is it is invalid inside calc() and would void the sum too.
 */
function toLength(width: string | undefined): string | undefined {
  const w = width?.trim();
  if (!w) return undefined;
  if (/^\d*\.?\d+$/.test(w)) return `${w}px`;
  return /^(\d|\.|(calc|min|max|clamp|var)\()/.test(w) ? w : undefined;
}

/**
 * Sums CSS lengths as written, so a "10rem" column is not read as 10px. Not
 * exact for every unit: a % in a sticky `left` resolves against the scroller,
 * not the table, and declared widths are minimums under auto layout. Doing
 * better means measuring the rendered header cells.
 */
function sumLengths(lengths: string[]): string {
  if (lengths.length === 0) return "0px";
  return lengths.length === 1 ? lengths[0] : `calc(${lengths.join(" + ")})`;
}

// Compute table min-width from column widths (enables horizontal scroll). It has
// to agree with the sticky offsets below: a min-width short of the declared
// widths lets the table squeeze its columns, and the offsets then overshoot them.
const tableMinWidth = computed(() => {
  const cols = grid.visibleColumns.value;
  if (!cols.some((c) => c.width)) return undefined;

  return sumLengths([
    ...(hasBulkActions.value ? [SELECT_COLUMN_WIDTH] : []),
    ...cols.map((col) => toLength(col.width) ?? "150px"),
    ...(hasRowActions.value ? [ROW_ACTIONS_COLUMN_WIDTH] : []),
  ]);
});

// Sticky column offsets: each frozen column is pinned at the summed widths of
// the frozen columns before it, starting after the bulk-select column.
const stickyColumnOffsets = computed(() => {
  const offsets = new Map<string, string>();
  const before = hasBulkActions.value ? [SELECT_COLUMN_WIDTH] : [];

  for (const col of grid.visibleColumns.value) {
    if (!col.sticky) continue;
    offsets.set(col.key, sumLengths(before));
    // Sticky without a usable width contributes nothing to later offsets.
    const width = toLength(col.width);
    if (width) before.push(width);
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

// The bulk-select column sits left of every data column, so once any data
// column is frozen it has to be frozen too — otherwise it scrolls away and
// leaves its width, which the frozen columns' offsets start from, as a gap (#233).
const pinSelectColumn = computed(() => hasBulkActions.value && lastStickyKey.value !== null);

function pinnedBodyCellStyle(left: string, lastPinned: boolean): Record<string, string | number> {
  const style: Record<string, string | number> = { position: "sticky", left, zIndex: 4, background: PINNED_BG };
  if (lastPinned) style.boxShadow = PINNED_EDGE_SHADOW;
  return style;
}

function stickyBodyColStyle(colKey: string): Record<string, string | number> | undefined {
  const leftVal = stickyColumnOffsets.value.get(colKey);
  return leftVal ? pinnedBodyCellStyle(leftVal, colKey === lastStickyKey.value) : undefined;
}

const selectBodyCellStyle = computed(() => ({
  ...AUX_CELL_STYLE,
  ...(pinSelectColumn.value ? pinnedBodyCellStyle("0", false) : {}),
}));

// Header cells pin at the CELL level (never via a sticky <thead> — that nests
// same-axis sticky and detaches sticky-column headers). Every header cell gets
// `top: 0` when stickyHeader is on; sticky columns additionally get `left`. A
// cell that's both (the top-left corner) sits above the regular header row (10)
// and the sticky body column (4) at z-index 11.
//
// These cells are <th>, so `.cui-table--sticky-header thead th` also applies:
// it agrees on position/top, and deliberately leaves z-index and left alone so
// the inline values here still win.
function headerPinStyle(left: string | undefined, lastPinned = false): Record<string, string | number> {
  const stickyTop = props.stickyHeader;
  if (!left && !stickyTop) return {};

  const style: Record<string, string | number> = {
    position: "sticky",
    background: PINNED_BG,
    zIndex: left && stickyTop ? 11 : left ? 5 : 10,
  };
  if (stickyTop) style.top = 0;
  if (left) style.left = left;
  if (left && lastPinned) style.boxShadow = PINNED_EDGE_SHADOW;
  return style;
}

function headerCellStyle(col: { key: string }) {
  return headerPinStyle(stickyColumnOffsets.value.get(col.key), col.key === lastStickyKey.value);
}

// The non-column header cells (bulk-select checkbox, row actions) aren't in
// visibleColumns so they don't get headerCellStyle, but they still need to ride
// the sticky header rather than scroll away — and the checkbox cell is also
// pinned left alongside the frozen columns. Pinned on both axes it takes the
// corner z-index (11), above the regular header cells (10) that scroll under it.
const selectHeaderCellStyle = computed(() => ({
  ...AUX_CELL_STYLE,
  ...headerPinStyle(pinSelectColumn.value ? "0" : undefined),
}));
const auxHeaderCellStyle = computed(() => ({ ...AUX_CELL_STYLE, ...headerPinStyle(undefined) }));

// ---------------------------------------------------------------------------
// Virtualization
// ---------------------------------------------------------------------------
// The scrollable element is CuiTable's internal wrapper div, which it always
// renders and exposes via defineExpose({ scrollWrapper }). We capture it through
// CuiTable's :ref and hand it to the virtualizer so it can listen for scroll
// events. Vertical scrolling still requires maxHeight, so when virtualization is
// off (or maxHeight is unset) we leave the container null and the virtualizer
// stays dormant.
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
    class="cui-data-grid-table"
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
        <CuiTableCell v-if="hasBulkActions" :width="SELECT_COLUMN_WIDTH" align="center" :style="selectHeaderCellStyle">
          <CuiCheckbox
            v-if="showSelectAll"
            :aria-label="messages.dataGrid.selectAll"
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
          :aria-sort="col.sortable ? ariaSort(col) : undefined"
        >
          <!-- A sortable header's label is a button, so the sort is reachable by keyboard;
               the <th> says which way it's sorted (aria-sort). -->
          <button
            v-if="col.sortable"
            type="button"
            class="cui-data-grid-table__sort"
            @click="grid.applySort(col.key)"
          >
            {{ col.label }}
            <CuiIcon
              :name="sortIcon(col)"
              size="0.875rem"
              aria-hidden="true"
              :style="{ opacity: sortDirection(col) ? '1' : '0.3' }"
            />
          </button>
          <template v-else>{{ col.label }}</template>
        </CuiTableCell>

        <!-- Row actions column -->
        <CuiTableCell v-if="hasRowActions" :width="ROW_ACTIONS_COLUMN_WIDTH" :style="auxHeaderCellStyle" />
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
          <CuiTableCell v-if="hasBulkActions" align="center" :style="selectBodyCellStyle" @click.stop>
            <CuiCheckbox
              :aria-label="messages.dataGrid.selectRow(rowLabel(row))"
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
          <CuiTableCell v-if="hasRowActions" align="center" :style="AUX_CELL_STYLE" @click.stop>
            <CuiDropdown v-if="rowActions(row).length > 0">
              <CuiDropdownTrigger>
                <CuiButton variant="ghost" size="xs" style="opacity: 0.4;" :aria-label="messages.dataGrid.rowActions(rowLabel(row))">
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

<style scoped>
/* --- Themeable: zero specificity, so a consumer's own rule wins (see CuiButton.vue) --- */
:where(.cui-data-grid-table__sort:focus-visible) {
  outline: 2px solid var(--cui-data-grid-focus-ring, var(--cui-primary-focus-ring));
  outline-offset: 2px;
  border-radius: var(--cui-radius-sm, 0.25rem);
}

/* --- Structural --- */
/* The header's own text, as a button: it inherits the cell's font and alignment. */
.cui-data-grid-table__sort {
  display: inline-flex;
  align-items: center;
  gap: calc(0.25rem * var(--cui-density-scale, 1));
  /* preflight.css resets font, color, spacing and the box; not text-transform, and the
     header's case mustn't change on becoming sortable */
  text-transform: inherit;
  cursor: pointer;
  user-select: none;
  text-align: inherit;
}
</style>

<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { useDataGridState } from "../composables/useDataGrid";
import { useVirtualScroll } from "../composables/useVirtualScroll";
import { useEventListener } from "../composables/useEventListener";
import { useListNavigation } from "../composables/useListNavigation";
import { useCuiId } from "../composables/useCuiId";
import { useMessages } from "../composables/useMessages";
import { RESTORE_FOCUS_ATTR } from "../utils/focusRestore";
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
import type { SizeableProps } from "../types/common";

export interface CuiDataGridTableProps extends SizeableProps {
  rowKey?: string;
  rowLabel?: (row: DataGridRow) => string;
  bulkActions?: DataGridBulkAction[];
  showSelectAll?: boolean;
  stickyHeader?: boolean;
  maxHeight?: string;
  striped?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
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
  /**
   * Whether rows are interactive (#232): focusable, keyboard-operable and pointer-styled.
   * CuiDataGrid decides — a row-click listener, or its rowClickable override.
   */
  rowsInteractive?: boolean;
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
  rowsInteractive: false,
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

/**
 * The <th>'s aria-sort: the direction is otherwise only a caret icon (#161). Only on the
 * sorted column — ARIA asks for it on one header at a time, and "none" on every other
 * sortable one is read out as noise.
 */
function ariaSort(col: { key: string; sortKey?: string }) {
  const dir = sortDirection(col);
  return dir === "asc" ? "ascending" : dir === "desc" ? "descending" : undefined;
}

/**
 * What names a row to a screen reader: the consumer's rowLabel, else the first visible
 * column's value when it is text or a number — an object, a date or a boolean would read as
 * "[object Object]" or "true" — else the row's position.
 */
function labelOf(row: DataGridRow, idx: number): string {
  if (props.rowLabel) return props.rowLabel(row);
  const first = grid.visibleColumns.value[0];
  const value = first ? row[first.key] : undefined;
  if ((typeof value === "string" && value.trim()) || typeof value === "number") return String(value);
  const offset = props.virtualize ? vScroll.firstVisibleIndex.value : 0;
  return messages.value.dataGrid.rowNumber(offset + idx + 1);
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

const PINNED_BG = "var(--cui-table-head-bg)";
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

// One context menu for the whole grid (#208), not one per row: a 500-row grid mounted 500
// CuiContextMenu instances. It asks which row a gesture landed on; a row without actions,
// or anywhere else in the table, gets the browser's own menu.
//
// A row is found by its place in renderedRows, not by rowKey, which may be missing or
// repeated, and by this grid's own id, so a row of a grid nested in a cell is not ours.
const gridId = useCuiId("data-grid");
function rowWithActions(el: Element): DataGridRow | undefined {
  const [owner, index] = el.closest("[data-cui-grid-row]")?.getAttribute("data-cui-grid-row")?.split(":") ?? [];
  const row = owner === gridId ? renderedRows.value[Number(index)] : undefined;
  return row && rowActions(row).length > 0 ? row : undefined;
}

// --- Interactive rows (#232) ---
// A clickable grid's rows are one tab stop. The stop is tracked by row key, so it survives
// sorting, filtering and virtualisation, and falls back to the first rendered row when its
// row is gone. Arrow Up/Down and Home/End move over the whole data set — not just the
// rendered rows, so a virtualised grid scrolls the target in — and Enter or Space on the
// row itself emits row-click. Native table semantics stay: no role="grid".
// useListNavigation, not useRovingFocus: that one finds its items in the DOM, and a
// virtualised grid's rows outside the render window aren't there to reach.
const nav = useListNavigation();
const activeKey = ref<string | null>(null);
const stopKey = computed(() => {
  const rows = renderedRows.value;
  const active = activeKey.value;
  if (active !== null && rows.some((r) => getRowId(r) === active)) return active;
  // The first row in view — not the overscan above it, which is off-screen, and focusing
  // it would scroll the grid out from under the user.
  const first = props.virtualize ? vScroll.firstInViewIndex.value - vScroll.firstVisibleIndex.value : 0;
  const row = rows[Math.max(0, Math.min(first, rows.length - 1))];
  return row ? getRowId(row) : undefined;
});
const indexOfKey = (key: string | undefined) => grid.displayData.value.findIndex((r) => getRowId(r) === key);
const rowFocusKey = (row: DataGridRow) => `${gridId}:${getRowId(row)}`;
const bodyRef = ref<{ $el: HTMLElement } | null>(null);
const bodyEl = () => bodyRef.value?.$el ?? null;

function focusRowAt(index: number) {
  const row = grid.displayData.value[index];
  if (!row) return;
  activeKey.value = getRowId(row);
  const body = bodyEl();
  if (props.virtualize) vScroll.scrollToIndex(index, body?.parentElement?.querySelector("thead")?.offsetHeight ?? 0);
  // In this table only, matched by value rather than in a selector, so a key needs no escaping.
  const key = rowFocusKey(row);
  nextTick(() =>
    [...(bodyEl()?.querySelectorAll<HTMLElement>(`[${RESTORE_FOCUS_ATTR}]`) ?? [])].find((el) => el.getAttribute(RESTORE_FOCUS_ATTR) === key)?.focus(),
  );
}

/** `index` is the row's place in displayData — the template knows it, so no scan per key. */
function onRowKeydown(e: KeyboardEvent, row: DataGridRow, index: number) {
  // Only on the row itself: keys in a cell's checkbox, button, link or input are theirs.
  if (!props.rowsInteractive || e.target !== e.currentTarget) return;
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault(); // Space would scroll the grid
    // A held key auto-repeats; a button wouldn't activate again for it, nor does a row.
    if (!e.repeat) emit("row-click", { row });
    return;
  }
  const to = nav.indexForKey(e, index, { count: grid.displayData.value.length });
  if (to === null) return;
  e.preventDefault();
  if (to !== index) focusRowAt(to);
}

// An overlay opened from a row that has since scrolled out of the render window can't hand
// focus back to it; it asks by key instead (utils/focusRestore), and the grid brings it in.
useEventListener(
  "document",
  "cui-restore-focus",
  (e) => {
    const prefix = `${gridId}:`;
    if (!e.detail.startsWith(prefix)) return;
    const index = indexOfKey(e.detail.slice(prefix.length));
    focusRowAt(index !== -1 ? index : indexOfKey(stopKey.value));
  },
  { enabled: () => props.rowsInteractive },
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
  <CuiContextMenu class="cui-data-grid-table__menu" :resolve-target="rowWithActions">
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
              :style="{ justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start' }"
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

      <CuiTableBody ref="bodyRef">
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
          <td class="cui-data-grid__spacer-cell" :colspan="totalCols" style="padding: 0; border: none;" />
        </tr>

        <CuiTableRow
          v-for="(row, idx) in renderedRows"
          :key="getRowId(row)"
          :data-cui-grid-row="`${gridId}:${idx}`"
          :ref="(instance: any) => { if (virtualize && idx === 0) vScroll.measureRow(instance?.rowEl ?? null) }"
          :selected="isSelected(row)"
          :aria-rowindex="virtualize ? vScroll.firstVisibleIndex.value + idx + 2 : undefined"
          :class="{ 'cui-data-grid-table__row--interactive': rowsInteractive }"
          :tabindex="rowsInteractive ? (getRowId(row) === stopKey ? 0 : -1) : undefined"
          :data-cui-restore-focus="rowsInteractive ? rowFocusKey(row) : undefined"
          :aria-description="rowsInteractive ? messages.dataGrid.rowHint : undefined"
          @click="emit('row-click', { row })"
          @keydown="onRowKeydown($event, row, virtualize ? vScroll.firstVisibleIndex.value + idx : idx)"
          @focus="activeKey = getRowId(row)"
        >
          <!-- Bulk selection checkbox -->
          <CuiTableCell v-if="hasBulkActions" align="center" :style="selectBodyCellStyle" @click.stop>
            <CuiCheckbox
              :aria-label="messages.dataGrid.selectRow(labelOf(row, idx))"
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
                <CuiButton variant="ghost" size="xs" style="opacity: 0.4;" :aria-label="messages.dataGrid.rowActions(labelOf(row, idx))">
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

        <!-- Virtual bottom spacer -->
        <tr
          v-if="virtualize && vScroll.paddingBottom.value > 0"
          aria-hidden="true"
          :style="{ height: `${vScroll.paddingBottom.value}px`, padding: 0, border: 0 }"
        >
          <td class="cui-data-grid__spacer-cell" :colspan="totalCols" style="padding: 0; border: none;" />
        </tr>
      </CuiTableBody>
    </CuiTable>

    <template #menu="{ target }">
      <CuiDropdownItem
        v-for="action in rowActions(target as DataGridRow)"
        :key="action.key"
        @select="emit('row-action', { action, row: target as DataGridRow })"
      >
        {{ action.label }}
      </CuiDropdownItem>
    </template>
  </CuiContextMenu>
</template>

<style scoped>
/* --- Themeable: zero specificity, so a consumer's own rule wins (see CuiButton.vue) --- */
:where(.cui-data-grid-table__sort:focus-visible) {
  outline: 2px solid var(--cui-data-grid-focus-ring, var(--cui-primary-focus-ring));
  /* No offset: a scrolling table clips its header row at the top edge. */
  outline-offset: 0;
  border-radius: var(--cui-radius-sm, 0.25rem);
}

/* Inset: a row's outline is clipped by the table, and by the scroll wrapper at its edges. */
:where(.cui-data-grid-table__row--interactive:focus-visible) {
  outline: 2px solid var(--cui-data-grid-focus-ring, var(--cui-primary-focus-ring));
  outline-offset: -2px;
}

/* --- Structural --- */
.cui-data-grid-table__row--interactive {
  cursor: pointer;
}

/* The header's own text, as a button: it inherits the cell's font and alignment. */
/* The whole cell's width, so the click target is the header, not just its label. */
.cui-data-grid-table__sort {
  display: flex;
  width: 100%;
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

<script setup lang="ts">
import { computed, ref } from "vue";
import {
  CuiDataGrid,
  CuiBadge,
  CuiButton,
  CuiCard,
  CuiCardBody,
  CuiFlex,
  CuiIcon,
  CuiInput,
  CuiStack,
  CuiTable,
  CuiTableBody,
  CuiTableCell,
  CuiTableHead,
  CuiTableRow,
  CuiToggle,
  useDataGrid,
  type DataGridColumn,
  type DataGridRow,
  type DataGridBulkAction,
} from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/data-grid";

const columns: DataGridColumn[] = [
  { key: "name", label: "Name", sortable: true, filterable: true, filterType: "text" },
  { key: "email", label: "Email", sortable: true },
  { key: "role", label: "Role", sortable: true, filterable: true, filterType: "select", filterOptions: [
    { label: "Engineering", value: "Engineering" },
    { label: "Design", value: "Design" },
    { label: "Marketing", value: "Marketing" },
    { label: "Sales", value: "Sales" },
    { label: "Support", value: "Support" },
  ]},
  { key: "status", label: "Status", sortable: true, filterable: true, filterType: "select", filterOptions: [
    { label: "Active", value: "Active" },
    { label: "On Leave", value: "On Leave" },
    { label: "Inactive", value: "Inactive" },
  ]},
  { key: "salary", label: "Salary", sortable: true, align: "right", nowrap: true },
];

const data: DataGridRow[] = [
  { id: "1", name: "Alice Johnson", email: "alice@example.com", role: "Engineering", status: "Active", salary: "$125,000", _actions: [{ key: "edit", label: "Edit" }, { key: "delete", label: "Delete" }] },
  { id: "2", name: "Bob Smith", email: "bob@example.com", role: "Design", status: "Active", salary: "$105,000", _actions: [{ key: "edit", label: "Edit" }, { key: "delete", label: "Delete" }] },
  { id: "3", name: "Carol Williams", email: "carol@example.com", role: "Marketing", status: "On Leave", salary: "$95,000", _actions: [{ key: "edit", label: "Edit" }] },
  { id: "4", name: "David Brown", email: "david@example.com", role: "Engineering", status: "Active", salary: "$130,000", _actions: [{ key: "edit", label: "Edit" }, { key: "delete", label: "Delete" }] },
  { id: "5", name: "Eva Martinez", email: "eva@example.com", role: "Sales", status: "Inactive", salary: "$88,000", _actions: [{ key: "edit", label: "Edit" }] },
  { id: "6", name: "Frank Lee", email: "frank@example.com", role: "Engineering", status: "Active", salary: "$115,000", _actions: [{ key: "edit", label: "Edit" }, { key: "delete", label: "Delete" }] },
  { id: "7", name: "Grace Kim", email: "grace@example.com", role: "Design", status: "Active", salary: "$110,000", _actions: [{ key: "edit", label: "Edit" }] },
  { id: "8", name: "Henry Wilson", email: "henry@example.com", role: "Marketing", status: "Active", salary: "$92,000", _actions: [{ key: "edit", label: "Edit" }] },
  { id: "9", name: "Ivy Chen", email: "ivy@example.com", role: "Sales", status: "Active", salary: "$97,000", _actions: [{ key: "edit", label: "Edit" }, { key: "delete", label: "Delete" }] },
  { id: "10", name: "Jack Davis", email: "jack@example.com", role: "Engineering", status: "On Leave", salary: "$128,000", _actions: [{ key: "edit", label: "Edit" }] },
  { id: "11", name: "Karen Taylor", email: "karen@example.com", role: "Support", status: "Active", salary: "$78,000", _actions: [{ key: "edit", label: "Edit" }] },
  { id: "12", name: "Leo Rodriguez", email: "leo@example.com", role: "Engineering", status: "Active", salary: "$135,000", _actions: [{ key: "edit", label: "Edit" }, { key: "delete", label: "Delete" }] },
  { id: "13", name: "Mia Anderson", email: "mia@example.com", role: "Design", status: "Inactive", salary: "$100,000", _actions: [{ key: "edit", label: "Edit" }] },
  { id: "14", name: "Noah Thomas", email: "noah@example.com", role: "Marketing", status: "Active", salary: "$89,000", _actions: [{ key: "edit", label: "Edit" }] },
  { id: "15", name: "Olivia Jackson", email: "olivia@example.com", role: "Sales", status: "Active", salary: "$94,000", _actions: [{ key: "edit", label: "Edit" }, { key: "delete", label: "Delete" }] },
  { id: "16", name: "Pete White", email: "pete@example.com", role: "Engineering", status: "Active", salary: "$122,000", _actions: [{ key: "edit", label: "Edit" }] },
  { id: "17", name: "Quinn Harris", email: "quinn@example.com", role: "Support", status: "Active", salary: "$82,000", _actions: [{ key: "edit", label: "Edit" }] },
  { id: "18", name: "Ruby Martin", email: "ruby@example.com", role: "Design", status: "Active", salary: "$108,000", _actions: [{ key: "edit", label: "Edit" }, { key: "delete", label: "Delete" }] },
  { id: "19", name: "Sam Garcia", email: "sam@example.com", role: "Engineering", status: "Active", salary: "$140,000", _actions: [{ key: "edit", label: "Edit" }, { key: "delete", label: "Delete" }] },
  { id: "20", name: "Tina Lopez", email: "tina@example.com", role: "Marketing", status: "On Leave", salary: "$91,000", _actions: [{ key: "edit", label: "Edit" }] },
];

const bulkActions: DataGridBulkAction[] = [
  { key: "export", label: "Export" },
  { key: "delete", label: "Delete", variant: "destructive" },
];

const lastEvent = ref("(interact with the grid)");

function onRowClick(payload: { row: DataGridRow }) {
  lastEvent.value = `Row click: ${payload.row.name}`;
}

function onRowAction(payload: { action: { key: string; label: string }; row: DataGridRow }) {
  lastEvent.value = `Row action: ${payload.action.label} on ${payload.row.name}`;
}

function onBulkAction(payload: { action: DataGridBulkAction; rows: DataGridRow[] }) {
  lastEvent.value = `Bulk action: ${payload.action.label} on ${payload.rows.length} rows`;
}

// Minimal columns for simple example
const simpleColumns: DataGridColumn[] = [
  { key: "name", label: "Name", sortable: true },
  { key: "email", label: "Email" },
  { key: "role", label: "Role", sortable: true },
];

const simpleData: DataGridRow[] = data.slice(0, 8).map(({ _actions, ...rest }) => rest);

// Wide table with sticky columns
const wideColumns: DataGridColumn[] = [
  { key: "name", label: "Name", sortable: true, sticky: true, width: "160px" },
  { key: "email", label: "Email", sticky: true, width: "200px" },
  { key: "role", label: "Role", sortable: true, width: "140px" },
  { key: "status", label: "Status", width: "120px" },
  { key: "salary", label: "Salary", align: "right", width: "120px" },
  { key: "department", label: "Department", width: "150px" },
  { key: "location", label: "Location", width: "150px" },
  { key: "startDate", label: "Start Date", width: "130px" },
  { key: "manager", label: "Manager", width: "160px" },
];

const wideData: DataGridRow[] = data.map((row) => ({
  ...row,
  department: row.role,
  location: "San Francisco",
  startDate: "2024-01-15",
  manager: "Jane Manager",
}));

// Sticky columns + bulk selection: the checkbox column pins with the frozen columns,
// whatever unit the frozen widths are written in.
const stickyBulkRem = ref(false);
const stickyBulkColumns = computed<DataGridColumn[]>(() =>
  wideColumns.map((col) =>
    stickyBulkRem.value && col.key === "name" ? { ...col, width: "12rem" } : col,
  ),
);

// Large dataset to demonstrate virtualization (10,000 rows)
const roles = ["Engineering", "Design", "Marketing", "Sales", "Support"];
const statuses = ["Active", "On Leave", "Inactive"];
const largeData: DataGridRow[] = Array.from({ length: 10000 }, (_, i) => ({
  id: String(i + 1),
  name: `Employee ${i + 1}`,
  email: `employee${i + 1}@example.com`,
  role: roles[i % roles.length],
  status: statuses[i % statuses.length],
  salary: `$${(70 + (i % 80)).toString()},000`,
}));

// Headless: the grid's state driving markup of our own
const headless = useDataGrid({
  columns: simpleColumns,
  data: ref(data.map(({ _actions, ...rest }) => rest)),
  defaultPerPage: 5,
});

// The grid sorts on a column's `sortKey` when it has one, so compare against that.
function sortIndicator(col: { key: string; sortKey?: string }) {
  const s = headless.sort.value;
  if (s?.key !== (col.sortKey ?? col.key)) return "";
  return s.direction === "asc" ? " ↑" : " ↓";
}
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiDataGrid
  :columns=&quot;[
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', sortable: true },
  ]&quot;
  :data=&quot;rows&quot;
  hide-column-manager
  hide-filter-panel
/>`">
        <CuiDataGrid
          :columns="simpleColumns"
          :data="simpleData"
          hide-column-manager
          hide-filter-panel
        />
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        The grid is built on <code>CuiTable</code>, so what it renders is a real
        <code>&lt;table&gt;</code> with <code>&lt;th scope="col"&gt;</code> headers — a screen
        reader's table mode works over it, and each cell is announced with its column.
        Nothing here reimplements grid semantics on top of divs.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          Once the table overflows, its wrapper becomes a <code>role="region"</code> with
          <code>tabindex="0"</code> and the accessible name “Scrollable table”, so a wide grid
          can be scrolled from the keyboard — WCAG 2.1.1. It is not a tab stop while the table
          fits.
        </li>
        <li>
          <code>virtualize</code> keeps the reported shape honest: the table carries
          <code>aria-rowcount</code> for the full data set and each rendered row its true
          <code>aria-rowindex</code>, so “row 4,312 of 10,000” is right even though only a few
          dozen rows exist in the DOM. The spacer rows that stand in for the rest are
          <code>aria-hidden</code>.
        </li>
        <li>
          Every string the grid renders itself — the search placeholder, the filter labels,
          the “N items selected” count, the empty state — comes from the message bundle, so it
          translates with the rest of your application rather than being hardcoded English.
        </li>
        <li>
          Column sorting is pointer-driven: the click handler sits on the header cell rather
          than on a button inside it, and there is no <code>aria-sort</code>, so the current
          sort is conveyed by the caret icon alone. If keyboard sorting matters for your
          grid, put your own control in <code>#toolbar-start</code> and drive the data
          yourself.
        </li>
        <li>
          Give the grid a heading immediately above it. Neither the table nor the toolbar
          names what the rows are, and a page with two grids on it is otherwise two
          identical-sounding regions.
        </li>
        <li>
          <code>row-click</code> makes the whole row clickable but does not make it
          focusable. Where a row navigates somewhere, put a real link in one of its cells —
          usually the name column, through a <code>cell-</code> slot — so there is something
          to tab to.
        </li>
      </ul>
    </template>

    <template #examples>

      <!-- Full-featured with filters -->
      <Example title="Full-Featured: Sorting, Filtering, Selection, Row Actions" :code="`<CuiDataGrid
  :columns=&quot;columns&quot;
  :data=&quot;data&quot;
  :bulk-actions=&quot;[
    { key: 'export', label: 'Export' },
    { key: 'delete', label: 'Delete', variant: 'destructive' },
  ]&quot;
  max-height=&quot;420px&quot;
  size=&quot;sm&quot;
  grid-id=&quot;my-grid&quot;
  @row-click=&quot;onRowClick&quot;
  @row-action=&quot;onRowAction&quot;
  @bulk-action=&quot;onBulkAction&quot;
>
  <template #cell-status=&quot;{ value }&quot;>
    <CuiBadge :color=&quot;value === 'Active' ? 'success' : 'secondary'&quot; size=&quot;sm&quot;>
      {{ value }}
    </CuiBadge>
  </template>
</CuiDataGrid>`">
        <CuiDataGrid
          :columns="columns"
          :data="data"
          :bulk-actions="bulkActions"
          max-height="420px"
          size="sm"
          grid-id="demo-full"
          @row-click="onRowClick"
          @row-action="onRowAction"
          @bulk-action="onBulkAction"
        >
          <template #cell-status="{ value }">
            <CuiBadge
              :color="value === 'Active' ? 'success' : value === 'On Leave' ? 'warning' : 'secondary'"
              size="sm"
            >
              {{ value }}
            </CuiBadge>
          </template>
        </CuiDataGrid>
        <p class="mt-2 text-sm" style="color: var(--cui-text-secondary);">
          Last event: {{ lastEvent }}
        </p>
      </Example>

      <!-- Card view -->
      <Example title="Card View Toggle" :code="`<CuiDataGrid :columns=&quot;columns&quot; :data=&quot;data&quot;>
  <template #card=&quot;{ row }&quot;>
    <CuiCard variant=&quot;outline&quot;>
      <CuiCardBody>
        <div class=&quot;font-semibold text-sm&quot;>{{ row.name }}</div>
        <div class=&quot;text-xs&quot; style=&quot;color: var(--cui-text-secondary)&quot;>{{ row.role }}</div>
      </CuiCardBody>
    </CuiCard>
  </template>
</CuiDataGrid>`">
        <CuiDataGrid
          :columns="columns"
          :data="data.slice(0, 9)"
          hide-filter-panel
          hide-column-manager
        >
          <template #card="{ row }">
            <CuiCard variant="outline">
              <CuiCardBody>
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <div
                    style="width: 2.5rem; height: 2.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.75rem; background: var(--cui-primary-bg); color: var(--cui-primary);"
                  >
                    {{ (row.name as string).split(' ').map((n: string) => n[0]).join('') }}
                  </div>
                  <div>
                    <div class="text-sm font-semibold">{{ row.name }}</div>
                    <div class="text-xs" style="color: var(--cui-text-secondary);">{{ row.role }}</div>
                  </div>
                </div>
                <div class="mt-3" style="display: flex; justify-content: space-between; align-items: center;">
                  <span class="text-xs" style="color: var(--cui-text-secondary);">{{ row.email }}</span>
                  <CuiBadge
                    :color="row.status === 'Active' ? 'success' : row.status === 'On Leave' ? 'warning' : 'secondary'"
                    size="sm"
                  >
                    {{ row.status }}
                  </CuiBadge>
                </div>
              </CuiCardBody>
            </CuiCard>
          </template>
        </CuiDataGrid>
      </Example>

      <!-- Sticky columns -->
      <Example title="Sticky Columns (scroll horizontally)" :code="`<CuiDataGrid
  :columns=&quot;[
    { key: 'name', label: 'Name', sticky: true, width: '160px' },
    { key: 'email', label: 'Email', sticky: true, width: '200px' },
    ...
  ]&quot;
  :data=&quot;data&quot;
  max-height=&quot;320px&quot;
/>`">
        <CuiDataGrid
          :columns="wideColumns"
          :data="wideData"
          max-height="320px"
          size="sm"
          hide-toolbar
        />
      </Example>

      <!-- Sticky columns + bulk selection -->
      <Example title="Sticky Columns with Bulk Selection" :code="`<CuiDataGrid
  :columns=&quot;[
    { key: 'name', label: 'Name', sticky: true, width: '160px' }, // or '12rem'
    { key: 'email', label: 'Email', sticky: true, width: '200px' },
    ...
  ]&quot;
  :data=&quot;data&quot;
  :bulk-actions=&quot;bulkActions&quot;
  max-height=&quot;320px&quot;
/>`">
        <CuiStack spacing="4">
          <p class="text-sm text-surface-500">
            With bulk selection on, the checkbox column freezes along with the sticky columns.
            Scroll right: the checkboxes stay at the left edge, the frozen columns sit flush
            against each other with nothing showing through between them, and the select-all
            header stays on top. Switch Name to a width written in <code>rem</code> to see the
            offsets follow it.
          </p>
          <CuiToggle v-model="stickyBulkRem" label="Name width in rem (12rem)" />
          <CuiDataGrid
            :columns="stickyBulkColumns"
            :data="wideData"
            :bulk-actions="bulkActions"
            max-height="320px"
            hide-toolbar
          />
        </CuiStack>
      </Example>

      <!-- Virtualized -->
      <Example title="Virtualized (10,000 rows)" :code="`<!-- maxHeight is required: it defines the scroll viewport to window against -->
<CuiDataGrid
  :columns=&quot;columns&quot;
  :data=&quot;largeRows&quot;   <!-- 10,000 rows -->
  max-height=&quot;420px&quot;
  virtualize
  hide-toolbar
/>`">
        <CuiCard variant="outline">
          <CuiCardBody>
            <p class="text-sm" style="color: var(--cui-text-secondary); margin: 0;">
              <CuiIcon name="info" size="0.875rem" style="vertical-align: -2px;" />
              Only the rows in the viewport (plus a small overscan buffer) are in the DOM,
              so scrolling stays smooth regardless of dataset size. <strong>Virtualization
              requires <code>max-height</code></strong> — it defines the scroll viewport.
              Enable it at <strong>≥ 500 rows</strong> in client-side mode; server-side grids
              paginate at the API layer and rarely need it.
            </p>
          </CuiCardBody>
        </CuiCard>
        <div class="mt-3">
          <CuiDataGrid
            :columns="simpleColumns"
            :data="largeData"
            max-height="420px"
            size="sm"
            virtualize
            hide-toolbar
          />
        </div>
      </Example>

      <!-- Striped + bordered -->
      <Example title="Striped + Bordered" :code="`<CuiDataGrid
  :columns=&quot;columns&quot;
  :data=&quot;data&quot;
  striped
  bordered
  hide-toolbar
/>`">
        <CuiDataGrid
          :columns="simpleColumns"
          :data="simpleData"
          striped
          bordered
          hide-toolbar
        />
      </Example>

    </template>

    <template #extra>
      <div>
        <h2 id="headless" class="mb-4 text-2xl font-semibold">Headless</h2>
        <CuiStack spacing="4">
          <CuiCard variant="outline">
            <CuiCardBody>
              <p class="mb-3 text-surface-600 dark:text-surface-400">
                <code>CuiDataGrid</code> is a view over a state object, and that object is
                available on its own. <code>useDataGrid(options)</code> returns the same
                <code>DataGridContext</code> the component renders from — column state, sort,
                filters, search, pagination, selection, view mode and saved-view config — so you
                can drive markup of your own with the grid's behaviour (client-side search, sort,
                filter and paging, or server-side query params) without its UI.
              </p>
              <ul class="mb-3 list-disc pl-5 text-surface-600 dark:text-surface-400">
                <li>
                  <strong>Options:</strong> <code>columns</code> (an array, read once, or a ref or
                  getter to follow changes), <code>data</code> (a <code>Ref</code> of rows or of a
                  Laravel-style <code>PaginatedData</code> page), <code>serverSide</code>,
                  <code>rowKey</code> (default <code>"id"</code>), <code>defaultPerPage</code>
                  (default 15), <code>initialView</code> (a <code>DataGridViewConfig</code>) and
                  <code>hydrateFromUrl</code>.
                </li>
                <li>
                  <strong>State</strong> (refs): <code>displayData</code> (the current page,
                  already searched, filtered and sorted), <code>paginationMeta</code>,
                  <code>visibleColumns</code>, <code>sort</code>, <code>filters</code>,
                  <code>searchQuery</code>, <code>page</code>, <code>perPage</code>,
                  <code>selectedRows</code>, <code>viewMode</code>, <code>isDirty</code>.
                </li>
                <li>
                  <strong>Actions:</strong> <code>applySort(key)</code> (cycles asc → desc →
                  none), <code>applyFilter(filter)</code>, <code>removeFilter</code>,
                  <code>clearFilters</code>, <code>search(query, field?)</code>,
                  <code>setPage</code>, <code>setPerPage</code>, <code>toggleSelection</code>,
                  <code>selectAll</code>, <code>toggleColumnVisibility</code>,
                  <code>reorderColumns</code>, <code>getQueryParams()</code>,
                  <code>getConfig()</code> / <code>loadConfig(config)</code>,
                  <code>markClean()</code>, <code>resetToDefaults()</code>. Changing sort,
                  filters, search or page size returns to page 1.
                </li>
              </ul>
              <pre class="cui-pre"><code class="cui-code">import { ref } from "vue";
import { useDataGrid, type DataGridColumn, type DataGridRow } from "@itguy614/clean-ui";

const columns: DataGridColumn[] = [
  { key: "name", label: "Name", sortable: true },
  { key: "role", label: "Role", sortable: true },
];
const rows = ref&lt;DataGridRow[]&gt;(await fetchPeople());

const grid = useDataGrid({ columns, data: rows, defaultPerPage: 5 });

grid.search("eng");          // client-side search across every field
grid.applySort("name");      // asc; again for desc; a third time clears it
grid.displayData.value;      // the rows to render on this page
grid.paginationMeta.value;   // { current_page, last_page, per_page, total, from, to }</code></pre>
            </CuiCardBody>
          </CuiCard>

          <Example title="Headless: useDataGrid with your own markup" :code="`<script setup lang=&quot;ts&quot;>
const grid = useDataGrid({ columns, data: ref(rows), defaultPerPage: 5 });
&lt;/script>

<CuiInput :model-value=&quot;grid.searchQuery.value&quot; @update:model-value=&quot;(v) => grid.search(String(v))&quot; />
<CuiTable>
  <CuiTableHead>
    <CuiTableRow>
      <CuiTableCell v-for=&quot;col in grid.visibleColumns.value&quot; :key=&quot;col.key&quot;>
        <CuiButton variant=&quot;ghost&quot; :disabled=&quot;!col.sortable&quot; @click=&quot;grid.applySort(col.key)&quot;>
          {{ col.label }}
        </CuiButton>
      </CuiTableCell>
    </CuiTableRow>
  </CuiTableHead>
  <CuiTableBody>
    <CuiTableRow v-for=&quot;row in grid.displayData.value&quot; :key=&quot;row.id&quot;>
      <CuiTableCell v-for=&quot;col in grid.visibleColumns.value&quot; :key=&quot;col.key&quot;>{{ row[col.key] }}</CuiTableCell>
    </CuiTableRow>
  </CuiTableBody>
</CuiTable>
<CuiButton @click=&quot;grid.setPage(grid.page.value - 1)&quot;>Previous</CuiButton>
<CuiButton @click=&quot;grid.setPage(grid.page.value + 1)&quot;>Next</CuiButton>`">
            <CuiStack spacing="3">
              <div style="max-width: 18rem;">
                <CuiInput
                  :model-value="headless.searchQuery.value"
                  placeholder="Search…"
                  aria-label="Search people"
                  @update:model-value="(v) => headless.search(String(v))"
                />
              </div>
              <CuiCard variant="outline">
                <CuiCardBody no-padding>
                  <CuiTable size="sm">
                    <CuiTableHead>
                      <CuiTableRow>
                        <CuiTableCell v-for="col in headless.visibleColumns.value" :key="col.key">
                          <CuiButton
                            v-if="col.sortable"
                            variant="ghost"
                            size="sm"
                            @click="headless.applySort(col.key)"
                          >
                            {{ col.label }}{{ sortIndicator(col) }}
                          </CuiButton>
                          <template v-else>{{ col.label }}</template>
                        </CuiTableCell>
                      </CuiTableRow>
                    </CuiTableHead>
                    <CuiTableBody>
                      <CuiTableRow v-for="row in headless.displayData.value" :key="String(row.id)">
                        <CuiTableCell v-for="col in headless.visibleColumns.value" :key="col.key">
                          {{ row[col.key] }}
                        </CuiTableCell>
                      </CuiTableRow>
                    </CuiTableBody>
                  </CuiTable>
                </CuiCardBody>
              </CuiCard>
              <CuiFlex gap="3" class="items-center">
                <CuiButton
                  size="sm"
                  :disabled="headless.page.value <= 1"
                  @click="headless.setPage(headless.page.value - 1)"
                >
                  Previous
                </CuiButton>
                <span class="text-sm" style="color: var(--cui-text-secondary);">
                  {{ headless.paginationMeta.value.from ?? 0 }}–{{ headless.paginationMeta.value.to ?? 0 }}
                  of {{ headless.paginationMeta.value.total }}
                </span>
                <CuiButton
                  size="sm"
                  :disabled="headless.page.value >= headless.paginationMeta.value.last_page"
                  @click="headless.setPage(headless.page.value + 1)"
                >
                  Next
                </CuiButton>
              </CuiFlex>
            </CuiStack>
          </Example>

          <CuiCard variant="outline">
            <CuiCardBody>
              <h3 id="sharing-grid-state" class="mb-2 text-lg font-semibold">Sharing state with sub-components</h3>
              <p class="mb-3 text-surface-600 dark:text-surface-400">
                <code>provideDataGrid(context)</code> provides a grid to every descendant, and
                <code>useDataGridState()</code> injects it — throwing if no grid is above it, so
                a misplaced component fails loudly rather than rendering empty. This is how
                <code>CuiDataGrid</code>'s own search, filter panel, pagination and bulk bar reach
                its state. <code>CuiDataGrid</code> calls <code>provideDataGrid</code> itself, so a
                component you place in its <code>#toolbar-start</code>, <code>#toolbar-end</code> or
                cell slots can call <code>useDataGridState()</code> too. Call it from a child
                component's setup; the component that calls <code>provideDataGrid</code> cannot
                inject its own value.
              </p>
              <pre class="cui-pre"><code class="cui-code">// PeopleGrid.vue — owns the state
const grid = useDataGrid({ columns, data: rows });
provideDataGrid(grid);

// ActiveFilterCount.vue — anywhere below PeopleGrid, or inside a CuiDataGrid slot
import { computed } from "vue";
import { useDataGridState } from "@itguy614/clean-ui";

const grid = useDataGridState();
const count = computed(() => grid.filters.value.length);</code></pre>
            </CuiCardBody>
          </CuiCard>

          <CuiCard variant="outline">
            <CuiCardBody>
              <h3 id="saved-views" class="mb-2 text-lg font-semibold">Saved views</h3>
              <p class="mb-3 text-surface-600 dark:text-surface-400">
                On the component, saved views are two props: <code>grid-id</code> turns on the
                toolbar's view manager and <code>view-adapter</code> says where views are stored.
                The manager is built on <code>useDataGridViews({ gridId, adapter? })</code>, which
                you can use directly with a headless grid. It returns <code>views</code>,
                <code>activeViewId</code> and <code>loading</code> refs and
                <code>fetchViews()</code>, <code>saveView(name, config)</code> (overwrites a view of
                the same name, then makes it active), <code>updateView(id, config)</code>,
                <code>removeView(id)</code> and <code>selectView(id)</code>. It does not load on its
                own — call <code>fetchViews()</code> first — and <code>selectView</code> only marks a
                view active: apply it with <code>grid.loadConfig(view.config)</code>.
              </p>
              <p class="mb-3 text-surface-600 dark:text-surface-400">
                The adapter is a <code>DataGridViewAdapter</code> — async <code>load(gridId)</code>,
                <code>save(gridId, view)</code> and <code>remove(gridId, viewId)</code> — so views can
                live behind an API. Without one it defaults to
                <code>localStorageViewAdapter(prefix = "cui-datagrid")</code>, which stores each
                grid's views as JSON under <code>`${prefix}-views-${gridId}`</code> and treats a
                missing or corrupt entry as no views.
              </p>
              <pre class="cui-pre"><code class="cui-code">import { useDataGrid, useDataGridViews, localStorageViewAdapter, type DataGridViewAdapter } from "@itguy614/clean-ui";

const grid = useDataGrid({ columns, data: rows });
const views = useDataGridViews({ gridId: "people", adapter: localStorageViewAdapter("acme") });

await views.fetchViews();
await views.saveView("Engineering only", grid.getConfig());
grid.markClean();

function apply(id: string) {
  const view = views.views.value.find((v) => v.id === id);
  if (view) { views.selectView(id); grid.loadConfig(view.config); }
}

// Or persist server-side
const apiAdapter: DataGridViewAdapter = {
  load: (gridId) => api.get(`/grid-views/${gridId}`),
  save: (gridId, view) => api.put(`/grid-views/${gridId}/${view.id}`, view),
  remove: (gridId, viewId) => api.delete(`/grid-views/${gridId}/${viewId}`),
};
// &lt;CuiDataGrid grid-id="people" :view-adapter="apiAdapter" ... /&gt;</code></pre>
            </CuiCardBody>
          </CuiCard>

          <CuiCard variant="outline">
            <CuiCardBody>
              <h3 id="inertia" class="mb-2 text-lg font-semibold">Inertia</h3>
              <p class="mb-3 text-surface-600 dark:text-surface-400">
                <code>useDataGridInertia({ grid, url, router, extraParams? })</code> connects a grid
                to a Laravel + Inertia backend. It watches sort, filters, search, page and page
                size, and on each change calls <code>router.get(url, query, { preserveState: true,
                preserveScroll: true })</code> with the query built from
                <code>grid.getQueryParams()</code>: <code>page</code> (omitted on page 1),
                <code>per_page</code>, <code>sort</code> + <code>direction</code>,
                <code>search</code> + <code>search_field</code>, and <code>filter[key]</code> per filter
                (multi-select values comma-joined), plus every <code>extraParams</code> entry. Those
                are the keys <code>hydrateFromUrl</code> reads back, so a reload or a shared link
                restores the same state. It returns <code>navigate()</code>, to trigger a visit by
                hand, and <code>buildQueryData(params)</code>.
              </p>
              <p class="mb-3 text-surface-600 dark:text-surface-400">
                It takes the grid context, so pair it with a headless <code>useDataGrid</code> (with
                <code>serverSide</code> and <code>hydrateFromUrl</code>), or call it inside a
                component in a <code>CuiDataGrid</code> slot with
                <code>useDataGridState()</code>. With the component on its own, the
                <code>navigate</code> event carries the same <code>DataGridQueryParams</code>.
              </p>
              <pre class="cui-pre"><code class="cui-code">import { computed } from "vue";
import { router, usePage } from "@inertiajs/vue3";
import { useDataGrid, useDataGridInertia } from "@itguy614/clean-ui";

const page = usePage();
const grid = useDataGrid({
  columns,
  data: computed(() => page.props.users),   // a Laravel paginator
  serverSide: true,
  hydrateFromUrl: true,
});

useDataGridInertia({ grid, url: route("users.index"), router, extraParams: { team: "7" } });</code></pre>
            </CuiCardBody>
          </CuiCard>
        </CuiStack>
      </div>
    </template>
  </DocPage>
</template>

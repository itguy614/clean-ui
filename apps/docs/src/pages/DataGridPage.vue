<script setup lang="ts">
import { computed, ref } from "vue";
import {
  CuiDataGrid,
  CuiBadge,
  CuiCard,
  CuiCardBody,
  CuiIcon,
  CuiStack,
  CuiToggle,
  CuiSlideover,
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

// Clickable rows: a row opens its details in a slideover
const openRow = ref<DataGridRow | null>(null);
const slideoverOpen = computed({
  get: () => openRow.value !== null,
  set: (v) => { if (!v) openRow.value = null; },
});
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
          A sortable column's header text is a <code>&lt;button&gt;</code> — Tab to it, press
          Enter or Space to sort — and its <code>&lt;th&gt;</code> carries
          <code>aria-sort</code> (<code>ascending</code>, <code>descending</code> or
          <code>none</code>), so the direction isn't left to the caret icon.
        </li>
        <li>
          The select-all checkbox is named “Select all rows”, and each row's checkbox and
          actions button are named after the row: “Select Alice”, “Actions for Alice”. By
          default that's the first column's value when it is text or a number, else the row's
          position; pass <code>rowLabel</code> to choose. The view toggle's buttons are named “Table view” and “Card
          view”, with the active one pressed. All from the message bundle
          (<code>dataGrid.selectAll</code>, <code>selectRow</code>, <code>rowActions</code>,
          <code>tableView</code>, <code>cardView</code>).
        </li>
        <li>
          Give the grid a heading immediately above it. Neither the table nor the toolbar
          names what the rows are, and a page with two grids on it is otherwise two
          identical-sounding regions.
        </li>
        <li>
          With a <code>row-click</code> listener, rows are interactive: one tab stop, moved with
          the arrow keys and Home/End, opened with Enter or Space, with a focus ring and a
          pointer cursor. Keys pressed in a cell's own checkbox, button or link stay theirs, and
          native table semantics stay (no <code>role="grid"</code>). An overlay opened from a
          row returns focus to it on close, even if it has scrolled out of a virtualised
          window. <code>rowClickable</code> overrides the detection: <code>false</code> for a
          listener that is only analytics, <code>true</code> without one. Without either, rows
          are plain rows.
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

      <!-- Clickable rows -->
      <Example title="Clickable Rows (keyboard + slideover)" :code="`<CuiDataGrid
  :columns=&quot;columns&quot;
  :data=&quot;largeRows&quot;
  max-height=&quot;320px&quot;
  virtualize
  hide-toolbar
  hide-pagination
  :per-page-options=&quot;[10000]&quot;
  @row-click=&quot;({ row }) => (openRow = row)&quot;
/>
<CuiSlideover v-model:visible=&quot;slideoverOpen&quot; :title=&quot;openRow?.name&quot;>…</CuiSlideover>`">
        <CuiCard variant="outline">
          <CuiCardBody>
            <p class="text-sm" style="color: var(--cui-text-secondary); margin: 0;">
              <CuiIcon name="info" size="0.875rem" style="vertical-align: -2px;" />
              With a <code>@row-click</code> listener, rows are one tab stop: <kbd>↑</kbd>/<kbd>↓</kbd>,
              <kbd>Home</kbd>/<kbd>End</kbd> move between them, <kbd>Enter</kbd> or <kbd>Space</kbd>
              opens one. <kbd>Esc</kbd> closes the slideover and focus returns to the row — even if
              it scrolled out of the virtualised window meanwhile.
            </p>
          </CuiCardBody>
        </CuiCard>
        <div class="mt-3">
          <CuiDataGrid
            :columns="simpleColumns"
            :data="largeData"
            max-height="320px"
            size="sm"
            virtualize
            hide-toolbar
            hide-pagination
            :per-page-options="[10000]"
            @row-click="({ row }) => (openRow = row)"
          />
        </div>
        <CuiSlideover v-model:visible="slideoverOpen" :title="String(openRow?.name ?? '')">
          <CuiStack v-if="openRow" spacing="2">
            <div><strong>Email:</strong> {{ openRow.email }}</div>
            <div><strong>Role:</strong> {{ openRow.role }}</div>
            <div><strong>Status:</strong> {{ openRow.status }}</div>
          </CuiStack>
        </CuiSlideover>
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
  </DocPage>
</template>

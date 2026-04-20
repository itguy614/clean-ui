<script setup lang="ts">
import { ref } from "vue";
import {
  CuiDataGrid,
  CuiStack,
  CuiBadge,
  CuiCard,
  CuiCardBody,
  CuiCardHeader,
  CuiIcon,
  type DataGridColumn,
  type DataGridRow,
  type DataGridBulkAction,
} from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import EventTable from "../components/EventTable.vue";
import Example from "../components/Example.vue";

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
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Data Grid</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        A full-featured data grid with sorting, search, filtering, pagination, row selection,
        column management, card view, and saved views.
      </p>
    </div>

    <!-- Props -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">CuiDataGrid Props</h2>
      <PropTable
        :props="[
          { name: 'columns', type: 'DataGridColumn[]', default: '—', description: 'Column definitions (required)' },
          { name: 'data', type: 'T[] | PaginatedData<T>', default: '—', description: 'Data source (required)' },
          { name: 'serverSide', type: 'boolean', default: 'false', description: 'Server-side mode — emits navigate events' },
          { name: 'rowKey', type: 'string', default: 'id', description: 'Row identifier key' },
          { name: 'bulkActions', type: 'BulkAction[]', default: '[]', description: 'Bulk action definitions' },
          { name: 'stickyHeader', type: 'boolean', default: 'true', description: 'Sticky table header' },
          { name: 'maxHeight', type: 'string', default: '—', description: 'Max height for scroll' },
          { name: 'size', type: 'sm | md | lg', default: 'md', description: 'Table size' },
          { name: 'loading', type: 'boolean', default: 'false', description: 'Loading skeleton' },
          { name: 'filterPanelSide', type: 'left | right', default: 'right', description: 'Filter panel position' },
          { name: 'gridId', type: 'string', default: '—', description: 'Grid ID for saved views (enables view manager)' },
          { name: 'initialView', type: 'DataGridViewConfig', default: '—', description: 'Initial view config' },
          { name: 'hydrateUrl', type: 'boolean', default: 'false', description: 'Hydrate state from URL params' },
          { name: 'hideToolbar', type: 'boolean', default: 'false', description: 'Hide toolbar' },
          { name: 'hidePagination', type: 'boolean', default: 'false', description: 'Hide pagination' },
          { name: 'hideSearch', type: 'boolean', default: 'false', description: 'Hide search' },
          { name: 'hideColumnManager', type: 'boolean', default: 'false', description: 'Hide column manager' },
          { name: 'hideFilterPanel', type: 'boolean', default: 'false', description: 'Hide filter toggle' },
          { name: 'showSelectAll', type: 'boolean', default: 'true', description: 'Show select-all checkbox in header' },
          { name: 'striped', type: 'boolean', default: 'false', description: 'Alternating row background stripes' },
          { name: 'hoverable', type: 'boolean', default: 'true', description: 'Highlight rows on hover' },
          { name: 'bordered', type: 'boolean', default: 'false', description: 'Show borders between cells' },
          { name: 'perPageOptions', type: 'number[]', default: '[10, 25, 50, 100]', description: 'Per-page selector options' },
          { name: 'viewAdapter', type: 'DataGridViewAdapter', default: '—', description: 'Custom adapter for saving/loading views' },
          { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the component' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Events</h2>
      <EventTable
        :events="[
          { name: 'navigate', payload: 'DataGridQueryParams', description: 'Fires in server-side mode when sort, filter, search, or page changes' },
          { name: 'row-click', payload: '{ row: DataGridRow }', description: 'Fires when a table row is clicked' },
          { name: 'row-action', payload: '{ action, row }', description: 'Fires when a row action is triggered' },
          { name: 'bulk-action', payload: '{ action, rows }', description: 'Fires when a bulk action is triggered on selected rows' },
          { name: 'selection-change', payload: 'string[]', description: 'Fires when selected row IDs change' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Simple -->
        <Example title="Simple Data Grid" :code="`<CuiDataGrid
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

      </CuiStack>
    </div>
  </CuiStack>
</template>

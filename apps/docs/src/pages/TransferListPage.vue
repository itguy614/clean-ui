<script setup lang="ts">
import { ref } from "vue";
import { CuiStack, CuiTransferList, type TransferListItem } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import EventTable from "../components/EventTable.vue";
import Example from "../components/Example.vue";

const permissions: TransferListItem[] = [
  { value: "read", label: "Read", description: "View resources" },
  { value: "write", label: "Write", description: "Create and edit resources" },
  { value: "delete", label: "Delete", description: "Remove resources" },
  { value: "admin", label: "Admin", description: "Full administrative access" },
  { value: "audit", label: "Audit", description: "View audit logs" },
  { value: "export", label: "Export", description: "Export data" },
  { value: "import", label: "Import", description: "Import data" },
  { value: "billing", label: "Billing", description: "Manage billing", disabled: true },
];
const selectedPerms = ref<string[]>(["read"]);

const columns: TransferListItem[] = [
  { value: "name", label: "Name", icon: "user" },
  { value: "email", label: "Email", icon: "envelope-simple" },
  { value: "role", label: "Role", icon: "shield-check" },
  { value: "status", label: "Status", icon: "circle-half" },
  { value: "created", label: "Created At", icon: "calendar-blank" },
  { value: "updated", label: "Updated At", icon: "calendar-blank" },
  { value: "phone", label: "Phone", icon: "phone" },
  { value: "address", label: "Address", icon: "map-pin" },
  { value: "department", label: "Department", icon: "buildings" },
  { value: "manager", label: "Manager", icon: "user-circle" },
  { value: "salary", label: "Salary", icon: "currency-dollar" },
  { value: "notes", label: "Notes", icon: "note" },
];
const selectedCols = ref<string[]>(["name", "email", "role", "status"]);

const simple: TransferListItem[] = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Bravo" },
  { value: "c", label: "Charlie" },
  { value: "d", label: "Delta" },
  { value: "e", label: "Echo" },
  { value: "f", label: "Foxtrot" },
];
const selectedSimple = ref<string[]>([]);
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Transfer List</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        A dual-panel list for moving items between "available" and "selected" with
        reordering. Click to select, use arrows to transfer, up/down to reorder.
        Double-click to move instantly.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'items', type: 'TransferListItem[]', default: '—', description: 'All available items (required)' },
          { name: 'modelValue', type: '(string | number)[]', default: '[]', description: 'Selected values (v-model, order preserved)' },
          { name: 'sourceTitle', type: 'string', default: 'Available', description: 'Left panel title' },
          { name: 'targetTitle', type: 'string', default: 'Selected', description: 'Right panel title' },
          { name: 'filterable', type: 'boolean', default: 'true', description: 'Show search filter' },
          { name: 'height', type: 'string', default: '320px', description: 'Panel height' },
          { name: 'sourcePlaceholder', type: 'string', default: 'Filter...', description: 'Source panel search placeholder' },
          { name: 'targetPlaceholder', type: 'string', default: 'Filter...', description: 'Target panel search placeholder' },
          { name: 'size', type: 'sm | md | lg', default: 'md', description: 'Size' },
          { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state' },
          { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the component' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Events</h2>
      <EventTable
        :events="[
          { name: 'update:modelValue', payload: '(string | number)[]', description: 'Fires when selected items change (v-model)' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic -->
        <Example title="Basic" :code="`<CuiTransferList :items=&quot;items&quot; v-model=&quot;selected&quot; />`">
          <CuiTransferList :items="simple" v-model="selectedSimple" :filterable="false" height="200px" />
          <div class="mt-2 text-sm" style="color: var(--cui-text-secondary);">
            Selected (in order): <code class="cui-code">{{ selectedSimple }}</code>
          </div>
        </Example>

        <!-- With descriptions -->
        <Example title="Permissions (with descriptions + disabled)" :code="`<CuiTransferList
  :items=&quot;permissions&quot;
  v-model=&quot;selected&quot;
  source-title=&quot;Available Permissions&quot;
  target-title=&quot;Granted&quot;
/>`">
          <CuiTransferList
            :items="permissions"
            v-model="selectedPerms"
            source-title="Available Permissions"
            target-title="Granted"
            height="280px"
          />
          <div class="mt-2 text-sm" style="color: var(--cui-text-secondary);">
            Granted: <code class="cui-code">{{ selectedPerms }}</code>
          </div>
        </Example>

        <!-- Real-world: Column chooser with icons -->
        <Example title="Real-World: Column Chooser" :code="`<CuiTransferList
  :items=&quot;columns&quot;
  v-model=&quot;visibleCols&quot;
  source-title=&quot;Available Columns&quot;
  target-title=&quot;Visible Columns&quot;
/>`">
          <CuiTransferList
            :items="columns"
            v-model="selectedCols"
            source-title="Available Columns"
            target-title="Visible Columns"
          />
          <div class="mt-2 text-sm" style="color: var(--cui-text-secondary);">
            Visible (in display order): <code class="cui-code">{{ selectedCols }}</code>
          </div>
        </Example>

        <!-- Disabled -->
        <Example title="Disabled" :code="`<CuiTransferList :items=&quot;items&quot; v-model=&quot;selected&quot; disabled />`">
          <CuiTransferList :items="simple" :model-value="['a', 'b']" disabled :filterable="false" height="200px" />
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>

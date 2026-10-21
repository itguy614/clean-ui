<script setup lang="ts">
import { ref } from "vue";
import { CuiTransferList, type TransferListItem } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/transfer-list";

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
  <DocPage :meta="meta">
    <template #intro>
      <p class="text-surface-700 dark:text-surface-300">
        Click an item to mark it, then use the arrows to transfer the marked items;
        double-click moves one immediately, and dragging moves it to a chosen position.
        The right-hand array is ordered, so the up/down arrows are a real part of the
        value, not a view preference.
      </p>
    </template>

    <template #usage>
      <Example
        code-open
        :code="`<CuiTransferList :items=&quot;items&quot; v-model=&quot;selected&quot; />`"
      >
        <CuiTransferList :items="simple" v-model="selectedSimple" :filterable="false" height="200px" />
        <div class="mt-2 text-sm" style="color: var(--cui-text-secondary);">
          Selected (in order): <code class="cui-code">{{ selectedSimple }}</code>
        </div>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        Each list is a <code>role="listbox"</code> with <code>aria-multiselectable</code>, named
        by its panel title, and each item a <code>role="option"</code> whose
        <code>aria-selected</code> says whether it is marked for transfer.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          Each list is one tab stop. Arrow Up and Down move between items, Home and End jump
          to the ends, and disabled items are skipped.
        </li>
        <li>
          Space marks or unmarks the focused item, which is what enables the arrow buttons.
          Enter moves the focused item to the other list straight away, as a double-click does,
          and focus moves on to the nearest item left in its list.
        </li>
        <li>
          The six arrow buttons are named — “Move selected to Selected”, “Move all to
          Available”, “Move up”, … — from the panel titles, and the filter fields are named
          “Filter Available” and “Filter Selected”. The names come from the message catalogue
          (<code>transferList.*</code>).
        </li>
        <li>
          Drag-and-drop has no keyboard equivalent of its own: mark an item, then use the arrow
          buttons, or Move up / Move down to reorder the selected list. The counts beside the
          titles are not announced when they change.
        </li>
      </ul>
    </template>

    <template #examples>
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
    </template>
  </DocPage>
</template>

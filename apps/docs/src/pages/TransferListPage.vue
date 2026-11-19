<script setup lang="ts">
import { ref } from "vue";
import { CuiCard, CuiCardBody, CuiTransferList, type TransferListItem } from "@itguy614/clean-ui";
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

const orderableSelected = ref<string[]>(["d"]);
const orderableSource = ref<string[]>(["a", "b", "c", "e", "f"]);
</script>

<template>
  <DocPage :meta="meta">
    <template #intro>
      <p class="text-surface-700 dark:text-surface-300">
        Click an item to mark it, then use the arrows to transfer the marked items;
        double-click moves one immediately, and dragging an item between the lists moves it
        (to a chosen position on the right), with the same floating ghost both ways. The right-hand array is ordered, and the selected list is a
        <code>CuiSortableList</code>: drag a row by its grip, grab it with the keyboard, or
        use Move up / Move down. The order is part of the value, not a view preference.
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

      <CuiCard variant="outline" class="mt-4">
        <CuiCardBody>
          <p><strong>Try:</strong></p>
          <ul>
            <li>Drag a left-hand row toward the right-hand list: it floats after the pointer, tilted, while the row stays behind, faint. Over the right-hand list a placeholder opens where it would land (top, middle, bottom, or an empty list) and the rows slide aside. Drop to insert it there; press <kbd>Esc</kbd> first and nothing moves.</li>
            <li>Drag a right-hand row by its body (not its grip) over the left-hand list: the left panel lights up, and dropping returns it.</li>
            <li>On touch, drag from the grip on a left-hand row; the rest of the row still scrolls the panel.</li>
            <li>Double-click a left-hand item to send it across, then add two or three more.</li>
            <li>Drag a right-hand row by its grip: it floats, tilted, over a placeholder while the others slide aside. Drop it and the order is committed once. Press <kbd>Esc</kbd> mid-drag and it snaps back.</li>
            <li>Tab to the right-hand list (one tab stop, on a grip). <kbd>Space</kbd> or <kbd>Enter</kbd> grabs the row, <kbd>↑</kbd>/<kbd>↓</kbd>/<kbd>Home</kbd>/<kbd>End</kbd> move it, <kbd>Space</kbd> drops, <kbd>Esc</kbd> cancels.</li>
            <li>Click a right-hand row to mark it (or press <kbd>Shift</kbd>+<kbd>Space</kbd> on its grip), then click Move up / Move down in the middle column.</li>
            <li>Press <kbd>Delete</kbd> on a right-hand grip to send that row back to the left.</li>
            <li>Type in the right-hand filter and reorder what shows: hidden rows keep their place.</li>
            <li>With a screen reader on, each grab, move and drop is announced with its position.</li>
          </ul>
        </CuiCardBody>
      </CuiCard>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        The source list is a <code>role="listbox"</code> with <code>aria-multiselectable</code>,
        named by its panel title, and each item a <code>role="option"</code> whose
        <code>aria-selected</code> says whether it is marked for transfer. The selected list is
        a <code>CuiSortableList</code> (a <code>role="list"</code> named by its title) whose rows
        each carry a drag handle; a row marked for transfer is followed by a hidden “selected”
        (<code>transferList.marked</code>), since a list row has no <code>aria-selected</code>.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          Each list is one tab stop. Arrow Up and Down move between items, Home and End jump
          to the ends, and disabled items are skipped. On the selected list the stop is a
          row's drag handle.
        </li>
        <li>
          Keyboard model of the selected list: Space or Enter grabs the focused row, the
          arrows, Home and End move it, Space or Enter drops it, Escape cancels, and each step
          is announced. Space marks and Enter transfers on the source list, so the selected
          list has them on other keys: Shift+Space marks or unmarks the focused row, and
          Delete or Backspace returns it to the source list. A grabbed row keeps all its keys
          for the move, and a disabled row has no handle.
        </li>
        <li>
          Space marks or unmarks the focused item, which is what enables the arrow buttons.
          Enter moves the focused item to the other list straight away, as a double-click does,
          and focus moves on to the nearest item left in its list.
        </li>
        <li>
          The six arrow buttons are one vertical <code>CuiToolbar</code> named “Move items”
          (<code>transferList.actions</code>): one tab stop between the source list and the
          target panel (its filter field, then its list), with Arrow Up and Down, Home and End
          moving between the buttons. A button with nothing to do (nothing marked, a marked
          item already at the top, only disabled items left) is <code>aria-disabled</code> rather than
          <code>disabled</code>: it stays reachable and says it is unavailable, and the
          toolbar's tab stop doesn't disappear — nor drop focus when a move empties the marks.
          A disabled transfer list disables them outright.
        </li>
        <li>
          The six arrow buttons are named — “Move selected to Selected”, “Move all to
          Available”, “Move up”, … — from the panel titles, and the filter fields are named
          “Filter Available” and “Filter Selected”. The names come from the message catalogue
          (<code>transferList.*</code>).
        </li>
        <li>
          With <code>sourceOrder</code> set (<code>v-model:source-order</code>), the left list is a
          <code>CuiSortableList</code> too and has the same keys and announcements: grab with
          Space or Enter, move, drop, Escape to cancel; Shift+Space marks a row and Delete or
          Backspace sends it to the other list. Move up / Move down act on the one marked row of
          either list (the last marked, if both have one). Without it the left list is the
          unselected items in <code>items</code> order, cannot be reordered, and a row dragged
          onto it lights the whole panel, since no position could be kept.
        </li>
        <li>
          Dragging is never the only way: the keyboard grab above, or Move up / Move down in the
          toolbar (mark one row first), reorder the selected list with a single click or tap
          (WCAG 2.5.7). The rows carry no move buttons of their own, so there is one set. Dragging
          a source row onto the selected list, or a selected row (by its body) onto the source,
          is a pointer shortcut for the transfer buttons; Escape cancels it. The counts beside the titles are not announced when
          they change.
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

      <!-- Orderable source -->
      <Example title="Orderable source list" :code="`<CuiTransferList
  :items=&quot;items&quot;
  v-model=&quot;selected&quot;
  v-model:source-order=&quot;sourceOrder&quot;
/>`">
        <CuiTransferList
          :items="simple"
          v-model="orderableSelected"
          v-model:source-order="orderableSource"
          :filterable="false"
          height="240px"
        />
        <div class="mt-2 text-sm" style="color: var(--cui-text-secondary);">
          Left order: <code class="cui-code">{{ orderableSource }}</code> · Selected:
          <code class="cui-code">{{ orderableSelected }}</code>
        </div>
      </Example>

      <CuiCard variant="outline" class="mt-4">
        <CuiCardBody>
          <p><strong>Try:</strong></p>
          <ul>
            <li>Drag a left-hand row by its grip: it reorders within the left list, like the right one.</li>
            <li>Drag a right-hand row (by its body) toward the left list: a placeholder opens at the slot where it would land, and dropping puts it there (<code>sourceOrder</code> then the selected list update).</li>
            <li>Tab to the left list, press <kbd>Space</kbd> on a grip to grab, <kbd>↑</kbd>/<kbd>↓</kbd> to move, <kbd>Space</kbd> to drop. <kbd>Shift</kbd>+<kbd>Space</kbd> marks a row, <kbd>Delete</kbd> sends it to the other list.</li>
            <li>Click a left-hand row to mark it, then Move up / Move down in the middle column moves it in the left list; if both lists have a marked row, the last one marked moves.</li>
          </ul>
        </CuiCardBody>
      </CuiCard>

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

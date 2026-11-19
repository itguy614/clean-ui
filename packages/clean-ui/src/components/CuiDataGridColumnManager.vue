<script setup lang="ts">
import { computed, h, provide, type FunctionalComponent } from "vue";
import { useColumnLabel, useDataGridState } from "../composables/useDataGrid";
import CuiPopover from "./CuiPopover.vue";
import CuiButton from "./CuiButton.vue";
import CuiCheckbox from "./CuiCheckbox.vue";
import CuiIcon from "./CuiIcon.vue";
import CuiSortableList from "./CuiSortableList.vue";
import { CuiConfigKey } from "./config-context";
import type { DataGridColumnGroup, DataGridColumnUnit } from "../types/data-grid";
import { useMessages } from "../composables/useMessages";
import { IconColumns } from "../icons/generated/columns";
import { IconLock } from "../icons/generated/lock";

const messages = useMessages();

const grid = useDataGridState();
const columnLabel = useColumnLabel();

// The reorderable list's wording is this grid's: a consumer's `dataGrid.moveUp` / `moved`
// still reach the buttons and announcements, whatever `sortableList` says.
provide(
  CuiConfigKey,
  computed(() => {
    const m = messages.value;
    const g = m.dataGrid;
    return { ...m, sortableList: { ...m.sortableList, label: g.columns, moveUp: g.moveUp, moveDown: g.moveDown, moved: g.moved } };
  }),
);

// What the manager lists: units in grid order — a group (its header row, then its leaves) or a
// loose column. A frozen unit is the grid's leftmost block and stays put (#465): it is drawn
// as plain rows with a lock, no handle, no buttons, and is not part of the sortable list, so
// nothing can be dropped in among it. The rest is one CuiSortableList of units, and each group
// holds a second of its leaves: a leaf moves only within its group, a unit as a block.
const frozenCount = computed(() => grid.columnUnits.value.filter(grid.isFrozenUnit).length);
const frozen = computed(() => grid.columnUnits.value.slice(0, frozenCount.value));
const movable = computed(() => grid.columnUnits.value.slice(frozenCount.value));

const indexOfKey = (key: string) => grid.columnState.value.findIndex((cs) => cs.key === key);
const columnOf = (key: string) => grid.columns.find((c) => c.key === key);
const plainLabel = (key: string) => columnOf(key)?.label ?? key;
const fullLabel = (key: string) => {
  const col = columnOf(key);
  return col ? columnLabel(col) : key;
};
// What an item is called out of context ("Reads · A1"), for its handle, buttons and announcements.
const unitName = (u: DataGridColumnUnit) => (u.type === "group" ? u.group.label : fullLabel(u.key));

// A column's visibility checkbox, the same in a frozen row, a loose column and a group's leaf. The
// plain label is what shows (a leaf sits under its group's row); the checkbox is named with its group.
const ColumnCheck: FunctionalComponent<{ columnKey: string }> = ({ columnKey }) =>
  h(
    CuiCheckbox,
    {
      class: "cui-data-grid-column-manager__check",
      modelValue: grid.columnState.value[indexOfKey(columnKey)].visible,
      "onUpdate:modelValue": () => grid.toggleColumnVisibility(columnKey),
    },
    () => [
      h("span", { class: "cui-data-grid-column-manager__name", "aria-hidden": "true", title: plainLabel(columnKey) }, plainLabel(columnKey)),
      h("span", { class: "cui-sr-only" }, fullLabel(columnKey)),
    ],
  );
ColumnCheck.props = ["columnKey"];

// A group's identity across reorders, so its DOM, focus and nested list move with it. The
// group objects are the grid's own, stable for as long as the definitions are.
const groupIds = new WeakMap<DataGridColumnGroup, string>();
let groupCount = 0;
const unitKey = (u: DataGridColumnUnit) => {
  if (u.type === "column") return u.key;
  if (!groupIds.has(u.group)) groupIds.set(u.group, `group:${groupCount++}`);
  return groupIds.get(u.group)!;
};

// The grid's own calls, unchanged: it refuses a frozen move regardless. The list reports the
// order it wants, as a place in its own array; the grid is the one that holds the order.
function onUnitReorder({ from, to }: { from: number; to: number }) {
  grid.reorderUnit(from + frozenCount.value, to + frozenCount.value);
}
function onLeafReorder(keys: string[], { from, to }: { from: number; to: number }) {
  grid.reorderColumns(indexOfKey(keys[from]), indexOfKey(keys[to]));
}
</script>

<template>
  <CuiPopover class="cui-data-grid-column-manager" placement="bottom" width="min(20rem, calc(100vw - 2rem))" :title="messages.dataGrid.columns">
    <CuiButton variant="outline" size="sm">
      <template #prefix><CuiIcon :icon="IconColumns" size="0.875rem" /></template>
      {{ messages.dataGrid.columns }}
    </CuiButton>
    <template #content>
      <div class="cui-data-grid-column-manager__list">
        <template v-for="u in frozen" :key="unitKey(u)">
          <div v-if="u.type === 'group'" class="cui-data-grid-column-manager__row cui-data-grid-column-manager__row--frozen">
            <CuiIcon class="cui-data-grid-column-manager__lock cui-data-grid-column-manager__handle" :icon="IconLock" size="0.875rem" role="img" :aria-label="messages.dataGrid.frozenColumn(unitName(u))" />
            <span class="cui-data-grid-column-manager__group">{{ u.group.label }}</span>
          </div>
          <div
            v-for="key in u.type === 'group' ? u.keys : [u.key]"
            :key="key"
            class="cui-data-grid-column-manager__row cui-data-grid-column-manager__row--frozen"
            :class="u.type === 'group' ? 'cui-data-grid-column-manager__row--leaf' : 'cui-data-grid-column-manager__row--column'"
          >
            <CuiIcon class="cui-data-grid-column-manager__lock cui-data-grid-column-manager__handle" :icon="IconLock" size="0.875rem" role="img" :aria-label="messages.dataGrid.frozenColumn(fullLabel(key))" />
            <ColumnCheck :column-key="key" />
          </div>
        </template>
        <CuiSortableList
          v-if="movable.length"
          class="cui-data-grid-column-manager__units"
          :model-value="movable"
          :item-key="unitKey"
          :item-label="unitName"
          @reorder="onUnitReorder"
        >
          <template #item="{ item }">
            <template v-if="item.type === 'group'">
              <span class="cui-data-grid-column-manager__group">{{ item.group.label }}</span>
              <CuiSortableList
                class="cui-data-grid-column-manager__leaves"
                :model-value="item.keys"
                :item-label="fullLabel"
                :label="item.group.label"
                @reorder="onLeafReorder(item.keys, $event)"
              >
                <template #item="{ item: key }"><ColumnCheck :column-key="key" /></template>
              </CuiSortableList>
            </template>
            <ColumnCheck v-else :column-key="item.key" />
          </template>
        </CuiSortableList>
      </div>
    </template>
  </CuiPopover>
</template>

<style scoped>
/* The column list's paint. Themeable declarations sit inside :where(), so a consumer's plain
   rule, or a --cui-data-grid-column-manager-* token set on :root or <body> (the panel is a
   teleported popover, so a container's token never reaches it), wins; structure stays at normal
   specificity. The reorderable rows are CuiSortableList's: they take the manager's tokens
   through its own, and are restyled to flat rows (no card; a transparent border that shows
   only on the row being dragged). */
.cui-data-grid-column-manager__list {
  display: flex;
  flex-direction: column;
}
:where(.cui-data-grid-column-manager__list) {
  gap: calc(0.125rem * var(--cui-density-scale, 1));
}

:where(.cui-data-grid-column-manager__units, .cui-data-grid-column-manager__leaves) {
  --cui-sortable-list-gap: calc(0.125rem * var(--cui-density-scale, 1));
  --cui-sortable-list-px: var(--cui-data-grid-column-manager-px, 0px);
  --cui-sortable-list-py: calc(0.125rem * var(--cui-density-scale, 1));
  --cui-sortable-list-radius: var(--cui-data-grid-column-manager-radius, 0.25rem);
  --cui-sortable-list-font-size: inherit;
  --cui-sortable-list-border: 1px solid transparent;
}
:where(.cui-data-grid-column-manager__units :deep(.cui-sortable-list__item), .cui-data-grid-column-manager__leaves :deep(.cui-sortable-list__item)) {
  gap: var(--cui-data-grid-column-manager-gap, calc(0.5rem * var(--cui-density-scale, 1)));
}
/* A group's header and leaves stack in its content, so its handle and buttons sit on the header's line. */
.cui-data-grid-column-manager__units :deep(.cui-sortable-list__item:has(.cui-data-grid-column-manager__leaves)) {
  align-items: flex-start;
}
:where(.cui-data-grid-column-manager__units :deep(.cui-sortable-list__item--dragging), .cui-data-grid-column-manager__leaves :deep(.cui-sortable-list__item--dragging)) {
  border-color: var(--cui-data-grid-column-manager-border, var(--cui-border));
}

/* A frozen row: the lock where the handle would be, and no buttons. */
.cui-data-grid-column-manager__row {
  display: flex;
  align-items: center;
}
:where(.cui-data-grid-column-manager__row) {
  gap: var(--cui-data-grid-column-manager-gap, calc(0.5rem * var(--cui-density-scale, 1)));
  padding-block: calc(0.375rem * var(--cui-density-scale, 1));
  padding-inline-start: var(--cui-data-grid-column-manager-px, var(--_data-grid-column-manager-px, 0));
  border-radius: var(--cui-data-grid-column-manager-radius, 0.25rem);
}
/* A frozen group's leaf sits one step in from its group's row. */
.cui-data-grid-column-manager__row--leaf {
  --_data-grid-column-manager-px: calc(1.25rem * var(--cui-density-scale, 1));
}

:where(.cui-data-grid-column-manager__handle) {
  color: var(--cui-text-tertiary);
}
.cui-data-grid-column-manager__handle {
  flex-shrink: 0;
}
/* The lock stands where a handle (1.75rem) would, so a frozen row's checkbox lines up with the rest. */
.cui-data-grid-column-manager__lock {
  box-sizing: content-box;
  padding-inline: 0.4375rem;
}

:where(.cui-data-grid-column-manager__group) {
  font-weight: 600;
}
.cui-data-grid-column-manager__group {
  display: block;
  min-width: 0;
  /* A group's header line is as tall as a handle, so the two read as one row. */
  line-height: 1.75rem;
}
.cui-data-grid-column-manager__row .cui-data-grid-column-manager__group {
  flex: 1;
  line-height: inherit;
}
/* The checkbox and its label are built in the script, outside this component's scope. */
.cui-data-grid-column-manager__list :deep(.cui-data-grid-column-manager__check) {
  display: flex;
  flex: 1;
  /* A long label gives way to the move buttons and ends in an ellipsis; its title has the rest (#556). */
  min-width: 0;
}
.cui-data-grid-column-manager__list :deep(.cui-data-grid-column-manager__name) {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* The label reads at the grid's own cell size (0.875rem, a default-size table), not the
   checkbox's 1rem. */
:where(.cui-data-grid-column-manager__list) {
  --cui-checkbox-font-size: 0.875rem;
}
</style>

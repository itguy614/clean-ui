<script setup lang="ts">
import { computed, nextTick, ref, shallowRef } from "vue";
import { useColumnLabel, useDataGridState } from "../composables/useDataGrid";
import CuiPopover from "./CuiPopover.vue";
import CuiButton from "./CuiButton.vue";
import CuiCheckbox from "./CuiCheckbox.vue";
import CuiIcon from "./CuiIcon.vue";
import { PhLock } from "@phosphor-icons/vue";
import type { DataGridColumnGroup } from "../types/data-grid";
import { useMessages } from "../composables/useMessages";

const messages = useMessages();

const grid = useDataGridState();
const columnLabel = useColumnLabel();

// What the manager lists: a group's header row, then its leaves; or a loose column. A
// row's `unit` is its place in grid.columnUnits — what moving a group or loose column moves.
type Row =
  | { kind: "group"; id: string; unit: number; group: DataGridColumnGroup }
  | { kind: "leaf"; id: string; unit: number; key: string; group: DataGridColumnGroup }
  | { kind: "column"; id: string; unit: number; key: string };

const rows = computed<Row[]>(() =>
  grid.columnUnits.value.flatMap((u, unit): Row[] =>
    u.type === "group"
      ? [
          { kind: "group", id: `group:${unit}`, unit, group: u.group },
          ...u.keys.map((key): Row => ({ kind: "leaf", id: key, unit, key, group: u.group })),
        ]
      : [{ kind: "column", id: u.key, unit, key: u.key }],
  ),
);

// What a row shows: a leaf is indented under its group's header row, so just its own label.
function getLabel(key: string): string {
  return grid.columns.find((c) => c.key === key)?.label ?? key;
}
const fullLabel = (key: string) => {
  const col = grid.columns.find((c) => c.key === key);
  return col ? columnLabel(col) : key;
};

// What it is called out of context ("Reads · A1"): "A1" alone repeats per group, and a screen
// reader user hears a leaf's checkbox and buttons without the header row.
function nameOf(row: Row): string {
  if (row.kind === "group") return row.group.label;
  return fullLabel(row.key);
}

// A frozen column (or a group, which is frozen wholly) is the grid's leftmost block and stays
// put: no handle, no move buttons, and nothing is dropped in among them (#465). The grid's own
// state refuses it too.
function isFrozenRow(row: Row): boolean {
  return row.kind === "group" ? grid.isFrozenUnit(grid.columnUnits.value[row.unit]) : grid.isFrozen(row.key);
}
const frozenUnits = computed(() => grid.columnUnits.value.filter(grid.isFrozenUnit).length);
const indexOfKey = (key: string) => grid.columnState.value.findIndex((cs) => cs.key === key);

// A leaf sits one step in from its group's row; a group row and a loose column sit flush.
const LEAF_INDENT = { "--_data-grid-column-manager-px": "calc(1.25rem * var(--cui-density-scale, 1))" };

// --- Drag ---
// A leaf moves only among its own group's leaves; a group or a loose column moves among the
// groups and loose columns. Anything else is refused here too (no indicator, dropEffect none),
// though the grid's own state refuses it regardless.
// shallowRef: a deep ref would hand back a reactive proxy of a row's group, which is never
// `===` the group the rows computed holds, so no leaf would ever accept a drop.
const dragging = shallowRef<Row | null>(null);
const dropId = ref<string | null>(null);

function canDrop(target: Row): boolean {
  const from = dragging.value;
  if (!from || from.id === target.id || isFrozenRow(target)) return false;
  if (from.kind === "leaf") return target.kind === "leaf" && target.group === from.group;
  return target.kind !== "leaf";
}

function onDragStart(e: DragEvent, row: Row) {
  dragging.value = row;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", row.id);
  }
}

function onDragOver(e: DragEvent, row: Row) {
  const ok = canDrop(row);
  if (e.dataTransfer) e.dataTransfer.dropEffect = ok ? "move" : "none";
  if (ok) e.preventDefault();
  dropId.value = ok ? row.id : null;
}

function onDragLeave() {
  dropId.value = null;
}

function onDrop(e: DragEvent, target: Row) {
  e.preventDefault();
  const from = dragging.value;
  if (from && canDrop(target)) {
    if (from.kind === "leaf" && target.kind === "leaf") grid.reorderColumns(indexOfKey(from.key), indexOfKey(target.key));
    else grid.reorderUnit(from.unit, target.unit);
  }
  onDragEnd();
}

function onDragEnd() {
  dragging.value = null;
  dropId.value = null;
}

// --- Keyboard: dragging alone would leave the order out of reach (WCAG 2.5.7) ---
const announcement = ref("");

/** 1-based place among siblings: a leaf among its group's, anything else among the units. */
function place(row: Row): [number, number] {
  if (row.kind === "leaf") {
    const unit = grid.columnUnits.value[row.unit];
    const keys = unit?.type === "group" ? unit.keys : [];
    return [keys.indexOf(row.key) + 1, keys.length];
  }
  return [row.unit + 1, grid.columnUnits.value.length];
}

function move(row: Row, delta: -1 | 1) {
  if (row.kind === "group") grid.moveGroup(row.group, delta);
  else grid.moveColumn(row.key, delta);
  // A group's id is its unit's place, which just changed: find the row again.
  const now = rows.value.find((r) =>
    row.kind === "group" ? r.kind === "group" && r.group === row.group : r.id === row.id,
  );
  if (!now) return;
  const [position, total] = place(now);
  announcement.value = messages.value.dataGrid.moved(nameOf(row), position, total);
  // The row's DOM node moved, which drops focus: give it back, on the other arrow at an edge.
  nextTick(() => {
    const want = delta === -1 ? (position > 1 ? "up" : "down") : position < total ? "down" : "up";
    document.querySelector<HTMLElement>(`[data-cui-move="${now.id}:${want}"]`)?.focus();
  });
}

// The first place a row can take: after the frozen block, for anything not within a group.
const isFirst = (row: Row) => (row.kind === "leaf" ? place(row)[0] === 1 : row.unit <= frozenUnits.value);
const isLast = (row: Row) => place(row)[0] === place(row)[1];
</script>

<template>
  <CuiPopover class="cui-data-grid-column-manager" placement="bottom" width="240px" :title="messages.dataGrid.columns">
    <CuiButton variant="outline" size="sm">
      <template #prefix><CuiIcon name="columns" size="0.875rem" /></template>
      {{ messages.dataGrid.columns }}
    </CuiButton>
    <template #content>
      <div class="cui-data-grid-column-manager__list">
        <div
          v-for="row in rows"
          :key="row.id"
          class="cui-data-grid-column-manager__row"
          :class="[
            `cui-data-grid-column-manager__row--${row.kind}`,
            {
              'cui-data-grid-column-manager__row--frozen': isFrozenRow(row),
              'cui-data-grid-column-manager__row--dragging': dragging?.id === row.id,
              'cui-data-grid-column-manager__row--drop': dropId === row.id,
            },
          ]"
          :draggable="isFrozenRow(row) ? 'false' : 'true'"
          :style="row.kind === 'leaf' ? LEAF_INDENT : undefined"
          @dragstart="onDragStart($event, row)"
          @dragover="onDragOver($event, row)"
          @dragleave="onDragLeave"
          @drop="onDrop($event, row)"
          @dragend="onDragEnd"
        >
          <CuiIcon
            v-if="isFrozenRow(row)"
            class="cui-data-grid-column-manager__lock cui-data-grid-column-manager__handle"
            :icon="PhLock"
            size="0.875rem"
            role="img"
            :aria-label="messages.dataGrid.frozenColumn(nameOf(row))"
          />
          <CuiIcon v-else class="cui-data-grid-column-manager__handle" name="dots-six-vertical" size="0.875rem" />
          <span v-if="row.kind === 'group'" class="cui-data-grid-column-manager__group">{{ row.group.label }}</span>
          <CuiCheckbox
            v-else
            class="cui-data-grid-column-manager__check"
            :model-value="grid.columnState.value[indexOfKey(row.key)].visible"
            @update:model-value="grid.toggleColumnVisibility(row.key)"
          >
            <!-- The plain label is what shows; the checkbox is named with its group -->
            <span aria-hidden="true">{{ getLabel(row.key) }}</span>
            <span class="cui-sr-only">{{ nameOf(row) }}</span>
          </CuiCheckbox>
          <span v-if="!isFrozenRow(row)" class="cui-data-grid-column-manager__actions">
            <CuiButton
              variant="ghost"
              size="xs"
              :disabled="isFirst(row)"
              :data-cui-move="`${row.id}:up`"
              :aria-label="messages.dataGrid.moveUp(nameOf(row))"
              @click="move(row, -1)"
            >
              <CuiIcon name="caret-up" size="0.875rem" aria-hidden="true" />
            </CuiButton>
            <CuiButton
              variant="ghost"
              size="xs"
              :disabled="isLast(row)"
              :data-cui-move="`${row.id}:down`"
              :aria-label="messages.dataGrid.moveDown(nameOf(row))"
              @click="move(row, 1)"
            >
              <CuiIcon name="caret-down" size="0.875rem" aria-hidden="true" />
            </CuiButton>
          </span>
        </div>
        <span class="cui-sr-only" role="status" aria-live="polite" aria-atomic="true">{{ announcement }}</span>
      </div>
    </template>
  </CuiPopover>
</template>

<style scoped>
/* The column list's paint. Themeable declarations sit inside :where(), so a consumer's plain
   rule, or a --cui-data-grid-column-manager-* token set on :root or <body> (the panel is a
   teleported popover, so a container's token never reaches it), wins; structure stays at normal
   specificity. State rules follow their base rules, since at zero specificity the source order
   decides. A leaf is indented under its group's row through --_data-grid-column-manager-px,
   which the component emits on that row only. */
.cui-data-grid-column-manager__list {
  display: flex;
  flex-direction: column;
}
:where(.cui-data-grid-column-manager__list) {
  gap: calc(0.125rem * var(--cui-density-scale, 1));
}

.cui-data-grid-column-manager__row {
  display: flex;
  align-items: center;
  cursor: grab;
}
:where(.cui-data-grid-column-manager__row) {
  gap: var(--cui-data-grid-column-manager-gap, calc(0.5rem * var(--cui-density-scale, 1)));
  padding-block: calc(0.375rem * var(--cui-density-scale, 1));
  padding-inline-start: var(--cui-data-grid-column-manager-px, var(--_data-grid-column-manager-px, 0));
  border-radius: var(--cui-data-grid-column-manager-radius, 0.25rem);
  /* The drop indicator's line: always there, transparent, so a row never shifts when one lands. */
  border-top: 2px solid transparent;
}
.cui-data-grid-column-manager__row--frozen {
  cursor: default;
}
/* Being dragged, and the row it would drop in front of. */
:where(.cui-data-grid-column-manager__row--dragging) {
  opacity: 0.5;
}
:where(.cui-data-grid-column-manager__row--drop) {
  border-top-color: var(--cui-data-grid-column-manager-border, var(--cui-primary));
}

:where(.cui-data-grid-column-manager__handle) {
  color: var(--cui-text-tertiary);
}
.cui-data-grid-column-manager__handle {
  flex-shrink: 0;
}

:where(.cui-data-grid-column-manager__group) {
  font-weight: 600;
}
.cui-data-grid-column-manager__group,
.cui-data-grid-column-manager__check {
  flex: 1;
}

.cui-data-grid-column-manager__actions {
  display: flex;
  flex-shrink: 0;
}
</style>

<script setup lang="ts">
import { computed, nextTick, ref, shallowRef } from "vue";
import { useDataGridState } from "../composables/useDataGrid";
import CuiPopover from "./CuiPopover.vue";
import CuiButton from "./CuiButton.vue";
import CuiCheckbox from "./CuiCheckbox.vue";
import CuiIcon from "./CuiIcon.vue";
import { PhLock } from "@phosphor-icons/vue";
import type { DataGridColumnGroup } from "../types/data-grid";
import { useMessages } from "../composables/useMessages";

const messages = useMessages();

const grid = useDataGridState();

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

// What it is called out of context ("Reads · A1"): "A1" alone repeats per group, and a screen
// reader user hears a leaf's checkbox and buttons without the header row.
function nameOf(row: Row): string {
  if (row.kind === "group") return row.group.label;
  const label = getLabel(row.key);
  return row.kind === "leaf" ? messages.value.dataGrid.groupedColumn(row.group.label, label) : label;
}

// A frozen column (or a group, which is frozen wholly) is the grid's leftmost block and stays
// put: no handle, no move buttons, and nothing is dropped in among them (#465). The grid's own
// state refuses it too.
function isFrozenRow(row: Row): boolean {
  if (row.kind !== "group") return grid.isFrozen(row.key);
  const unit = grid.columnUnits.value[row.unit];
  return unit?.type === "group" && unit.keys.some(grid.isFrozen);
}
const frozenUnits = computed(
  () => grid.columnUnits.value.filter((u) => (u.type === "group" ? u.keys : [u.key]).some(grid.isFrozen)).length,
);
const indexOfKey = (key: string) => grid.columnState.value.findIndex((cs) => cs.key === key);

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
      <div class="cui-data-grid-column-manager__list" style="display: flex; flex-direction: column; gap: calc(0.125rem * var(--cui-density-scale, 1));">
        <div
          v-for="row in rows"
          :key="row.id"
          class="cui-data-grid-column-manager__row"
          :class="[`cui-data-grid-column-manager__row--${row.kind}`, { 'cui-data-grid-column-manager__row--frozen': isFrozenRow(row) }]"
          :draggable="isFrozenRow(row) ? 'false' : 'true'"
          style="display: flex; align-items: center; gap: calc(0.5rem * var(--cui-density-scale, 1)); padding: calc(0.375rem * var(--cui-density-scale, 1)) 0; border-radius: 0.25rem;"
          :style="{
            cursor: isFrozenRow(row) ? 'default' : 'grab',
            opacity: dragging?.id === row.id ? 0.5 : 1,
            borderTop: dropId === row.id ? '2px solid var(--cui-primary)' : '2px solid transparent',
            paddingInlineStart: row.kind === 'leaf' ? 'calc(1.25rem * var(--cui-density-scale, 1))' : undefined,
          }"
          @dragstart="onDragStart($event, row)"
          @dragover="onDragOver($event, row)"
          @dragleave="onDragLeave"
          @drop="onDrop($event, row)"
          @dragend="onDragEnd"
        >
          <CuiIcon
            v-if="isFrozenRow(row)"
            class="cui-data-grid-column-manager__lock"
            :icon="PhLock"
            size="0.875rem"
            role="img"
            :aria-label="messages.dataGrid.frozenColumn(nameOf(row))"
            style="color: var(--cui-text-tertiary); flex-shrink: 0;"
          />
          <CuiIcon v-else name="dots-six-vertical" size="0.875rem" style="color: var(--cui-text-tertiary); flex-shrink: 0;" />
          <span v-if="row.kind === 'group'" class="cui-data-grid-column-manager__group" style="flex: 1; font-weight: 600;">{{ row.group.label }}</span>
          <CuiCheckbox
            v-else
            style="flex: 1;"
            :model-value="grid.columnState.value[indexOfKey(row.key)].visible"
            @update:model-value="grid.toggleColumnVisibility(row.key)"
          >
            <!-- The plain label is what shows; the checkbox is named with its group -->
            <span aria-hidden="true">{{ getLabel(row.key) }}</span>
            <span class="cui-sr-only">{{ nameOf(row) }}</span>
          </CuiCheckbox>
          <span v-if="!isFrozenRow(row)" style="display: flex; flex-shrink: 0;">
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

<script setup lang="ts">
import { useColumnLabel, useDataGridState } from "../composables/useDataGrid";
import type { DataGridRow } from "../types/data-grid";
import CuiGrid from "./CuiGrid.vue";

const props = defineProps<{
  rowKey?: string;
}>();

const grid = useDataGridState();
const labelOf = useColumnLabel();

// A column's label with its group ("Reads · A1"): a leaf label alone repeats per group.
function columnLabel(key: string): string {
  const col = grid.columns.find((c) => c.key === key);
  return col ? labelOf(col) : key;
}

function getRowId(row: DataGridRow): string {
  return String(row[props.rowKey ?? "id"] ?? "");
}
</script>

<template>
  <CuiGrid class="cui-data-grid-card-view" :cols="{ sm: 1, md: 2, lg: 3 }" gap="4">
    <div v-for="row in grid.displayData.value" :key="getRowId(row)">
      <slot name="card" :row="row" :column-label="columnLabel" />
    </div>
  </CuiGrid>
</template>

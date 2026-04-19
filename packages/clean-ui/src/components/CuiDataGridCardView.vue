<script setup lang="ts">
import { useDataGridState } from "../composables/useDataGrid";
import type { DataGridRow } from "../types/data-grid";
import CuiGrid from "./CuiGrid.vue";

const props = defineProps<{
  rowKey?: string;
}>();

const grid = useDataGridState();

function getRowId(row: DataGridRow): string {
  return String(row[props.rowKey ?? "id"] ?? "");
}
</script>

<template>
  <CuiGrid :cols="{ sm: 1, md: 2, lg: 3 }" gap="4">
    <div v-for="row in grid.displayData.value" :key="getRowId(row)">
      <slot name="card" :row="row" />
    </div>
  </CuiGrid>
</template>

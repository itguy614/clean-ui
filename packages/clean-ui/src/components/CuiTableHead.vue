<script setup lang="ts">
import { provide } from "vue";
import { TableSectionContextKey } from "./table-context";
import type { HideableProps } from "../types/common";

export interface CuiTableHeadProps extends HideableProps {
}

withDefaults(defineProps<CuiTableHeadProps>(), {
  hidden: false,
});

provide(TableSectionContextKey, { isHead: true });

// Sticky header is pinned at the CELL level (each th/td gets position: sticky;
// top: 0), NOT on the <thead>. A sticky <thead> + sticky cells is a nested
// same-axis sticky, which detaches sticky-column header cells from the header's
// vertical pinning. See `.cui-table--sticky-header thead th` and, for the data
// grid (td-based headers), CuiDataGridTable's headerCellStyle.
</script>

<template>
  <thead v-show="!hidden">
    <slot />
  </thead>
</template>

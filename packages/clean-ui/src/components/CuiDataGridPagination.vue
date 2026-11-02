<script setup lang="ts">
import { useDataGridState } from "../composables/useDataGrid";
import CuiPagination from "./CuiPagination.vue";

const grid = useDataGridState();

// No navigate of its own: CuiDataGrid's watcher on page and page size emits it, once (#372).
function onPageChange(val: number) {
  grid.setPage(val);
}

function onPerPageChange(val: number) {
  grid.setPerPage(val);
}
</script>

<template>
  <CuiPagination
    class="cui-data-grid-pagination"
    :current-page="grid.paginationMeta.value.current_page"
    :total-pages="grid.paginationMeta.value.last_page"
    :per-page="grid.paginationMeta.value.per_page"
    :total="grid.paginationMeta.value.total"
    size="sm"
    @update:current-page="onPageChange"
    @update:per-page="onPerPageChange"
  />
</template>

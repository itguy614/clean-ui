<script setup lang="ts">
import { useDataGridState } from "../composables/useDataGrid";
import CuiPagination from "./CuiPagination.vue";

const grid = useDataGridState();

const emit = defineEmits<{
  navigate: [];
}>();

function onPageChange(val: number) {
  grid.setPage(val);
  emit("navigate");
}

function onPerPageChange(val: number) {
  grid.setPerPage(val);
  emit("navigate");
}
</script>

<template>
  <CuiPagination
    :current-page="grid.paginationMeta.value.current_page"
    :total-pages="grid.paginationMeta.value.last_page"
    :per-page="grid.paginationMeta.value.per_page"
    :total="grid.paginationMeta.value.total"
    size="sm"
    @update:current-page="onPageChange"
    @update:per-page="onPerPageChange"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useDataGridState } from "../composables/useDataGrid";
import CuiBadge from "./CuiBadge.vue";
import CuiButton from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";

const grid = useDataGridState();

const activeFilters = computed(() =>
  grid.filters.value.map((f) => {
    const col = grid.columns.find((c) => (c.filterKey ?? c.key) === f.key);
    const label = col?.label ?? f.key;
    const displayValue = Array.isArray(f.value) ? f.value.join(", ") : f.value;
    return { key: f.key, label, displayValue };
  }),
);
</script>

<template>
  <div v-if="activeFilters.length > 0" class="cui-data-grid-active-filters">
    <CuiBadge
      v-for="filter in activeFilters"
      :key="filter.key"
      variant="subtle"
      color="primary"
      size="sm"
      removable
      @remove="grid.removeFilter(filter.key)"
    >
      {{ filter.label }}: {{ filter.displayValue }}
    </CuiBadge>
    <CuiButton v-if="activeFilters.length > 1" variant="ghost" size="xs" @click="grid.clearFilters()">
      Clear all
    </CuiButton>
  </div>
</template>

<style>
.cui-data-grid-active-filters {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
}
</style>

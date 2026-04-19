<script setup lang="ts">
import { ref, watch } from "vue";
import { useDataGridState } from "../composables/useDataGrid";
import CuiInput from "./CuiInput.vue";
import CuiIcon from "./CuiIcon.vue";
import CuiButton from "./CuiButton.vue";

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const grid = useDataGridState();
const localQuery = ref(grid.searchQuery.value);

watch(
  () => grid.searchQuery.value,
  (val) => { localQuery.value = val; },
);

function onInput(val: string | number) {
  localQuery.value = String(val);
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    grid.search(localQuery.value);
  }, 300);
}

function onClear() {
  localQuery.value = "";
  grid.clearSearch();
}
</script>

<template>
  <div style="position: relative; max-width: 20rem; flex: 1;">
    <CuiInput
      :model-value="localQuery"
      placeholder="Search..."
      size="sm"
      @update:model-value="onInput"
      @keydown.escape="onClear"
    >
      <template #prefix>
        <CuiIcon name="magnifying-glass" size="0.875rem" />
      </template>
      <template v-if="localQuery" #suffix>
        <CuiButton variant="ghost" size="xs" @click="onClear" style="margin: -0.25rem;">
          <CuiIcon name="x" size="0.75rem" />
        </CuiButton>
      </template>
    </CuiInput>
  </div>
</template>

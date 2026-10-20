<script setup lang="ts">
import { onScopeDispose, ref, watch } from "vue";
import { useDataGridState, DEFAULT_SEARCH_DEBOUNCE } from "../composables/useDataGrid";
import CuiInput from "./CuiInput.vue";
import CuiIcon from "./CuiIcon.vue";
import CuiButton from "./CuiButton.vue";
import { useMessages } from "../composables/useMessages";

export interface CuiDataGridSearchProps {
  /** ms after the last keystroke; 0 searches at once. */
  debounce?: number;
}

const props = withDefaults(defineProps<CuiDataGridSearchProps>(), {
  debounce: DEFAULT_SEARCH_DEBOUNCE,
});

const messages = useMessages();
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
  if (props.debounce <= 0) {
    grid.search(localQuery.value);
    return;
  }
  debounceTimer = setTimeout(() => {
    grid.search(localQuery.value);
  }, props.debounce);
}

// A pending search mustn't run against a grid that has gone.
onScopeDispose(() => {
  if (debounceTimer) clearTimeout(debounceTimer);
});

function onClear() {
  // A search still waiting would run after the clear and undo it.
  if (debounceTimer) clearTimeout(debounceTimer);
  localQuery.value = "";
  grid.clearSearch();
}
</script>

<template>
  <div class="cui-data-grid-search" style="position: relative; max-width: 20rem; flex: 1;">
    <CuiInput
      :model-value="localQuery"
      :placeholder="messages.dataGrid.search"
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

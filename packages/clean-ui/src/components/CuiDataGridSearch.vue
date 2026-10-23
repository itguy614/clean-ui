<script setup lang="ts">
import { computed, onScopeDispose, ref, watch } from "vue";
import { useDataGridState, DEFAULT_SEARCH_DEBOUNCE } from "../composables/useDataGrid";
import CuiInput from "./CuiInput.vue";
import CuiIcon from "./CuiIcon.vue";
import { useMessages } from "../composables/useMessages";
import { useCuiId } from "../composables/useCuiId";

export interface CuiDataGridSearchProps {
  /** ms after the last keystroke; 0 searches at once. */
  debounce?: number;
  /** The search box's accessible name (#373). Defaults to the `dataGrid.searchLabel` message. */
  label?: string;
}

const props = withDefaults(defineProps<CuiDataGridSearchProps>(), {
  debounce: DEFAULT_SEARCH_DEBOUNCE,
});

const messages = useMessages();
// A placeholder is no name (WCAG 1.3.1, 4.1.2): a visually hidden label names the box.
const labelId = useCuiId("grid-search-label");
const name = computed(
  () => props.label ?? messages.value.dataGrid.searchLabel ?? messages.value.dataGrid.search.replace(/[\s.…]+$/u, ""),
);
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
    <span :id="labelId" class="cui-sr-only">{{ name }}</span>
    <CuiInput
      :model-value="localQuery"
      :aria-labelledby="labelId"
      :placeholder="messages.dataGrid.search"
      size="sm"
      clearable
      @update:model-value="onInput"
      @clear="onClear"
      @keydown.escape="onClear"
    >
      <template #prefix>
        <CuiIcon name="magnifying-glass" size="0.875rem" />
      </template>
    </CuiInput>
  </div>
</template>

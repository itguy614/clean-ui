<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useDataGridState } from "../composables/useDataGrid";
import type { DataGridBulkAction, DataGridRow } from "../types/data-grid";
import CuiButton from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";
import { useMessages } from "../composables/useMessages";
import { usePresence } from "../composables/usePresence";
import { panelTransition } from "../utils/motion";

const messages = useMessages();

const props = defineProps<{
  actions: DataGridBulkAction[];
}>();

const emit = defineEmits<{
  "bulk-action": [payload: { action: DataGridBulkAction; rows: DataGridRow[] }];
}>();

const grid = useDataGridState();

const selectedCount = computed(() => grid.selectedRows.value.size);
const isVisible = computed(() => selectedCount.value > 0);
// A panel's enter and exit (#269): a transition on a state, so selecting a row again while
// the bar leaves turns the same bar back, rather than dropping it and sliding a new one in.
const { present, onAfterLeave } = usePresence(() => isVisible.value);
// The bar stays rendered while it leaves: keep counting what was selected, not "0".
const shownCount = ref(0);
watch(selectedCount, (n) => {
  if (n > 0) shownCount.value = n;
}, { immediate: true });

function getSelectedRows(): DataGridRow[] {
  return grid.displayData.value.filter((row) =>
    grid.selectedRows.value.has(String(row.id ?? "")),
  );
}

function onAction(action: DataGridBulkAction) {
  emit("bulk-action", { action, rows: getSelectedRows() });
}
</script>

<template>
  <Transition v-bind="panelTransition" @after-leave="onAfterLeave">
    <div v-if="present" v-show="isVisible" class="cui-data-grid-bulk-bar">
      <div class="cui-data-grid-bulk-bar__inner">
        <span class="cui-data-grid-bulk-bar__count">
          {{ messages.dataGrid.selected(shownCount) }}
        </span>

        <div class="cui-data-grid-bulk-bar__actions">
          <CuiButton
            v-for="action in actions"
            :key="action.key"
            size="xs"
            :variant="action.variant === 'destructive' ? 'solid' : 'outline'"
            :color="action.variant === 'destructive' ? 'error' : 'primary'"
            @click="onAction(action)"
          >
            {{ action.label }}
          </CuiButton>
        </div>

        <CuiButton
          variant="ghost"
          size="xs"
          @click="grid.clearSelection()"
          style="margin-left: auto;"
        >
          <template #prefix><CuiIcon name="x" size="0.75rem" /></template>
          {{ messages.clear }}
        </CuiButton>
      </div>
    </div>
  </Transition>
</template>

<style>
.cui-data-grid-bulk-bar {
  position: sticky;
  bottom: 0;
  z-index: 20;
  padding: calc(0.5rem * var(--cui-density-scale, 1));
}

.cui-data-grid-bulk-bar__inner {
  display: flex;
  align-items: center;
  gap: calc(0.75rem * var(--cui-density-scale, 1));
  padding: calc(0.5rem * var(--cui-density-scale, 1)) calc(0.75rem * var(--cui-density-scale, 1));
  /* Subtle-first (per the library's guiding principle): a tinted primary surface
     rather than a solid hero-color background, so the outline action buttons keep
     full contrast. All three slots auto-swap for dark mode. */
  background: var(--cui-primary-bg);
  border: 1px solid var(--cui-primary-border);
  color: var(--cui-primary);
  border-radius: var(--cui-button-radius, var(--cui-radius-md, 0.375rem));
  box-shadow: 0 -2px 12px rgb(0 0 0 / 0.15);
  max-width: 48rem;
  margin: 0 auto;
}

.cui-data-grid-bulk-bar__count {
  font-size: 0.8125rem;
  font-weight: 500;
  white-space: nowrap;
}

.cui-data-grid-bulk-bar__actions {
  display: flex;
  gap: calc(0.375rem * var(--cui-density-scale, 1));
}

/* Enter and exit: the shared panel motion (components-shared.css), which leaves over the
   fast duration and drops the movement under reduced motion. It rises from below rather
   than scaling. */
.cui-data-grid-bulk-bar[data-cui-panel="hidden"] {
  transform: translateY(100%);
}
</style>

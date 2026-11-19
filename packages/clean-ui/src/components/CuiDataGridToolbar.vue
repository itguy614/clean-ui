<script setup lang="ts">
import { computed, nextTick, useTemplateRef, watch } from "vue";
import { useDataGridState } from "../composables/useDataGrid";
import type { DataGridViewAdapter } from "../types/data-grid";
import CuiDataGridSearch from "./CuiDataGridSearch.vue";
import CuiDataGridColumnManager from "./CuiDataGridColumnManager.vue";
import CuiDataGridViewToggle from "./CuiDataGridViewToggle.vue";
import CuiDataGridViewManager from "./CuiDataGridViewManager.vue";
import CuiButton from "./CuiButton.vue";
import CuiDataGridFilterPanel from "./CuiDataGridFilterPanel.vue";
import CuiPopover from "./CuiPopover.vue";
import CuiIcon from "./CuiIcon.vue";
import CuiBadge from "./CuiBadge.vue";
import CuiToolbar from "./CuiToolbar.vue";
import { useMessages } from "../composables/useMessages";
import { IconFunnel } from "../icons/generated/funnel";

const messages = useMessages();

const props = defineProps<{
  hideSearch?: boolean;
  searchDebounce?: number;
  searchLabel?: string;
  hideColumnManager?: boolean;
  hideFilterToggle?: boolean;
  hideViewToggle?: boolean;
  hasCardSlot?: boolean;
  gridId?: string;
  /** The filter panel's element id: the Filters button's `aria-controls`. */
  filterPanelId?: string;
  viewAdapter?: DataGridViewAdapter;
}>();

const grid = useDataGridState();

const activeFilterCount = computed(() => grid.filters.value.length);

// Unpinned, the panel is a popover from the Filters button; pinned, it is the inline column
// beside the table (CuiDataGrid renders that one) and the button just toggles it (#552).
const popoverOpen = computed(() => grid.filterPanelOpen.value && !grid.filterPanelPinned.value);
const filterButton = useTemplateRef<InstanceType<typeof CuiButton>>("filterButton");

function onFilterButtonClick() {
  // Unpinned, the popover's own click handling opens and closes it (through `setPopoverOpen`).
  if (grid.filterPanelPinned.value) grid.toggleFilterPanel();
}

function setPopoverOpen(open: boolean) {
  if (open !== grid.filterPanelOpen.value) grid.toggleFilterPanel();
}

// The popover leaving: focus returns to the Filters button, unless the press that closed it
// landed on something else focusable. Pinned from the popover, the panel moves inline and
// takes focus on its pin button, which is where the pointer or keyboard just was.
watch(popoverOpen, async (open, was) => {
  if (open || !was) return;
  // Taken now, before the panel leaves: only a user who was in it has focus to carry over.
  const inPanel = !!document.activeElement?.closest(".cui-data-grid-filter-panel--popover");
  // Pinned or closed is decided now, not after the waits: it may have been reopened by then.
  const pinned = grid.filterPanelOpen.value && grid.filterPanelPinned.value;
  await nextTick();
  // A press that closed it is still being handled (the browser moves focus after mousedown): wait it out.
  await new Promise((resolve) => setTimeout(resolve));
  const panel = props.filterPanelId ? document.getElementById(props.filterPanelId) : null;
  if (pinned) {
    // Pinned (by the pin button, or a loaded view): follow focus only if it was in the panel.
    if (inPanel) panel?.querySelector<HTMLElement>(".cui-data-grid-filter-panel__pin")?.focus({ preventScroll: true });
    return;
  }
  const active = document.activeElement;
  if (!active || active === document.body || panel?.contains(active)) filterButton.value?.focus();
});
</script>

<template>
  <!-- One tab stop for the grid's buttons (#190). The search box is not an item: it keeps
       its own tab stop and its own arrow keys. -->
  <CuiToolbar class="cui-data-grid-toolbar" :label="messages.dataGrid.toolbar">
    <div class="cui-data-grid-toolbar__start">
      <slot name="toolbar-start" />
      <CuiDataGridSearch v-if="!hideSearch" :debounce="searchDebounce" :label="searchLabel" />
    </div>
    <div class="cui-data-grid-toolbar__end">
      <slot name="toolbar-end" />

      <!-- Filter toggle: a popover trigger while unpinned (the popover opens it on click, and is
           `disabled` while pinned, when the button toggles the inline panel instead) -->
      <CuiPopover
        v-if="!hideFilterToggle && grid.filterableColumns.value.length > 0"
        class="cui-data-grid-toolbar__filters"
        placement="bottom"
        no-arrow
        width="16rem"
        :label="messages.dataGrid.filters"
        :closable="false"
        :disabled="grid.filterPanelPinned.value"
        :visible="popoverOpen"
        @update:visible="setPopoverOpen"
      >
        <CuiButton
          ref="filterButton"
          variant="outline"
          size="sm"
          :aria-haspopup="grid.filterPanelPinned.value ? undefined : 'dialog'"
          :aria-expanded="grid.filterPanelOpen.value"
          :aria-controls="grid.filterPanelOpen.value ? filterPanelId : undefined"
          :style="{ background: grid.filterPanelOpen.value ? 'var(--cui-primary-bg)' : undefined }"
          @click="onFilterButtonClick"
        >
          <template #prefix><CuiIcon :icon="IconFunnel" size="0.875rem" /></template>
          {{ messages.dataGrid.filters }}
          <CuiBadge
            v-if="activeFilterCount > 0"
            color="primary"
            size="sm"
            style="margin-left: 0.25rem;"
          >
            {{ activeFilterCount }}
          </CuiBadge>
        </CuiButton>
        <template #content>
          <CuiDataGridFilterPanel popover :id="filterPanelId" />
        </template>
      </CuiPopover>

      <CuiDataGridColumnManager v-if="!hideColumnManager" />

      <!-- View toggle (grid/card) -->
      <CuiDataGridViewToggle v-if="!hideViewToggle && hasCardSlot" />

      <!-- Saved views -->
      <CuiDataGridViewManager
        v-if="gridId"
        :grid-id="gridId"
        :adapter="viewAdapter"
      />
    </div>
  </CuiToolbar>
</template>

<style>
.cui-data-grid-toolbar {
  --_toolbar-gap: calc(0.75rem * var(--cui-density-scale, 1));
}

.cui-data-grid-toolbar__start {
  display: flex;
  align-items: center;
  gap: calc(0.75rem * var(--cui-density-scale, 1));
  flex: 1;
  min-width: 0;
}

.cui-data-grid-toolbar__end {
  display: flex;
  align-items: center;
  gap: calc(0.5rem * var(--cui-density-scale, 1));
  flex-shrink: 0;
}
</style>

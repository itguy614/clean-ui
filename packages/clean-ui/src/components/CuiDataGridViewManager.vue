<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useDataGridState } from "../composables/useDataGrid";
import { useDataGridViews } from "../composables/useDataGridViews";
import type { DataGridViewAdapter } from "../types/data-grid";
import CuiDropdown from "./CuiDropdown.vue";
import CuiDropdownTrigger from "./CuiDropdownTrigger.vue";
import CuiDropdownMenu from "./CuiDropdownMenu.vue";
import CuiDropdownItem from "./CuiDropdownItem.vue";
import CuiDropdownDivider from "./CuiDropdownDivider.vue";
import CuiDropdownHeader from "./CuiDropdownHeader.vue";
import CuiButton from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";
import CuiInput from "./CuiInput.vue";
import CuiBadge from "./CuiBadge.vue";
import { useMessages } from "../composables/useMessages";
import { useCuiId } from "../composables/useCuiId";
import { IconArrowCounterClockwise } from "../icons/generated/arrow-counter-clockwise";
import { IconBookmarkSimple } from "../icons/generated/bookmark-simple";
import { IconCheck } from "../icons/generated/check";
import { IconFloppyDisk } from "../icons/generated/floppy-disk";
import { IconTrash } from "../icons/generated/trash";

// The save-as field's name: its placeholder is none (#373).
const viewNameId = useCuiId("grid-view-name");
const messages = useMessages();

const props = defineProps<{
  gridId: string;
  adapter?: DataGridViewAdapter;
}>();

const grid = useDataGridState();
const viewManager = useDataGridViews({
  gridId: props.gridId,
  adapter: props.adapter,
});

const showSaveAs = ref(false);
const newViewName = ref("");
const saving = ref(false);

onMounted(() => {
  viewManager.fetchViews();
});

function onLoadView(viewId: string) {
  const view = viewManager.views.value.find((v) => v.id === viewId);
  if (view) {
    grid.loadConfig(view.config);
    viewManager.selectView(viewId);
  }
}

async function onSaveCurrent() {
  if (!viewManager.activeViewId.value) return;
  saving.value = true;
  try {
    await viewManager.updateView(viewManager.activeViewId.value, grid.getConfig());
    grid.markClean();
  } finally {
    saving.value = false;
  }
}

async function onSaveAs() {
  if (!newViewName.value.trim()) return;
  saving.value = true;
  try {
    await viewManager.saveView(newViewName.value.trim(), grid.getConfig());
    grid.markClean();
    newViewName.value = "";
    showSaveAs.value = false;
  } finally {
    saving.value = false;
  }
}

async function onRemove(viewId: string) {
  await viewManager.removeView(viewId);
}

function onReset() {
  grid.resetToDefaults();
  viewManager.selectView("");
}
</script>

<template>
  <CuiDropdown class="cui-data-grid-view-manager">
    <CuiDropdownTrigger>
      <CuiButton variant="outline" size="sm">
        <template #prefix><CuiIcon :icon="IconBookmarkSimple" size="0.875rem" /></template>
        {{ messages.dataGrid.views }}
        <CuiBadge
          v-if="grid.isDirty.value"
          class="cui-data-grid-view-manager__dirty"
          dot
          color="warning"
          animation="pulse"
          size="sm"
        />
      </CuiButton>
    </CuiDropdownTrigger>
    <CuiDropdownMenu min-width="14rem">
      <CuiDropdownHeader>{{ messages.dataGrid.savedViews }}</CuiDropdownHeader>

      <template v-if="viewManager.views.value.length > 0">
        <CuiDropdownItem
          v-for="view in viewManager.views.value"
          :key="view.id"
          :close-on-select="true"
          @select="onLoadView(view.id)"
        >
          <div class="cui-data-grid-view-manager__view">
            <span class="cui-data-grid-view-manager__view-name">
              <CuiIcon
                v-if="viewManager.activeViewId.value === view.id"
                class="cui-data-grid-view-manager__active"
                :icon="IconCheck"
                size="0.75rem"
              />
              {{ view.name }}
            </span>
            <button
              type="button"
              class="cui-data-grid-view-manager__delete"
              :aria-label="messages.dataGrid.deleteView?.(view.name)"
              @click.stop="onRemove(view.id)"
            >
              <CuiIcon :icon="IconTrash" size="0.75rem" />
            </button>
          </div>
        </CuiDropdownItem>
      </template>
      <CuiDropdownItem v-else disabled>{{ messages.dataGrid.noSavedViews }}</CuiDropdownItem>

      <CuiDropdownDivider />

      <CuiDropdownItem
        v-if="viewManager.activeViewId.value && grid.isDirty.value"
        :close-on-select="false"
        @select="onSaveCurrent"
      >
        <CuiIcon class="cui-data-grid-view-manager__action-icon" :icon="IconFloppyDisk" size="0.875rem" />
        {{ messages.dataGrid.saveCurrent }}
      </CuiDropdownItem>

      <CuiDropdownItem :close-on-select="false" @select="showSaveAs = !showSaveAs">
        <CuiIcon class="cui-data-grid-view-manager__action-icon" :icon="IconFloppyDisk" size="0.875rem" />
        {{ messages.dataGrid.saveAs }}
      </CuiDropdownItem>

      <div v-if="showSaveAs" class="cui-data-grid-view-manager__save">
        <span :id="viewNameId" class="cui-sr-only">{{ messages.dataGrid.viewName }}</span>
        <CuiInput
          v-model="newViewName"
          class="cui-data-grid-view-manager__name"
          :aria-labelledby="viewNameId"
          :placeholder="messages.dataGrid.viewName"
          size="sm"
          @keydown.enter="onSaveAs"
        />
        <CuiButton
          size="xs"
          variant="solid"
          :disabled="!newViewName.trim() || saving"
          @click="onSaveAs"
        >
          {{ messages.dataGrid.save }}
        </CuiButton>
      </div>

      <CuiDropdownDivider />
      <CuiDropdownItem @select="onReset">
        <CuiIcon class="cui-data-grid-view-manager__action-icon" :icon="IconArrowCounterClockwise" size="0.875rem" />
        {{ messages.dataGrid.resetViews }}
      </CuiDropdownItem>
    </CuiDropdownMenu>
  </CuiDropdown>
</template>

<style scoped>
/* The saved-views menu's paint. Themeable declarations sit inside :where(), so a consumer's
   plain rule, or a --cui-data-grid-view-manager-* token set on :root or <body> (the menu is
   teleported, so a container's token never reaches it), wins; structure stays at normal
   specificity. */
.cui-data-grid-view-manager__dirty {
  margin-left: 0.25rem;
}

.cui-data-grid-view-manager__view {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
.cui-data-grid-view-manager__view-name {
  display: flex;
  align-items: center;
  gap: calc(0.375rem * var(--cui-density-scale, 1));
}

/* The check beside the loaded view: the control's "on" state. */
:where(.cui-data-grid-view-manager__active) {
  color: var(--cui-data-grid-view-manager-pressed-color, var(--cui-primary));
}

:where(.cui-data-grid-view-manager__delete) {
  padding: calc(0.125rem * var(--cui-density-scale, 1));
  border: none;
  background: none;
  color: var(--cui-text-tertiary);
  opacity: 0.6;
}
.cui-data-grid-view-manager__delete {
  cursor: pointer;
}

:where(.cui-data-grid-view-manager__action-icon) {
  color: var(--cui-text-secondary);
}

.cui-data-grid-view-manager__save {
  display: flex;
  gap: calc(0.375rem * var(--cui-density-scale, 1));
  padding: calc(0.375rem * var(--cui-density-scale, 1)) calc(0.625rem * var(--cui-density-scale, 1));
}
.cui-data-grid-view-manager__name {
  flex: 1;
}
</style>

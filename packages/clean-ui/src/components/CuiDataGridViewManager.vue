<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useDataGridState } from "../composables/useDataGrid";
import { useDataGridViews, type UseDataGridViewsOptions } from "../composables/useDataGridViews";
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
  <CuiDropdown>
    <CuiDropdownTrigger>
      <CuiButton variant="outline" size="sm">
        <template #prefix><CuiIcon name="bookmark-simple" size="0.875rem" /></template>
        Views
        <CuiBadge
          v-if="grid.isDirty.value"
          dot
          color="warning"
          animation="pulse"
          size="sm"
          style="margin-left: 0.25rem;"
        />
      </CuiButton>
    </CuiDropdownTrigger>
    <CuiDropdownMenu min-width="14rem">
      <CuiDropdownHeader>Saved Views</CuiDropdownHeader>

      <template v-if="viewManager.views.value.length > 0">
        <CuiDropdownItem
          v-for="view in viewManager.views.value"
          :key="view.id"
          :close-on-select="true"
          @select="onLoadView(view.id)"
        >
          <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
            <span style="display: flex; align-items: center; gap: 0.375rem;">
              <CuiIcon
                v-if="viewManager.activeViewId.value === view.id"
                name="check"
                size="0.75rem"
                style="color: var(--cui-primary);"
              />
              {{ view.name }}
            </span>
            <button
              style="border: none; background: none; cursor: pointer; padding: 0.125rem; color: var(--cui-text-tertiary); opacity: 0.6;"
              @click.stop="onRemove(view.id)"
            >
              <CuiIcon name="trash" size="0.75rem" />
            </button>
          </div>
        </CuiDropdownItem>
      </template>
      <CuiDropdownItem v-else disabled>No saved views</CuiDropdownItem>

      <CuiDropdownDivider />

      <CuiDropdownItem
        v-if="viewManager.activeViewId.value && grid.isDirty.value"
        :close-on-select="false"
        @select="onSaveCurrent"
      >
        <CuiIcon name="floppy-disk" size="0.875rem" style="color: var(--cui-text-secondary);" />
        Save current
      </CuiDropdownItem>

      <CuiDropdownItem :close-on-select="false" @select="showSaveAs = !showSaveAs">
        <CuiIcon name="floppy-disk" size="0.875rem" style="color: var(--cui-text-secondary);" />
        Save as...
      </CuiDropdownItem>

      <div v-if="showSaveAs" style="padding: 0.375rem 0.625rem; display: flex; gap: 0.375rem;">
        <CuiInput
          v-model="newViewName"
          placeholder="View name"
          size="sm"
          style="flex: 1;"
          @keydown.enter="onSaveAs"
        />
        <CuiButton
          size="xs"
          variant="solid"
          :disabled="!newViewName.trim() || saving"
          @click="onSaveAs"
        >
          Save
        </CuiButton>
      </div>

      <CuiDropdownDivider />
      <CuiDropdownItem @select="onReset">
        <CuiIcon name="arrow-counter-clockwise" size="0.875rem" style="color: var(--cui-text-secondary);" />
        Reset to defaults
      </CuiDropdownItem>
    </CuiDropdownMenu>
  </CuiDropdown>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useDataGridState } from "../composables/useDataGrid";
import type { DataGridFilter } from "../types/data-grid";
import CuiInput from "./CuiInput.vue";
import CuiSelect from "./CuiSelect.vue";
import CuiCheckbox from "./CuiCheckbox.vue";
import CuiButton from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";

const grid = useDataGridState();

// Local filter state — applied on "Apply" button
const localFilters = ref<Record<string, string | string[]>>({});

// Sync from grid on open
watch(
  () => grid.filterPanelOpen.value,
  (open) => {
    if (open) syncFromGrid();
  },
  { immediate: true },
);

function syncFromGrid() {
  const map: Record<string, string | string[]> = {};
  for (const f of grid.filters.value) {
    map[f.key] = f.value;
  }
  localFilters.value = map;
}

function getTextValue(key: string): string {
  return String(localFilters.value[key] ?? "");
}

function setTextValue(key: string, val: string | number) {
  localFilters.value = { ...localFilters.value, [key]: String(val) };
}

function getSelectValue(key: string): string {
  return String(localFilters.value[key] ?? "");
}

function setSelectValue(key: string, val: string | number) {
  localFilters.value = { ...localFilters.value, [key]: String(val) };
}

function getMultiSelectValue(key: string): string[] {
  const val = localFilters.value[key];
  if (Array.isArray(val)) return val;
  return val ? [val] : [];
}

function toggleMultiSelectValue(key: string, option: string) {
  const current = getMultiSelectValue(key);
  const next = current.includes(option)
    ? current.filter((v) => v !== option)
    : [...current, option];
  localFilters.value = { ...localFilters.value, [key]: next };
}

function getDateRangeValue(key: string): [string, string] {
  const val = localFilters.value[key];
  if (Array.isArray(val) && val.length === 2) return [val[0], val[1]];
  return ["", ""];
}

function setDateRangeValue(key: string, index: 0 | 1, val: string | number) {
  const current = getDateRangeValue(key);
  current[index] = String(val);
  localFilters.value = { ...localFilters.value, [key]: [...current] };
}

function applyAll() {
  // Clear all existing filters first
  grid.clearFilters();
  // Apply each non-empty local filter
  for (const col of grid.filterableColumns.value) {
    const filterKey = col.filterKey ?? col.key;
    const val = localFilters.value[filterKey];
    if (!val || (Array.isArray(val) && val.length === 0) || val === "") continue;
    // Skip empty date ranges
    if (col.filterType === "date-range" && Array.isArray(val) && (!val[0] || !val[1])) continue;

    grid.applyFilter({
      key: filterKey,
      value: val,
      type: col.filterType ?? "text",
    });
  }
}

function clearAll() {
  localFilters.value = {};
  grid.clearFilters();
}

const hasAnyValue = computed(() => {
  return Object.values(localFilters.value).some((v) => {
    if (Array.isArray(v)) return v.length > 0 && v.some(Boolean);
    return !!v;
  });
});
</script>

<template>
  <div v-if="grid.filterPanelOpen.value" class="cui-data-grid-filter-panel">
    <div class="cui-data-grid-filter-panel__header">
      <span class="cui-data-grid-filter-panel__title">Filters</span>
      <div style="display: flex; gap: 0.25rem;">
        <CuiButton
          variant="ghost"
          size="xs"
          :style="{ color: grid.filterPanelPinned.value ? 'var(--cui-primary)' : undefined }"
          @click="grid.toggleFilterPanelPin()"
        >
          <CuiIcon name="push-pin" size="0.875rem" />
        </CuiButton>
        <CuiButton variant="ghost" size="xs" @click="grid.toggleFilterPanel()">
          <CuiIcon name="x" size="0.875rem" />
        </CuiButton>
      </div>
    </div>

    <div class="cui-data-grid-filter-panel__body">
      <div
        v-for="col in grid.filterableColumns.value"
        :key="col.key"
        class="cui-data-grid-filter-panel__field"
      >
        <label class="cui-data-grid-filter-panel__label">{{ col.label }}</label>

        <!-- Text filter -->
        <CuiInput
          v-if="col.filterType === 'text' || !col.filterType"
          :model-value="getTextValue(col.filterKey ?? col.key)"
          :placeholder="`Filter ${col.label}...`"
          size="sm"
          @update:model-value="setTextValue(col.filterKey ?? col.key, $event)"
        />

        <!-- Select filter -->
        <CuiSelect
          v-else-if="col.filterType === 'select'"
          :model-value="getSelectValue(col.filterKey ?? col.key)"
          :options="[{ label: 'All', value: '' }, ...(col.filterOptions ?? [])]"
          size="sm"
          @update:model-value="(val: unknown) => setSelectValue(col.filterKey ?? col.key, String(val ?? ''))"
        />

        <!-- Multi-select filter -->
        <div v-else-if="col.filterType === 'multi-select'" style="display: flex; flex-direction: column; gap: 0.25rem;">
          <CuiCheckbox
            v-for="opt in (col.filterOptions ?? [])"
            :key="opt.value"
            :model-value="getMultiSelectValue(col.filterKey ?? col.key).includes(opt.value)"
            :label="opt.label"
            size="sm"
            @update:model-value="toggleMultiSelectValue(col.filterKey ?? col.key, opt.value)"
          />
        </div>

        <!-- Date range filter -->
        <div v-else-if="col.filterType === 'date-range'" style="display: flex; gap: 0.5rem;">
          <input
            type="date"
            class="cui-data-grid-filter-panel__date-input"
            :value="getDateRangeValue(col.filterKey ?? col.key)[0]"
            @input="setDateRangeValue(col.filterKey ?? col.key, 0, ($event.target as HTMLInputElement).value)"
          />
          <input
            type="date"
            class="cui-data-grid-filter-panel__date-input"
            :value="getDateRangeValue(col.filterKey ?? col.key)[1]"
            @input="setDateRangeValue(col.filterKey ?? col.key, 1, ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>
    </div>

    <div class="cui-data-grid-filter-panel__footer">
      <CuiButton size="xs" variant="solid" @click="applyAll">Apply</CuiButton>
      <CuiButton size="xs" variant="ghost" :disabled="!hasAnyValue" @click="clearAll">Clear All</CuiButton>
    </div>
  </div>
</template>

<style>
.cui-data-grid-filter-panel {
  width: 16rem;
  flex-shrink: 0;
  border: 1px solid var(--cui-border);
  border-radius: var(--cui-button-radius, 0.375rem);
  background: var(--cui-surface-base);
  display: flex;
  flex-direction: column;
  align-self: flex-start;
}

.cui-data-grid-filter-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 0.75rem;
  border-bottom: 1px solid var(--cui-border);
}

.cui-data-grid-filter-panel__title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--cui-text-body);
}

.cui-data-grid-filter-panel__body {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  max-height: 24rem;
}

.cui-data-grid-filter-panel__field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.cui-data-grid-filter-panel__label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--cui-text-secondary);
}

.cui-data-grid-filter-panel__footer {
  display: flex;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  border-top: 1px solid var(--cui-border);
}

.cui-data-grid-filter-panel__date-input {
  flex: 1;
  padding: 0.375rem 0.5rem;
  font-size: 0.8125rem;
  border: 1px solid var(--cui-border-strong, var(--cui-border));
  border-radius: 0.25rem;
  background: var(--cui-surface-base);
  color: var(--cui-text-body);
}
</style>

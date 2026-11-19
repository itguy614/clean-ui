import { inject, provide, ref, watch, type InjectionKey, type Ref } from "vue";
import type { DataGridContext } from "./data-grid-context";

/** The filter panel's unapplied edits, by filter key: a string, or the chosen values. */
export type FilterDraft = Ref<Record<string, string | string[]>>;

const FilterDraftKey: InjectionKey<FilterDraft> = Symbol("data-grid-filter-draft");

/** The draft as the grid's applied filters stand. */
function draftFromGrid(grid: DataGridContext): Record<string, string | string[]> {
  const map: Record<string, string | string[]> = {};
  for (const f of grid.filters.value) map[f.key] = f.value;
  return map;
}

/**
 * The filter panel's draft, held above the panel (#552) so the popover and the inline panel,
 * which are two instances, share it: pinning or unpinning swaps one for the other and the edits
 * made but not yet applied go with the user. It restarts from the applied filters whenever the
 * panel opens from closed, and whenever the applied filters change (Apply, Clear all, a chip
 * removed, a saved view loaded), so it is never stale against them. Call in setup, in CuiDataGrid.
 */
export function provideFilterDraft(grid: DataGridContext): FilterDraft {
  const draft: FilterDraft = ref(draftFromGrid(grid));
  watch(() => grid.filterPanelOpen.value, (open) => open && (draft.value = draftFromGrid(grid)));
  watch(() => grid.filters.value, () => (draft.value = draftFromGrid(grid)), { deep: true });
  provide(FilterDraftKey, draft);
  return draft;
}

/**
 * The draft the enclosing CuiDataGrid holds. A filter panel used with `provideDataGrid` alone
 * (no CuiDataGrid) has none to share, so it keeps its own, restarted the same ways.
 */
export function useFilterDraft(grid: DataGridContext): FilterDraft {
  return inject(FilterDraftKey, null) ?? provideFilterDraft(grid);
}

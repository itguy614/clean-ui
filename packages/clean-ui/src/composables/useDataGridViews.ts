import { ref } from "vue";
import type { DataGridSavedView, DataGridViewAdapter } from "../types/data-grid";

/** Built-in localStorage adapter */
export function localStorageViewAdapter(prefix = "cui-datagrid"): DataGridViewAdapter {
  function storageKey(gridId: string) {
    return `${prefix}-views-${gridId}`;
  }

  return {
    async load(gridId: string): Promise<DataGridSavedView[]> {
      try {
        const raw = localStorage.getItem(storageKey(gridId));
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    },

    async save(gridId: string, view: DataGridSavedView): Promise<void> {
      const views = await this.load(gridId);
      const idx = views.findIndex((v) => v.id === view.id);
      if (idx >= 0) {
        views[idx] = view;
      } else {
        views.push(view);
      }
      localStorage.setItem(storageKey(gridId), JSON.stringify(views));
    },

    async remove(gridId: string, viewId: string): Promise<void> {
      const views = await this.load(gridId);
      const filtered = views.filter((v) => v.id !== viewId);
      localStorage.setItem(storageKey(gridId), JSON.stringify(filtered));
    },
  };
}

export interface UseDataGridViewsOptions {
  gridId: string;
  adapter?: DataGridViewAdapter;
}

export function useDataGridViews(options: UseDataGridViewsOptions) {
  const adapter = options.adapter ?? localStorageViewAdapter();
  const views = ref<DataGridSavedView[]>([]);
  const activeViewId = ref<string | null>(null);
  const loading = ref(false);

  async function fetchViews() {
    loading.value = true;
    try {
      views.value = await adapter.load(options.gridId);
    } finally {
      loading.value = false;
    }
  }

  async function saveView(name: string, config: DataGridSavedView["config"]) {
    const existing = views.value.find((v) => v.name === name);
    const view: DataGridSavedView = {
      id: existing?.id ?? crypto.randomUUID(),
      name,
      config,
    };
    await adapter.save(options.gridId, view);
    await fetchViews();
    activeViewId.value = view.id;
  }

  async function updateView(id: string, config: DataGridSavedView["config"]) {
    const existing = views.value.find((v) => v.id === id);
    if (!existing) return;
    await adapter.save(options.gridId, { ...existing, config });
    await fetchViews();
  }

  async function removeView(id: string) {
    await adapter.remove(options.gridId, id);
    if (activeViewId.value === id) activeViewId.value = null;
    await fetchViews();
  }

  function selectView(id: string) {
    activeViewId.value = id;
  }

  return {
    views,
    activeViewId,
    loading,
    fetchViews,
    saveView,
    updateView,
    removeView,
    selectView,
  };
}

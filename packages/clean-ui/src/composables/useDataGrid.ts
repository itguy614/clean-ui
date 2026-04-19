import { ref, computed, inject, provide, type Ref } from "vue";
import type {
  DataGridColumn,
  DataGridColumnState,
  DataGridSort,
  DataGridFilter,
  DataGridQueryParams,
  DataGridRow,
  DataGridViewConfig,
  DataGridViewMode,
  PaginatedData,
} from "../types/data-grid";
import { DataGridContextKey, type DataGridContext } from "../components/data-grid-context";

export interface UseDataGridOptions {
  columns: DataGridColumn[];
  data: Ref<DataGridRow[] | PaginatedData>;
  serverSide?: boolean;
  rowKey?: string;
  defaultPerPage?: number;
  initialView?: DataGridViewConfig;
  hydrateFromUrl?: boolean;
}

export function useDataGrid(options: UseDataGridOptions) {
  const {
    columns,
    serverSide = false,
    rowKey = "id",
    defaultPerPage = 15,
    initialView,
    hydrateFromUrl = false,
  } = options;

  // --- Default config (for reset) ---
  const defaultColumnState: DataGridColumnState[] = columns.map((col) => ({
    key: col.key,
    visible: col.visible !== false,
  }));

  // --- Column state ---
  const columnState = ref<DataGridColumnState[]>(
    initialView?.columns ?? defaultColumnState.map((cs) => ({ ...cs })),
  );

  const visibleColumns = computed(() =>
    columnState.value
      .filter((cs) => cs.visible)
      .map((cs) => columns.find((c) => c.key === cs.key)!)
      .filter(Boolean),
  );

  const filterableColumns = computed(() =>
    columns.filter((c) => c.filterable),
  );

  function toggleColumnVisibility(key: string) {
    const entry = columnState.value.find((cs) => cs.key === key);
    if (entry) entry.visible = !entry.visible;
  }

  function reorderColumns(fromIndex: number, toIndex: number) {
    const arr = [...columnState.value];
    const [moved] = arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, moved);
    columnState.value = arr;
  }

  // --- Sort ---
  const sort = ref<DataGridSort | null>(initialView?.sort ?? null);

  function applySort(key: string) {
    const col = columns.find((c) => c.key === key);
    if (!col?.sortable) return;
    const sortKey = col.sortKey ?? key;

    if (sort.value?.key === sortKey) {
      if (sort.value.direction === "asc") {
        sort.value = { key: sortKey, direction: "desc" };
      } else {
        sort.value = null;
      }
    } else {
      sort.value = { key: sortKey, direction: "asc" };
    }
    page.value = 1;
  }

  // --- Filters ---
  const filters = ref<DataGridFilter[]>(initialView?.filters ? [...initialView.filters] : []);

  function applyFilter(filter: DataGridFilter) {
    const idx = filters.value.findIndex((f) => f.key === filter.key);
    if (idx >= 0) {
      filters.value[idx] = filter;
    } else {
      filters.value.push(filter);
    }
    filters.value = [...filters.value];
    page.value = 1;
  }

  function removeFilter(key: string) {
    filters.value = filters.value.filter((f) => f.key !== key);
    page.value = 1;
  }

  function clearFilters() {
    filters.value = [];
    page.value = 1;
  }

  // --- Search ---
  const searchQuery = ref("");
  const searchField = ref<string | null>(null);

  function search(query: string, field?: string | null) {
    searchQuery.value = query;
    searchField.value = field ?? null;
    page.value = 1;
  }

  function clearSearch() {
    searchQuery.value = "";
    searchField.value = null;
    page.value = 1;
  }

  // --- Pagination ---
  const page = ref(1);
  const perPage = ref(initialView?.perPage ?? defaultPerPage);

  function setPage(n: number) {
    page.value = n;
  }

  function setPerPage(n: number) {
    perPage.value = n;
    page.value = 1;
  }

  // --- Selection ---
  const selectedRows = ref(new Set<string>());

  function toggleSelection(id: string) {
    const next = new Set(selectedRows.value);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    selectedRows.value = next;
  }

  function selectAll(rows: DataGridRow[]) {
    const next = new Set<string>();
    for (const row of rows) {
      const id = String(row[rowKey] ?? "");
      if (id) next.add(id);
    }
    selectedRows.value = next;
  }

  function clearSelection() {
    selectedRows.value = new Set();
  }

  // --- View mode ---
  const viewMode = ref<DataGridViewMode>(initialView?.viewMode ?? "grid");

  function setViewMode(mode: DataGridViewMode) {
    viewMode.value = mode;
  }

  // --- Filter panel ---
  const filterPanelOpen = ref(false);
  const filterPanelPinned = ref(initialView?.filterPanelPinned ?? false);

  function toggleFilterPanel() {
    filterPanelOpen.value = !filterPanelOpen.value;
  }

  function toggleFilterPanelPin() {
    filterPanelPinned.value = !filterPanelPinned.value;
  }

  // --- Client-side data processing ---
  const rawData = computed<DataGridRow[]>(() => {
    const d = options.data.value;
    if (Array.isArray(d)) return d;
    return (d as PaginatedData).data ?? [];
  });

  const isServerSide = computed(() => {
    if (serverSide) return true;
    const d = options.data.value;
    return !Array.isArray(d) && "current_page" in d;
  });

  const filteredData = computed<DataGridRow[]>(() => {
    if (isServerSide.value) return rawData.value;

    let result = [...rawData.value];

    // Search
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      result = result.filter((row) => {
        if (searchField.value) {
          return String(row[searchField.value] ?? "").toLowerCase().includes(q);
        }
        return Object.values(row).some((val) =>
          String(val ?? "").toLowerCase().includes(q),
        );
      });
    }

    // Filters
    for (const filter of filters.value) {
      const col = columns.find((c) => (c.filterKey ?? c.key) === filter.key);
      const dataKey = col?.key ?? filter.key;

      result = result.filter((row) => {
        const cellVal = String(row[dataKey] ?? "").toLowerCase();

        if (filter.type === "text") {
          return cellVal.includes(String(filter.value).toLowerCase());
        }
        if (filter.type === "select") {
          return cellVal === String(filter.value).toLowerCase();
        }
        if (filter.type === "multi-select") {
          const vals = Array.isArray(filter.value) ? filter.value : [filter.value];
          return vals.some((v) => cellVal === v.toLowerCase());
        }
        if (filter.type === "date-range" && Array.isArray(filter.value) && filter.value.length === 2) {
          return cellVal >= filter.value[0] && cellVal <= filter.value[1];
        }
        return true;
      });
    }

    return result;
  });

  const sortedData = computed<DataGridRow[]>(() => {
    if (isServerSide.value) return filteredData.value;
    if (!sort.value) return filteredData.value;

    const { key, direction } = sort.value;
    const col = columns.find((c) => (c.sortKey ?? c.key) === key);
    const dataKey = col?.key ?? key;

    return [...filteredData.value].sort((a, b) => {
      const aVal = a[dataKey];
      const bVal = b[dataKey];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let cmp: number;
      if (typeof aVal === "number" && typeof bVal === "number") {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal));
      }
      return direction === "desc" ? -cmp : cmp;
    });
  });

  const displayData = computed<DataGridRow[]>(() => {
    if (isServerSide.value) return rawData.value;
    const start = (page.value - 1) * perPage.value;
    return sortedData.value.slice(start, start + perPage.value);
  });

  const paginationMeta = computed(() => {
    if (isServerSide.value) {
      const d = options.data.value;
      if (!Array.isArray(d) && "current_page" in d) {
        const pd = d as PaginatedData;
        return {
          current_page: pd.current_page,
          last_page: pd.last_page,
          per_page: pd.per_page,
          total: pd.total,
          from: pd.from,
          to: pd.to,
        };
      }
    }

    const total = sortedData.value.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage.value));
    const from = total > 0 ? (page.value - 1) * perPage.value + 1 : null;
    const to = total > 0 ? Math.min(page.value * perPage.value, total) : null;

    return {
      current_page: page.value,
      last_page: lastPage,
      per_page: perPage.value,
      total,
      from,
      to,
    };
  });

  // --- Query params ---
  function getQueryParams(): DataGridQueryParams {
    return {
      page: page.value,
      perPage: perPage.value,
      sort: sort.value,
      filters: filters.value.length > 0 ? [...filters.value] : undefined,
      search: searchQuery.value || undefined,
      searchField: searchField.value,
    };
  }

  // --- View config (for saved views) ---
  let savedConfigSnapshot = JSON.stringify(getDefaultConfig());

  function getDefaultConfig(): DataGridViewConfig {
    return {
      columns: defaultColumnState.map((cs) => ({ ...cs })),
      sort: null,
      filters: [],
      perPage: defaultPerPage,
      viewMode: "grid",
      filterPanelPinned: false,
    };
  }

  function getConfig(): DataGridViewConfig {
    return {
      columns: columnState.value.map((cs) => ({ ...cs })),
      sort: sort.value ? { ...sort.value } : null,
      filters: filters.value.map((f) => ({ ...f })),
      perPage: perPage.value,
      viewMode: viewMode.value,
      filterPanelPinned: filterPanelPinned.value,
    };
  }

  function loadConfig(config: DataGridViewConfig) {
    columnState.value = config.columns.map((cs) => ({ ...cs }));
    sort.value = config.sort ? { ...config.sort } : null;
    filters.value = config.filters.map((f) => ({ ...f }));
    perPage.value = config.perPage;
    viewMode.value = config.viewMode;
    filterPanelPinned.value = config.filterPanelPinned;
    page.value = 1;
    markClean();
  }

  const isDirty = computed(() =>
    JSON.stringify(getConfig()) !== savedConfigSnapshot,
  );

  function markClean() {
    savedConfigSnapshot = JSON.stringify(getConfig());
  }

  function resetToDefaults() {
    loadConfig(getDefaultConfig());
    clearSearch();
    clearSelection();
  }

  // Initialize from saved view
  if (initialView) {
    savedConfigSnapshot = JSON.stringify(initialView);
  }

  // --- URL hydration ---
  if (hydrateFromUrl && typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);

    const urlSort = params.get("sort");
    const urlDir = params.get("direction");
    if (urlSort) {
      sort.value = { key: urlSort, direction: (urlDir === "desc" ? "desc" : "asc") };
    }

    const urlSearch = params.get("search");
    if (urlSearch) {
      searchQuery.value = urlSearch;
      searchField.value = params.get("search_field") ?? null;
    }

    const urlPerPage = params.get("per_page");
    if (urlPerPage) perPage.value = Number(urlPerPage);

    const urlPage = params.get("page");
    if (urlPage) page.value = Number(urlPage);

    const urlViewMode = params.get("view_mode");
    if (urlViewMode === "card" || urlViewMode === "grid") viewMode.value = urlViewMode;

    // Hydrate filters: filter[key]=value
    for (const [k, v] of params.entries()) {
      const match = k.match(/^filter\[(.+)\]$/);
      if (match) {
        const filterKey = match[1];
        const col = columns.find((c) => (c.filterKey ?? c.key) === filterKey);
        const type = col?.filterType ?? "text";
        const value = type === "multi-select" ? v.split(",") : v;
        applyFilter({ key: filterKey, value, type });
      }
    }
  }

  // --- Build context ---
  const context: DataGridContext = {
    columns,
    columnState,
    visibleColumns,
    filterableColumns,
    sort,
    applySort,
    filters,
    applyFilter,
    removeFilter,
    clearFilters,
    searchQuery,
    searchField,
    search,
    clearSearch,
    page,
    perPage,
    setPage,
    setPerPage,
    selectedRows,
    toggleSelection,
    selectAll,
    clearSelection,
    toggleColumnVisibility,
    reorderColumns,
    viewMode,
    setViewMode,
    filterPanelOpen,
    filterPanelPinned,
    toggleFilterPanel,
    toggleFilterPanelPin,
    displayData,
    paginationMeta,
    getConfig,
    loadConfig,
    isDirty,
    markClean,
    resetToDefaults,
    serverSide,
    getQueryParams,
  };

  return context;
}

/** Provide the data grid context to sub-components */
export function provideDataGrid(context: DataGridContext) {
  provide(DataGridContextKey, context);
}

/** Inject the data grid context (throws if not provided) */
export function useDataGridState(): DataGridContext {
  const ctx = inject(DataGridContextKey);
  if (!ctx) throw new Error("useDataGridState must be used within a CuiDataGrid");
  return ctx;
}

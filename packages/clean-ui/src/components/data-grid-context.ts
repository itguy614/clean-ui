import type { InjectionKey, Ref, ComputedRef } from "vue";
import type {
  DataGridColumn,
  DataGridColumnState,
  DataGridSort,
  DataGridFilter,
  DataGridQueryParams,
  DataGridRow,
  DataGridViewConfig,
  DataGridViewMode,
} from "../types/data-grid";

export interface DataGridContext {
  // Column state
  columns: DataGridColumn[];
  columnState: Ref<DataGridColumnState[]>;
  visibleColumns: ComputedRef<DataGridColumn[]>;
  filterableColumns: ComputedRef<DataGridColumn[]>;

  // Sort
  sort: Ref<DataGridSort | null>;
  applySort: (key: string) => void;

  // Filters
  filters: Ref<DataGridFilter[]>;
  applyFilter: (filter: DataGridFilter) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;

  // Search
  searchQuery: Ref<string>;
  searchField: Ref<string | null>;
  search: (query: string, field?: string | null) => void;
  clearSearch: () => void;

  // Pagination
  page: Ref<number>;
  perPage: Ref<number>;
  setPage: (n: number) => void;
  setPerPage: (n: number) => void;

  // Selection
  selectedRows: Ref<Set<string>>;
  toggleSelection: (id: string) => void;
  selectAll: (rows: DataGridRow[]) => void;
  clearSelection: () => void;

  // Column management
  toggleColumnVisibility: (key: string) => void;
  reorderColumns: (fromIndex: number, toIndex: number) => void;

  // View mode
  viewMode: Ref<DataGridViewMode>;
  setViewMode: (mode: DataGridViewMode) => void;

  // Filter panel
  filterPanelOpen: Ref<boolean>;
  filterPanelPinned: Ref<boolean>;
  toggleFilterPanel: () => void;
  toggleFilterPanelPin: () => void;

  // Data access
  displayData: ComputedRef<DataGridRow[]>;
  paginationMeta: ComputedRef<{
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  }>;

  // View config
  getConfig: () => DataGridViewConfig;
  loadConfig: (config: DataGridViewConfig) => void;
  isDirty: ComputedRef<boolean>;
  markClean: () => void;
  resetToDefaults: () => void;

  // Navigation
  serverSide: boolean;
  getQueryParams: () => DataGridQueryParams;
}

export const DataGridContextKey: InjectionKey<DataGridContext> = Symbol("data-grid-context");

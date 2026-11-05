import type { InjectionKey, Ref, ComputedRef } from "vue";
import type {
  DataGridColumn,
  DataGridColumnGroup,
  DataGridColumnUnit,
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
  /** The group a leaf column sits under (a spanning header), if any. */
  columnGroupOf: (key: string) => DataGridColumnGroup | undefined;
  /** The column order as units: each group once (with its leaf keys), each ungrouped column. */
  columnUnits: ComputedRef<DataGridColumnUnit[]>;
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
  /** Clamped to 1..last page; returns whether the page shown changed. */
  setPage: (n: number) => boolean;
  setPerPage: (n: number) => void;

  // Selection
  selectedRows: Ref<Set<string>>;
  toggleSelection: (id: string) => void;
  selectAll: (rows: DataGridRow[]) => void;
  clearSelection: () => void;

  // Column management
  toggleColumnVisibility: (key: string) => void;
  /** A grouped leaf stays within its group; nothing ever splits a group. */
  reorderColumns: (fromIndex: number, toIndex: number) => void;
  /** Move a group, or an ungrouped column, to another place in `columnUnits`. */
  reorderUnit: (fromUnit: number, toUnit: number) => void;
  reorderGroup: (group: DataGridColumnGroup, toUnit: number) => void;
  /** One step up or down — a leaf within its group, an ungrouped column among the units. */
  moveColumn: (key: string, delta: -1 | 1) => void;
  moveGroup: (group: DataGridColumnGroup, delta: -1 | 1) => void;

  // View mode
  viewMode: Ref<DataGridViewMode>;
  setViewMode: (mode: DataGridViewMode) => void;

  // Filter panel
  filterPanelOpen: Ref<boolean>;
  filterPanelPinned: Ref<boolean>;
  toggleFilterPanel: () => void;
  toggleFilterPanelPin: () => void;

  // Data access
  /** The rows to render: the current page, or every processed row when not `paginated`. */
  displayData: ComputedRef<DataGridRow[]>;
  /**
   * Rows after search, filters and sort, before paging (#372). Server-side, the current
   * page's rows — the server did the rest.
   */
  processedRows: ComputedRef<DataGridRow[]>;
  /** Whether rows are split into pages: always server-side; client-side unless `paginate` is false. */
  paginated: ComputedRef<boolean>;
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

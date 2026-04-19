/** Column definition for the data grid */
export interface DataGridColumn {
  /** Unique column identifier — must match a key on the data row */
  key: string;
  /** Display label for the column header */
  label: string;
  /** Enable sorting on this column */
  sortable?: boolean;
  /** Backend sort field override (defaults to key) */
  sortKey?: string;
  /** Enable filtering on this column */
  filterable?: boolean;
  /** Filter UI type */
  filterType?: DataGridFilterType;
  /** Backend filter field override (defaults to key) */
  filterKey?: string;
  /** Options for select/multi-select filter types */
  filterOptions?: { label: string; value: string }[];
  /** Initial visibility (default true) */
  visible?: boolean;
  /** Text alignment */
  align?: "left" | "center" | "right";
  /** CSS width (e.g., "200px", "20%") */
  width?: string;
  /** Prevent text wrapping */
  nowrap?: boolean;
  /** Pin column to the left edge during horizontal scroll (requires width) */
  sticky?: boolean;
}

export type DataGridFilterType = "text" | "select" | "multi-select" | "date-range";

export interface DataGridSort {
  key: string;
  direction: "asc" | "desc";
}

export interface DataGridFilter {
  key: string;
  value: string | string[];
  type: DataGridFilterType;
}

/** Query params emitted for server-side navigation */
export interface DataGridQueryParams {
  page?: number;
  perPage?: number;
  sort?: DataGridSort | null;
  filters?: DataGridFilter[];
  search?: string;
  searchField?: string | null;
}

export interface DataGridRowAction {
  key: string;
  label: string;
}

export interface DataGridBulkAction {
  key: string;
  label: string;
  variant?: "default" | "destructive";
}

/** Server-side paginated data shape (matches Laravel paginator) */
export interface PaginatedData<T = DataGridRow> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

/** A data row — any object with string keys. May include _actions for row-level actions. */
export type DataGridRow = Record<string, unknown> & {
  _actions?: DataGridRowAction[];
};

/** Internal column state for visibility and ordering */
export interface DataGridColumnState {
  key: string;
  visible: boolean;
}

/** Snapshot of grid configuration for saved views */
export interface DataGridViewConfig {
  columns: DataGridColumnState[];
  sort: DataGridSort | null;
  filters: DataGridFilter[];
  perPage: number;
  viewMode: "grid" | "card";
  filterPanelPinned: boolean;
}

/** A persisted saved view */
export interface DataGridSavedView {
  id: string;
  name: string;
  config: DataGridViewConfig;
}

/** Adapter for persisting saved views (localStorage, API, etc.) */
export interface DataGridViewAdapter {
  load(gridId: string): Promise<DataGridSavedView[]>;
  save(gridId: string, view: DataGridSavedView): Promise<void>;
  remove(gridId: string, viewId: string): Promise<void>;
}

export type DataGridViewMode = "grid" | "card";

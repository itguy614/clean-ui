/** Column definition for the data grid */
export interface DataGridColumn {
  /** Unique column identifier — must match a key on the data row */
  key: string;
  /**
   * Display label. Always required: the header when no header slot is given, and the text
   * the column manager, filter panel and card view use.
   */
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
  /**
   * Freeze the column: pinned to the left edge during horizontal scroll. Set `width`: it is the source of truth for the
   * offsets of the frozen columns after it. Without one the rendered header cell is measured after
   * the first paint (so those columns shift into place), with a development warning.
   * Frozen columns are always the leftmost block, in declared order, and can't be reordered in
   * the column manager. A column group is frozen wholly or not at all: one that mixes frozen and
   * non-frozen leaves is unfrozen, with a development warning.
   */
  sticky?: boolean;
}

/**
 * A spanning header over related leaf columns (two-row header). It has no `key`, so it is
 * never in column state, sort, filters or saved views — those all work on its `children`.
 * Only one level of grouping is supported.
 */
export interface DataGridColumnGroup {
  /** Text of the spanning header cell */
  label: string;
  /** The leaf columns under this header, in order */
  children: DataGridColumn[];
}

/** What `columns` takes: a leaf column, or a group of them. Flat arrays keep working. */
export type DataGridColumnDef = DataGridColumn | DataGridColumnGroup;

/** Whether a column definition is a group (it has `children`). */
export function isDataGridColumnGroup(def: DataGridColumnDef): def is DataGridColumnGroup {
  return "children" in def && Array.isArray(def.children);
}

/** One entry of the column order as the column manager moves it: a group, or a loose column. */
export type DataGridColumnUnit =
  | { type: "group"; group: DataGridColumnGroup; keys: string[] }
  | { type: "column"; key: string };

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

import { ref, computed, inject, provide, shallowReactive, shallowRef, toRaw, toValue, watch, type MaybeRefOrGetter, type Ref } from "vue";
import type {
  DataGridColumn,
  DataGridColumnDef,
  DataGridColumnGroup,
  DataGridColumnState,
  DataGridColumnUnit,
  DataGridSort,
  DataGridFilter,
  DataGridQueryParams,
  DataGridRow,
  DataGridViewConfig,
  DataGridViewMode,
  PaginatedData,
} from "../types/data-grid";
import { isDataGridColumnGroup } from "../types/data-grid";
import { DataGridContextKey, type DataGridContext } from "../components/data-grid-context";
import { __DEV__, warnOnce } from "../utils/devWarn";
import { useMessages } from "./useMessages";
// Module-scoped: the bundler replaces `process.env.NODE_ENV`, and Node's types stay out of the build.
declare const process: { env: { NODE_ENV?: string } };

export interface UseDataGridOptions {
  /**
   * A plain array is read once; pass a ref or getter to follow later changes. Entries are
   * leaf columns, or groups of them (a two-row header) — groups are flattened to their leaves.
   */
  columns: MaybeRefOrGetter<DataGridColumnDef[]>;
  data: Ref<DataGridRow[] | PaginatedData>;
  serverSide?: boolean;
  rowKey?: string;
  defaultPerPage?: number;
  initialView?: DataGridViewConfig;
  hydrateFromUrl?: boolean;
  /**
   * Split client-side rows into pages (default true). False makes `displayData` the whole
   * searched, filtered and sorted set, for a view that windows rows itself — CuiDataGrid's
   * `virtualize` (#317). A server-side grid is always paged: the server does it.
   */
  paginate?: MaybeRefOrGetter<boolean>;
}

/** How long CuiDataGrid's search box waits after the last keystroke, by default (ms). */
export const DEFAULT_SEARCH_DEBOUNCE = 300;

export function useDataGrid(options: UseDataGridOptions) {
  const {
    serverSide = false,
    rowKey = "id",
    defaultPerPage = 15,
    initialView,
    hydrateFromUrl = false,
  } = options;

  // --- Column definitions ---
  // Shallow-reactive and updated in place, so `context.columns` stays the same plain
  // array consumers already hold while still re-rendering when the definitions change
  // (#258). Shallow: the definitions themselves are the caller's objects, not proxied.
  // A group's leaves are the columns — state, sort, filters and views all see only those.
  // The groups stay in `definitions`, for the header's spanning row.
  const flattenColumns = (defs: DataGridColumnDef[]) =>
    defs.flatMap((d) => (isDataGridColumnGroup(d) ? d.children : [d]));
  const definitions = shallowRef(toValue(options.columns));
  const columns = shallowReactive<DataGridColumn[]>(flattenColumns(definitions.value));

  /** The group a column sits under, by key. Computed from `definitions`, so it follows them. */
  const columnGroupByKey = computed(() => {
    const map = new Map<string, DataGridColumnGroup>();
    for (const d of definitions.value) {
      if (isDataGridColumnGroup(d)) for (const c of d.children) map.set(c.key, d);
    }
    return map;
  });
  const columnGroupOf = (key: string) => columnGroupByKey.value.get(key);

  /**
   * The frozen columns (`sticky: true`), in declared order: the leftmost block, always (#465).
   * A group is frozen wholly or not at all: one whose leaves mix frozen and not is a config
   * error (a group must stay contiguous, and the frozen block must stay leftmost), so its
   * leaves are all unfrozen, with a development warning.
   */
  const frozenOrder = computed(() => {
    const keys: string[] = [];
    for (const d of definitions.value) {
      if (!isDataGridColumnGroup(d)) {
        if (d.sticky) keys.push(d.key);
        continue;
      }
      const frozen = d.children.filter((c) => c.sticky).length;
      if (frozen === d.children.length) keys.push(...d.children.map((c) => c.key));
      else if (frozen > 0 && __DEV__ && process.env.NODE_ENV !== "production") {
        warnOnce(
          `[clean-ui] CuiDataGrid: column group "${d.label}" mixes frozen (sticky) and non-frozen columns. ` +
            `A group is frozen wholly or not at all, so its columns are unfrozen: mark every column in the group sticky, or none.`,
        );
      }
    }
    return keys;
  });
  const frozenKeys = computed(() => new Set(frozenOrder.value));
  const isFrozen = (key: string) => frozenKeys.value.has(key);

  // A leaf re-created with identical fields (an inline literal) is the same column.
  const sameColumn = (a: DataGridColumn, b: DataGridColumn) => {
    if (a === b) return true;
    const keys = Object.keys(a) as (keyof DataGridColumn)[];
    return keys.length === Object.keys(b).length && keys.every((k) => a[k] === b[k]);
  };

  // Same definitions, ignoring a fresh array or group object re-created on each parent render.
  const sameDefinitions = (a: DataGridColumnDef[], b: DataGridColumnDef[]) =>
    a.length === b.length &&
    a.every((d, i) => {
      const e = b[i];
      if (d === e) return true;
      return (
        isDataGridColumnGroup(d) &&
        isDataGridColumnGroup(e) &&
        d.label === e.label &&
        d.children.length === e.children.length &&
        d.children.every((c, j) => sameColumn(c, e.children[j]))
      );
    });

  const defaultStateOf = (col: DataGridColumn): DataGridColumnState => ({
    key: col.key,
    visible: col.visible !== false,
  });

  /**
   * Make each group's leaves contiguous: a group sits where its first leaf in `state` is, the
   * leaves keep their relative order, and anything ungrouped stays out of the middle. So a
   * stored order that splits a group ("Reads A1, RSSI A1, Reads A2") heals on load. Entries
   * are returned as the same objects.
   */
  function keepGroupsTogether(state: DataGridColumnState[]): DataGridColumnState[] {
    const groups = columnGroupByKey.value;
    if (groups.size === 0) return state;
    const placed = new Set<DataGridColumnGroup>();
    const result: DataGridColumnState[] = [];
    for (const cs of state) {
      const group = groups.get(cs.key);
      if (!group) result.push(cs);
      else if (!placed.has(group)) {
        placed.add(group);
        result.push(...state.filter((other) => groups.get(other.key) === group));
      }
    }
    return result;
  }

  /**
   * The frozen columns first, in declared order, whatever the stored order says (#465): a
   * frozen column is pinned at the summed widths of the frozen columns before it, which only
   * lines up when they are the leftmost block. The rest keep their relative order.
   */
  function pinFrozenFirst(state: DataGridColumnState[]): DataGridColumnState[] {
    const order = frozenOrder.value;
    if (order.length === 0) return state;
    const byKey = new Map(state.map((cs) => [cs.key, cs]));
    const head = order.flatMap((key) => (byKey.has(key) ? [byKey.get(key)!] : []));
    const frozen = frozenKeys.value;
    return [...head, ...state.filter((cs) => !frozen.has(cs.key))];
  }

  /** Every ordering rule, applied to a state: groups contiguous, frozen columns leftmost. */
  const normaliseOrder = (state: DataGridColumnState[]) => pinFrozenFirst(keepGroupsTogether(state));

  /**
   * The order as the column manager shows it: each group once, with its leaves, and each
   * ungrouped column on its own. Moving a unit moves a whole group.
   */
  const columnUnits = computed(() => {
    const groups = columnGroupByKey.value;
    const units: DataGridColumnUnit[] = [];
    for (const cs of columnState.value) {
      const group = groups.get(cs.key);
      const last = units[units.length - 1];
      if (group && last?.type === "group" && last.group === group) last.keys.push(cs.key);
      else if (group) units.push({ type: "group", group, keys: [cs.key] });
      else units.push({ type: "column", key: cs.key });
    }
    return units;
  });

  /**
   * Fit a column state to a set of definitions. Entries for definitions that remain
   * keep their visibility and order — unless `previous` is given and the definition's
   * own `visible` changed, which is an intentional update; entries for removed
   * definitions drop out; new definitions are inserted after their nearest preceding
   * neighbour that is already in the state (or first). Unchanged entries are returned
   * as the same objects, so callers can detect a no-op by identity.
   */
  function reconcileColumnState(
    state: DataGridColumnState[],
    defs: DataGridColumn[],
    previous?: DataGridColumn[],
  ): DataGridColumnState[] {
    const byKey = new Map(defs.map((c) => [c.key, c]));
    const before = new Map(previous?.map((c) => [c.key, c]));
    const isVisible = (c: DataGridColumn) => c.visible !== false;

    const result = state
      .filter((cs) => byKey.has(cs.key))
      .map((cs) => {
        const prev = before.get(cs.key);
        const next = byKey.get(cs.key)!;
        return prev && isVisible(prev) !== isVisible(next) ? defaultStateOf(next) : cs;
      });
    defs.forEach((col, i) => {
      if (result.some((cs) => cs.key === col.key)) return;
      let at = 0;
      for (let j = i - 1; j >= 0; j--) {
        const idx = result.findIndex((cs) => cs.key === defs[j].key);
        if (idx >= 0) {
          at = idx + 1;
          break;
        }
      }
      result.splice(at, 0, defaultStateOf(col));
    });
    return normaliseOrder(result);
  }

  // --- Column state ---
  const columnState = ref<DataGridColumnState[]>(
    initialView?.columns
      ? reconcileColumnState(initialView.columns.map((cs) => ({ ...cs })), columns)
      : normaliseOrder(columns.map(defaultStateOf)),
  );

  // Follow later definition changes (#258).
  watch(
    () => toValue(options.columns),
    (next) => {
      // A fresh array holding the same definitions (an inline literal re-created on each
      // parent render) is not a change; splicing anyway would re-run every computed that
      // reads `columns`, including the client-side sort and filter passes.
      if (sameDefinitions(next, definitions.value)) return;

      const previous = [...columns];
      const leaves = flattenColumns(next);
      definitions.value = next;
      // Leaves unchanged (only a group label moved): nothing for the leaf-keyed passes to redo.
      if (leaves.length !== columns.length || leaves.some((c, i) => c !== columns[i])) {
        columns.splice(0, columns.length, ...leaves);
      }

      const state = reconcileColumnState(columnState.value, leaves, previous);
      const changed =
        state.length !== columnState.value.length ||
        state.some((cs, i) => cs !== columnState.value[i]);
      if (changed) columnState.value = state;

      // A definition change is not a user edit: rebase the saved snapshot the same way,
      // so a clean grid stays clean and a dirty one becomes clean again once the user
      // reverts their own edits, instead of staying dirty against a stale column list.
      const saved = JSON.parse(savedConfigSnapshot.value) as DataGridViewConfig;
      saved.columns = reconcileColumnState(saved.columns, leaves, previous);
      savedConfigSnapshot.value = JSON.stringify(saved);
    },
    { deep: 1 },
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

  /**
   * Move a column. A grouped leaf stays inside its group's range (`toIndex` is clamped to
   * it); an ungrouped column dropped into the middle of a group lands after the group
   * instead. A group is never split, whoever calls this.
   */
  function reorderColumns(fromIndex: number, toIndex: number) {
    const arr = [...columnState.value];
    const moved = arr[fromIndex];
    // A frozen column never moves, and nothing moves in among them.
    if (!moved || isFrozen(moved.key)) return;
    toIndex = Math.max(toIndex, frozenOrder.value.length);
    const group = columnGroupByKey.value.get(moved.key);
    if (group) {
      const members = arr.flatMap((cs, i) => (columnGroupByKey.value.get(cs.key) === group ? [i] : []));
      toIndex = Math.min(Math.max(toIndex, members[0]), members[members.length - 1]);
    }
    arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, moved);
    columnState.value = normaliseOrder(arr);
  }

  /** Move a unit (a whole group, or an ungrouped column) to another place in `columnUnits`. */
  function reorderUnit(fromUnit: number, toUnit: number) {
    const units = [...columnUnits.value];
    const isFrozenUnit = (u: DataGridColumnUnit) => (u.type === "group" ? u.keys : [u.key]).some(isFrozen);
    const [moved] = units.splice(fromUnit, 1);
    if (!moved || isFrozenUnit(moved)) return;
    // Frozen units are the leftmost block: nothing lands before or among them.
    const floor = units.filter(isFrozenUnit).length;
    units.splice(Math.min(Math.max(toUnit, floor), units.length), 0, moved);
    const byKey = new Map(columnState.value.map((cs) => [cs.key, cs]));
    columnState.value = units
      .flatMap((u) => (u.type === "group" ? u.keys : [u.key]))
      .map((key) => byKey.get(key)!);
  }

  /** Move a whole group to a place among the units (groups and ungrouped columns). */
  function reorderGroup(group: DataGridColumnGroup, toUnit: number) {
    const from = columnUnits.value.findIndex((u) => u.type === "group" && u.group === group);
    if (from !== -1) reorderUnit(from, toUnit);
  }

  /** One step, for the keyboard: a leaf within its group, an ungrouped column among the units. */
  function moveColumn(key: string, delta: -1 | 1) {
    if (columnGroupByKey.value.has(key)) {
      const i = columnState.value.findIndex((cs) => cs.key === key);
      if (i !== -1) reorderColumns(i, i + delta);
      return;
    }
    const unit = columnUnits.value.findIndex((u) => u.type === "column" && u.key === key);
    if (unit !== -1) reorderUnit(unit, unit + delta);
  }

  /** One step for a whole group. */
  function moveGroup(group: DataGridColumnGroup, delta: -1 | 1) {
    const unit = columnUnits.value.findIndex((u) => u.type === "group" && u.group === group);
    if (unit !== -1) reorderUnit(unit, unit + delta);
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

  /**
   * Go to page `n`, truncated and clamped to 1..last page (#372). Returns whether the page
   * changed; NaN and the current page change nothing. A server-side grid fed a plain array
   * has no last page to clamp to. Server-side, "current" is the page last asked for, not
   * the one the server last sent, so a pending or failed fetch can't strand it.
   */
  function setPage(n: number): boolean {
    const server = isServerSide.value;
    const last = server && Array.isArray(options.data.value) ? Infinity : paginationMeta.value.last_page;
    const target = Math.max(1, Math.min(Math.trunc(n), last));
    if (Number.isNaN(target) || target === (server ? page.value : paginationMeta.value.current_page)) return false;
    page.value = target;
    return true;
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

  // Each cell's lower-cased text, cached per row (#273): a keystroke in a 5,000 × 10 grid
  // was 50,000 String() + toLowerCase() calls. Keyed by the raw row, so it goes when the
  // row does; each entry keeps the value it was made from, so a row edited in place is
  // re-lowered on its next read — which also keeps the read reactive, as before. Only
  // primitive cells are cached: an array or object cell can change inside itself (a push)
  // while staying the same value, and String()-ing it each time is what tracks its contents.
  const lowerCache = new WeakMap<object, Map<string, { src: unknown; lower: string }>>();
  const lower = (v: unknown) => ({ src: v, lower: String(v ?? "").toLowerCase() });
  const cacheable = (v: unknown) => v === null || typeof v !== "object";

  function lowerOf(row: DataGridRow, key: string): string {
    const val = row[key];
    const raw = toRaw(row);
    let cells = lowerCache.get(raw);
    if (!cells) {
      // The whole row at once: a search stops at a row's first matching cell, and filling
      // only the cells reached would leave each narrower query to lower more of them (a
      // thousand-odd a keystroke, measured on 5,000 rows) rather than none.
      cells = new Map();
      for (const k of Object.keys(raw)) {
        const v = (raw as DataGridRow)[k];
        if (cacheable(v)) cells.set(k, lower(v));
      }
      lowerCache.set(raw, cells);
    }
    if (!cacheable(val)) return String(val ?? "").toLowerCase();
    const hit = cells.get(key);
    if (hit && Object.is(hit.src, val)) return hit.lower; // Object.is: NaN is a hit too
    const fresh = lower(val);
    cells.set(key, fresh);
    return fresh.lower;
  }

  function rowMatches(row: DataGridRow, q: string): boolean {
    if (searchField.value) return lowerOf(row, searchField.value).includes(q);
    // Own keys only, as Object.values had it: an inherited property is not a cell.
    for (const key in row) if (Object.hasOwn(row, key) && lowerOf(row, key).includes(q)) return true;
    return false;
  }

  const filteredData = computed<DataGridRow[]>(() => {
    if (isServerSide.value) return rawData.value;

    let result = [...rawData.value];

    // Search
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      result = result.filter((row) => rowMatches(row, q));
    }

    // Filters
    for (const filter of filters.value) {
      const col = columns.find((c) => (c.filterKey ?? c.key) === filter.key);
      const dataKey = col?.key ?? filter.key;

      // The filter's own value, lowered once rather than once per row.
      const want = filter.type === "text" || filter.type === "select" ? String(filter.value).toLowerCase() : "";
      const wantAny =
        filter.type === "multi-select"
          ? (Array.isArray(filter.value) ? filter.value : [filter.value]).map((v) => String(v).toLowerCase())
          : [];

      result = result.filter((row) => {
        const cellVal = lowerOf(row, dataKey);

        if (filter.type === "text") {
          return cellVal.includes(want);
        }
        if (filter.type === "select") {
          return cellVal === want;
        }
        if (filter.type === "multi-select") {
          return wantAny.includes(cellVal);
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

  const paginated = computed(() => isServerSide.value || toValue(options.paginate ?? true));

  // The page shown, client-side: `page` clamped to the pages there are, whoever wrote it — a
  // shrinking data set or a hydrated ?page=99 leaves it past the end.
  const clientPage = computed(
    () => Math.max(1, Math.min(Math.trunc(page.value), Math.ceil(sortedData.value.length / perPage.value))) || 1,
  );

  const displayData = computed<DataGridRow[]>(() => {
    if (isServerSide.value) return rawData.value;
    if (!paginated.value) return sortedData.value;
    const start = (clientPage.value - 1) * perPage.value;
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
    // Unpaged, every row is on the one page, whatever `page` was left at.
    if (!paginated.value) {
      return { current_page: 1, last_page: 1, per_page: perPage.value, total, from: total ? 1 : null, to: total || null };
    }
    const current = clientPage.value;
    const lastPage = Math.max(1, Math.ceil(total / perPage.value));
    const from = total > 0 ? (current - 1) * perPage.value + 1 : null;
    const to = total > 0 ? Math.min(current * perPage.value, total) : null;

    return {
      current_page: current,
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
  // A ref, not a plain variable: `isDirty` is a computed, and must re-evaluate when only
  // the snapshot moves (markClean() right after a save, with no state change).
  const savedConfigSnapshot = ref(JSON.stringify(getDefaultConfig()));

  function getDefaultConfig(): DataGridViewConfig {
    return {
      columns: normaliseOrder(columns.map(defaultStateOf)),
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
    // A view saved before the definitions last changed may lack a column (it would
    // otherwise vanish from the grid and the column manager) or name a removed one.
    columnState.value = reconcileColumnState(config.columns.map((cs) => ({ ...cs })), columns);
    sort.value = config.sort ? { ...config.sort } : null;
    filters.value = config.filters.map((f) => ({ ...f }));
    perPage.value = config.perPage;
    viewMode.value = config.viewMode;
    filterPanelPinned.value = config.filterPanelPinned;
    page.value = 1;
    markClean();
  }

  const isDirty = computed(() =>
    JSON.stringify(getConfig()) !== savedConfigSnapshot.value,
  );

  function markClean() {
    savedConfigSnapshot.value = JSON.stringify(getConfig());
  }

  function resetToDefaults() {
    loadConfig(getDefaultConfig());
    clearSearch();
    clearSelection();
  }

  // Initialize from saved view
  if (initialView) {
    savedConfigSnapshot.value = JSON.stringify({ ...initialView, columns: columnState.value });
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
    columnGroupOf,
    isFrozen,
    columnUnits,
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
    reorderUnit,
    reorderGroup,
    moveColumn,
    moveGroup,
    viewMode,
    setViewMode,
    filterPanelOpen,
    filterPanelPinned,
    toggleFilterPanel,
    toggleFilterPanelPin,
    displayData,
    processedRows: sortedData,
    paginated,
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

/**
 * A column's label as the grid shows it out of context: "Reads · A1" under a group, since a
 * leaf label alone repeats per group (#461). Call in setup, under a CuiDataGrid.
 */
export function useColumnLabel(): (col: { key: string; label: string }) => string {
  const grid = useDataGridState();
  const messages = useMessages();
  return (col) => {
    const group = grid.columnGroupOf(col.key);
    return group ? messages.value.dataGrid.groupedColumn(group.label, col.label) : col.label;
  };
}

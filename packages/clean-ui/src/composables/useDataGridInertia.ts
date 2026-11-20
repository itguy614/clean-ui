import { watch } from "vue";
import type { DataGridContext } from "../components/data-grid-context";
import type { DataGridQueryParams } from "../types/data-grid";

/** The structural slice of Inertia's `router` these helpers call; no @inertiajs import. */
export interface DataGridInertiaRouter {
  // Method syntax, so the parameters are checked bivariantly: Inertia's own `router.get` takes
  // narrower `data`/`options` types and must still be assignable.
  get(url: string, data?: Record<string, unknown>, options?: Record<string, unknown>): void;
}

/** Visit options used unless the caller passes its own. */
const DEFAULT_VISIT_OPTIONS = { preserveState: true, preserveScroll: true } as const;

/**
 * Maps a CuiDataGrid `navigate` payload to the query object that `hydrateFromUrl` reads back:
 * `page` (omitted on page 1), `per_page`, `sort` + `direction`, `search` + `search_field`, and
 * `filter[key]` per filter. A multi-select value is comma-joined (`a,b`); a date range is
 * `from,to` (`YYYY-MM-DD,YYYY-MM-DD`). `extraParams` come first, so the grid's own keys win.
 */
export function dataGridQueryData(
  params: DataGridQueryParams,
  extraParams: Record<string, string> = {},
): Record<string, string> {
  const q: Record<string, string> = { ...extraParams };

  if (params.page && params.page > 1) q.page = String(params.page);
  if (params.perPage) q.per_page = String(params.perPage);

  if (params.sort) {
    q.sort = params.sort.key;
    q.direction = params.sort.direction;
  }

  if (params.search) {
    q.search = params.search;
    if (params.searchField) q.search_field = params.searchField;
  }

  if (params.filters) {
    for (const f of params.filters) {
      q[`filter[${f.key}]`] = Array.isArray(f.value) ? f.value.join(",") : f.value;
    }
  }

  return q;
}

export interface DataGridInertiaVisitOptions {
  /** Base URL for navigation (e.g., route('users.index')) */
  url: string;
  /** Inertia router instance — pass `router` from @inertiajs/vue3 */
  router: DataGridInertiaRouter;
  /** Extra query params to include in every navigation */
  extraParams?: Record<string, string>;
  /** Inertia visit options, merged over the default `{ preserveState: true, preserveScroll: true }` (pass `false` to opt out of one) */
  visitOptions?: Record<string, unknown>;
}

/**
 * A handler for CuiDataGrid's `navigate` event: `@navigate="visit"`. Visits `url` through the
 * Inertia router with the query from `dataGridQueryData`.
 */
export function dataGridInertiaVisit(
  options: DataGridInertiaVisitOptions,
): (params: DataGridQueryParams) => void {
  const { url, router, extraParams, visitOptions } = options;
  const merged = { ...DEFAULT_VISIT_OPTIONS, ...visitOptions };
  return (params) => {
    router.get(url, dataGridQueryData(params, extraParams), { ...merged });
  };
}

export interface UseDataGridInertiaOptions {
  /** The data grid context (from useDataGrid) */
  grid: DataGridContext;
  /** Base URL for navigation (e.g., route('users.index')) */
  url: string;
  /** Inertia router instance — pass `router` from @inertiajs/vue3 */
  router: DataGridInertiaRouter;
  /** Extra query params to include in every navigation */
  extraParams?: Record<string, string>;
}

/**
 * Optional Inertia adapter for CuiDataGrid.
 * Watches grid state changes and navigates via Inertia router.
 *
 * Usage:
 * ```ts
 * import { router } from '@inertiajs/vue3'
 * useDataGridInertia({ grid, url: route('users.index'), router })
 * ```
 */
export function useDataGridInertia(options: UseDataGridInertiaOptions) {
  const { grid, url, router, extraParams = {} } = options;

  const buildQueryData = (params: DataGridQueryParams) => dataGridQueryData(params, extraParams);
  const visit = dataGridInertiaVisit({ url, router, extraParams });

  function navigate() {
    visit(grid.getQueryParams());
  }

  // Watch sort, filters, search, page, perPage changes
  watch(
    [
      () => grid.sort.value,
      () => grid.filters.value,
      () => grid.searchQuery.value,
      () => grid.page.value,
      () => grid.perPage.value,
    ],
    () => {
      navigate();
    },
  );

  return { navigate, buildQueryData };
}

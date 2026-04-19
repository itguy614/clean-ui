import { watch } from "vue";
import type { DataGridContext } from "../components/data-grid-context";
import type { DataGridQueryParams } from "../types/data-grid";

export interface UseDataGridInertiaOptions {
  /** The data grid context (from useDataGrid) */
  grid: DataGridContext;
  /** Base URL for navigation (e.g., route('users.index')) */
  url: string;
  /** Inertia router instance — pass `router` from @inertiajs/vue3 */
  router: {
    get: (url: string, data?: Record<string, unknown>, options?: Record<string, unknown>) => void;
  };
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

  function buildQueryData(params: DataGridQueryParams): Record<string, string | undefined> {
    const q: Record<string, string | undefined> = { ...extraParams };

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
        const val = Array.isArray(f.value) ? f.value.join(",") : f.value;
        q[`filter[${f.key}]`] = val;
      }
    }

    return q;
  }

  function navigate() {
    const params = grid.getQueryParams();
    const data = buildQueryData(params);

    router.get(url, data as Record<string, unknown>, {
      preserveState: true,
      preserveScroll: true,
    });
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

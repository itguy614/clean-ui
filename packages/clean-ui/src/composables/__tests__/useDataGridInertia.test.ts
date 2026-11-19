import { afterEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { useDataGrid } from "../useDataGrid";
import { dataGridInertiaVisit, dataGridQueryData } from "../useDataGridInertia";
import type { DataGridColumn, DataGridQueryParams } from "../../types/data-grid";

describe("dataGridQueryData", () => {
  const cases: [string, DataGridQueryParams, Record<string, string | undefined>][] = [
    ["page 1 is omitted", { page: 1, perPage: 15 }, { per_page: "15" }],
    ["page > 1", { page: 3, perPage: 25 }, { page: "3", per_page: "25" }],
    ["sort", { sort: { key: "name", direction: "desc" } }, { sort: "name", direction: "desc" }],
    ["no sort", { sort: null }, {}],
    ["search with field", { search: "ann", searchField: "name" }, { search: "ann", search_field: "name" }],
    ["search without field", { search: "ann", searchField: null }, { search: "ann" }],
    ["empty search", { search: "" }, {}],
    [
      "filters (text, multi-select, date range)",
      {
        filters: [
          { key: "name", value: "ann", type: "text" },
          { key: "role", value: ["a", "b"], type: "multi-select" },
          { key: "joined", value: ["2024-01-01", "2024-02-01"], type: "date-range" },
        ],
      },
      { "filter[name]": "ann", "filter[role]": "a,b", "filter[joined]": "2024-01-01,2024-02-01" },
    ],
  ];

  it.each(cases)("%s", (_name, params, expected) => {
    expect(dataGridQueryData(params)).toEqual(expected);
  });

  it("puts extraParams first so the grid's keys win", () => {
    expect(dataGridQueryData({ page: 2 }, { team: "7", page: "9" })).toEqual({ team: "7", page: "2" });
  });
});

describe("dataGridQueryData round trip through hydrateFromUrl", () => {
  const columns: DataGridColumn[] = [
    { key: "name", label: "Name", sortable: true, filterable: true, filterType: "text" },
    { key: "role", label: "Role", filterable: true, filterType: "multi-select" },
    { key: "joined", label: "Joined", filterable: true, filterType: "date-range" },
    { key: "status", label: "Status", filterable: true, filterType: "select" },
  ];

  afterEach(() => history.replaceState(null, "", "/"));

  function roundTrip(params: DataGridQueryParams) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(dataGridQueryData(params))) q.set(k, v);
    return hydrate(q.toString());
  }

  function hydrate(search: string) {
    history.replaceState(null, "", `/?${search}`);
    const grid = useDataGrid({ columns, data: ref([]), serverSide: true, hydrateFromUrl: true });
    return grid.getQueryParams();
  }

  it("ignores empty or partial filter values and a bad page in a hand-written URL", () => {
    const back = hydrate("page=abc&filter[role]=&filter[joined]=2024-01-01");
    expect(back.filters).toBeUndefined();
    expect(back.page).toBe(1);
    expect(hydrate("page=-2").page).toBe(1);
  });

  it("restores page, per_page, sort, search and every filter type", () => {
    const params: DataGridQueryParams = {
      page: 4,
      perPage: 50,
      sort: { key: "name", direction: "desc" },
      search: "ann & bo",
      searchField: "name",
      filters: [
        { key: "name", value: "a,b [x]", type: "text" },
        { key: "role", value: ["admin", "editor"], type: "multi-select" },
        { key: "joined", value: ["2024-01-01", "2024-02-01"], type: "date-range" },
        { key: "status", value: "active", type: "select" },
      ],
    };
    const back = roundTrip(params);
    expect(back).toMatchObject({
      page: 4,
      perPage: 50,
      sort: params.sort,
      search: params.search,
      searchField: "name",
    });
    expect(back.filters).toEqual(params.filters);
  });

  it("restores a single-value multi-select as an array", () => {
    const back = roundTrip({ page: 1, perPage: 15, filters: [{ key: "role", value: ["admin"], type: "multi-select" }] });
    expect(back.filters).toEqual([{ key: "role", value: ["admin"], type: "multi-select" }]);
  });
});

describe("dataGridInertiaVisit", () => {
  const params: DataGridQueryParams = { page: 2, perPage: 10, sort: { key: "name", direction: "asc" } };

  it("visits the url with the query and the default options", () => {
    const get = vi.fn();
    dataGridInertiaVisit({ url: "/users", router: { get }, extraParams: { team: "7" } })(params);
    expect(get).toHaveBeenCalledExactlyOnceWith(
      "/users",
      { team: "7", page: "2", per_page: "10", sort: "name", direction: "asc" },
      { preserveState: true, preserveScroll: true },
    );
  });

  it("merges the caller's visit options over the defaults", () => {
    const get = vi.fn();
    dataGridInertiaVisit({ url: "/u", router: { get }, visitOptions: { replace: true, preserveScroll: false } })(params);
    expect(get.mock.calls[0]![2]).toEqual({ replace: true, preserveState: true, preserveScroll: false });
  });
});

import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { h, nextTick } from "vue";
import CuiDataGrid from "../CuiDataGrid.vue";
import type { DataGridRow, PaginatedData } from "../../types/data-grid";

/**
 * #372 — an app could neither read the rows the grid had searched, filtered and sorted, nor
 * move it to a page. #317 — `virtualize` windowed only the current page of a client-side
 * grid: 15 rows, however many there were.
 */

const columns = [
  { key: "name", label: "Name", sortable: true },
  { key: "n", label: "N", sortable: true },
];
const data: DataGridRow[] = Array.from({ length: 40 }, (_, i) => ({ id: String(i + 1), name: `Row ${i + 1}`, n: i + 1 }));

// The exposed members, as a template ref sees them (refs unwrapped).
interface Exposed {
  processedRows: DataGridRow[];
  page: number;
  lastPage: number;
  setPage: (n: number) => void;
}

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  w = undefined;
});

function mountGrid(props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) {
  w = mount(CuiDataGrid, {
    props: { columns, data, perPageOptions: [10], hideToolbar: true, ...props },
    slots,
    attachTo: document.body,
  });
  return { wrapper: w, api: w.vm as unknown as Exposed };
}

const bodyNames = () => w!.findAll("tbody tr").map((r) => r.find("td").text());
const pagination = () => w!.find(".cui-data-grid-pagination");

describe("CuiDataGrid exposed paging (#372)", () => {
  it("processedRows follows sort and search, and ignores paging", async () => {
    const { wrapper, api } = mountGrid({ hideToolbar: false, searchDebounce: 0 });
    expect(api.processedRows).toHaveLength(40);

    await wrapper.find("th button").trigger("click"); // Name ascending: string order
    expect(api.processedRows.slice(0, 3).map((r) => r.name)).toEqual(["Row 1", "Row 10", "Row 11"]);

    await wrapper.find('input[type="search"], .cui-data-grid-toolbar input').setValue("row 3");
    await nextTick();
    expect(api.processedRows.map((r) => r.name)).toEqual([
      "Row 3", "Row 30", "Row 31", "Row 32", "Row 33", "Row 34", "Row 35", "Row 36", "Row 37", "Row 38", "Row 39",
    ]);
  });

  it("processedRows follows filters", async () => {
    const { api } = mountGrid({
      initialView: { columns: [], sort: null, filters: [{ key: "name", value: "row 3", type: "select" }], perPage: 10, viewMode: "grid", filterPanelPinned: false },
    });
    expect(api.processedRows.map((r) => r.name)).toEqual(["Row 3"]);
  });

  it("setPage changes the visible page, and page/lastPage follow", async () => {
    const { api } = mountGrid();
    expect([api.page, api.lastPage]).toEqual([1, 4]);
    api.setPage(3);
    await nextTick();
    expect(api.page).toBe(3);
    expect(bodyNames()[0]).toBe("Row 21");
    expect(pagination().find('[aria-current="page"]').text()).toBe("3");
  });

  it("setPage clamps out-of-range values", async () => {
    const { api } = mountGrid();
    // In order: NaN is checked against the page the previous step left.
    for (const [asked, shown] of [[99, 4], [-5, 1], [2.7, 2], [Number.NaN, 2]]) {
      api.setPage(asked);
      await nextTick();
      expect(api.page).toBe(shown);
    }
  });

  it("server-side, setPage emits what a pagination click emits: one navigate", async () => {
    const page: PaginatedData = { data: data.slice(0, 10), current_page: 1, last_page: 4, per_page: 10, total: 40, from: 1, to: 10 };

    const { wrapper: clicked } = mountGrid({ serverSide: true, data: page });
    await clicked.find('.cui-data-grid-pagination button[aria-label="Page 2"]').trigger("click");
    await nextTick();
    const fromClick = clicked.emitted("navigate");
    clicked.unmount();

    const { wrapper, api } = mountGrid({ serverSide: true, data: page });
    expect(api.processedRows).toHaveLength(10); // the page the server sent
    api.setPage(2);
    await nextTick();
    expect(fromClick?.length).toBe(1);
    expect(wrapper.emitted("navigate")).toEqual(fromClick);

    // The server hasn't answered: asking for page 2 again sends nothing, and going back
    // to 1 still works — "current" is the page asked for, not the stale one shown.
    api.setPage(2);
    await nextTick();
    expect(wrapper.emitted("navigate")).toHaveLength(1);
    api.setPage(1);
    await nextTick();
    api.setPage(99); // clamped to the server's last page
    await nextTick();
    expect(wrapper.emitted("navigate")!.map(([p]) => (p as { page: number }).page)).toEqual([2, 1, 4]);
  });

  it("server-side, a last_page of 0 (no results) never asks for page 0", async () => {
    const empty: PaginatedData = { data: [], current_page: 1, last_page: 0, per_page: 10, total: 0, from: null, to: null };
    const { wrapper, api } = mountGrid({ serverSide: true, data: empty });
    api.setPage(3);
    await nextTick();
    expect(wrapper.emitted("navigate")).toBeUndefined();
  });

  it("page never reads past lastPage when the data shrinks", async () => {
    const { wrapper, api } = mountGrid();
    api.setPage(4);
    await nextTick();
    await wrapper.setProps({ data: data.slice(0, 12) });
    expect([api.page, api.lastPage]).toEqual([2, 2]);
    expect(bodyNames()).toEqual(["Row 11", "Row 12"]);
  });
});

describe("CuiDataGrid virtualize turns client-side paging off (#317)", () => {
  it("windows every processed row and hides the pagination bar", async () => {
    const { wrapper, api } = mountGrid({ virtualize: true, maxHeight: "200px", perPageOptions: [15, 25] });
    await nextTick();
    expect(pagination().exists()).toBe(false);
    // The table reports the whole set (plus its header row), not one page of 15.
    expect(wrapper.find("table").attributes("aria-rowcount")).toBe("41");
    expect([api.page, api.lastPage]).toEqual([1, 1]);
    expect(api.processedRows).toHaveLength(40);

    api.setPage(3); // nowhere to go while unpaged
    await nextTick();
    expect(api.page).toBe(1);
  });

  it("card view, which is not virtualized, keeps paging", async () => {
    const { api } = mountGrid(
      { virtualize: true, maxHeight: "200px", initialView: { columns: [], sort: null, filters: [], perPage: 10, viewMode: "card", filterPanelPinned: false } },
      { card: ({ row }: { row: DataGridRow }) => h("div", { class: "card" }, String(row.name)) },
    );
    await nextTick();
    expect(w!.findAll(".card")).toHaveLength(10);
    expect(pagination().exists()).toBe(true);
    expect(api.lastPage).toBe(4);
  });

  it("server-side still pages", async () => {
    const page: PaginatedData = { data: data.slice(0, 10), current_page: 2, last_page: 4, per_page: 10, total: 40, from: 11, to: 20 };
    const { api } = mountGrid({ serverSide: true, data: page, virtualize: true, maxHeight: "200px" });
    await nextTick();
    expect(pagination().exists()).toBe(true);
    expect([api.page, api.lastPage]).toEqual([2, 4]);
  });
});

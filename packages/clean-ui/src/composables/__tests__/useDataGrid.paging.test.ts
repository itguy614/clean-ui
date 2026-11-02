import { describe, it, expect } from "vitest";
import { ref } from "vue";
import { useDataGrid } from "../useDataGrid";
import type { DataGridRow } from "../../types/data-grid";

const columns = [{ key: "name", label: "Name" }];
const rows = (n: number): DataGridRow[] => Array.from({ length: n }, (_, i) => ({ id: String(i + 1), name: `Row ${i + 1}` }));

describe("useDataGrid setPage (#372)", () => {
  it("server-side over a plain array has no last page to clamp to", () => {
    // The server sends one page as an array (useDataGridInertia); the grid can't know how many follow.
    const grid = useDataGrid({ columns, data: ref(rows(10)), serverSide: true, defaultPerPage: 10 });
    expect(grid.setPage(2)).toBe(true);
    expect(grid.page.value).toBe(2);
  });

  it("clamps a hydrated or stale page when reading it", () => {
    const grid = useDataGrid({ columns, data: ref(rows(25)), defaultPerPage: 10 });
    grid.page.value = 99;
    expect(grid.paginationMeta.value.current_page).toBe(3);
    expect(grid.displayData.value.map((r) => r.name)).toEqual(["Row 21", "Row 22", "Row 23", "Row 24", "Row 25"]);
    grid.page.value = Number.NaN;
    expect(grid.paginationMeta.value.current_page).toBe(1);
  });

  it("paginate: false makes displayData every processed row", () => {
    const grid = useDataGrid({ columns, data: ref(rows(25)), defaultPerPage: 10, paginate: false });
    expect(grid.displayData.value).toHaveLength(25);
    expect(grid.paginationMeta.value).toMatchObject({ current_page: 1, last_page: 1, from: 1, to: 25 });
  });
});

import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import CuiDataGrid from "../CuiDataGrid.vue";
import type { DataGridColumn, DataGridRow } from "../../types/data-grid";

const columns: DataGridColumn[] = [
  { key: "name", label: "Name", sticky: true, width: "160px" },
  { key: "email", label: "Email", sticky: true, width: "200px" },
  { key: "role", label: "Role", width: "140px" },
];

const data: DataGridRow[] = [
  { id: "1", name: "Alice", email: "a@x.com", role: "Eng" },
  { id: "2", name: "Bob", email: "b@x.com", role: "Design" },
];

function headerCells(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll("thead th, thead td");
}

describe("CuiDataGrid sticky columns", () => {
  it("pins a sticky-column header cell on BOTH axes (top + left) so it stays put on vertical scroll", () => {
    const wrapper = mount(CuiDataGrid, {
      props: { columns, data, maxHeight: "320px", hideToolbar: true },
    });
    // First header cell is the sticky "Name" column.
    const style = headerCells(wrapper)[0].attributes("style") ?? "";
    expect(style).toContain("position: sticky");
    expect(style).toContain("left:"); // horizontal pin (sticky column)
    expect(style).toContain("top:"); // vertical pin (sticky header) — the regression
    wrapper.unmount();
  });

  it("layers the sticky-header corner cell above the regular header row", () => {
    const wrapper = mount(CuiDataGrid, {
      props: { columns, data, maxHeight: "320px", hideToolbar: true },
    });
    const cells = headerCells(wrapper);
    const stickyStyle = cells[0].attributes("style") ?? "";
    // Corner cell uses a higher z-index (11) than the regular sticky-header row (10).
    expect(stickyStyle).toMatch(/z-index:\s*11/);
    wrapper.unmount();
  });

  it("pins the bulk-select (checkbox) header cell to the top so it rides the sticky header", () => {
    const wrapper = mount(CuiDataGrid, {
      props: {
        columns,
        data: data.map((r) => ({ ...r, _actions: [{ key: "edit", label: "Edit" }] })),
        bulkActions: [{ key: "delete", label: "Delete" }],
        maxHeight: "320px",
        hideToolbar: true,
      },
    });
    // First header cell is the select-all checkbox column.
    const style = headerCells(wrapper)[0].attributes("style") ?? "";
    expect(style).toContain("position: sticky");
    expect(style).toContain("top:");
    wrapper.unmount();
  });

  it("does not pin a non-sticky column header to the left", () => {
    const wrapper = mount(CuiDataGrid, {
      props: { columns, data, maxHeight: "320px", hideToolbar: true },
    });
    // The "Role" column is not sticky → no left offset inline.
    const roleStyle = headerCells(wrapper)[2].attributes("style") ?? "";
    expect(roleStyle).not.toContain("left:");
    wrapper.unmount();
  });
});

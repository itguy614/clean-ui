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

const bulkActions = [{ key: "delete", label: "Delete" }];

function headerCells(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll("thead th");
}

describe("CuiDataGrid sticky columns", () => {
  it("renders header cells as <th scope=col>", () => {
    const wrapper = mount(CuiDataGrid, {
      props: { columns, data, maxHeight: "320px", hideToolbar: true },
    });
    expect(wrapper.findAll("thead td")).toHaveLength(0);
    expect(headerCells(wrapper)[0].attributes("scope")).toBe("col");
    wrapper.unmount();
  });

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
        bulkActions,
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

  it("pins the bulk-select column left, on both axes, when a data column is frozen", () => {
    const wrapper = mount(CuiDataGrid, {
      props: { columns, data, bulkActions, maxHeight: "320px", hideToolbar: true },
    });
    const header = headerCells(wrapper)[0].attributes("style") ?? "";
    expect(header).toMatch(/left:\s*0(px)?;/);
    expect(header).toMatch(/z-index:\s*11/);
    const body = wrapper.find("tbody tr td").attributes("style") ?? "";
    expect(body).toContain("position: sticky");
    expect(body).toMatch(/left:\s*0(px)?;/);
    // The frozen data columns start after it, at the summed widths as written.
    expect(headerCells(wrapper)[1].attributes("style")).toMatch(/left:\s*3rem/);
    expect(headerCells(wrapper)[2].attributes("style")).toMatch(/left:\s*calc\((3rem \+ 160px|160px \+ 3rem)\)/);
    wrapper.unmount();
  });

  it("falls back for a width that is not a length, rather than voiding the sum", () => {
    const wrapper = mount(CuiDataGrid, {
      props: {
        columns: [{ ...columns[0], width: "auto" }, columns[1], columns[2]],
        data,
        bulkActions,
        maxHeight: "320px",
        hideToolbar: true,
      },
    });
    // "auto" pins at the start and adds nothing, as parseInt's 0 used to.
    expect(headerCells(wrapper)[2].attributes("style")).toMatch(/left:\s*3rem/);
    expect(wrapper.find("table").attributes("style")).toMatch(/min-width:\s*calc\(/);
    wrapper.unmount();
  });

  it("reads a bare-number width as px, rather than voiding the sum", () => {
    const wrapper = mount(CuiDataGrid, {
      props: {
        columns: [{ ...columns[0], width: "120" }, columns[1], columns[2]],
        data,
        bulkActions,
        maxHeight: "320px",
        hideToolbar: true,
      },
    });
    expect(headerCells(wrapper)[2].attributes("style")).toMatch(/left:\s*calc\((3rem \+ 120px|120px \+ 3rem)\)/);
    wrapper.unmount();
  });

  it("leaves the bulk-select column unpinned when no data column is frozen", () => {
    const wrapper = mount(CuiDataGrid, {
      props: {
        columns: columns.map((c) => ({ ...c, sticky: false })),
        data,
        bulkActions,
        maxHeight: "320px",
        hideToolbar: true,
      },
    });
    expect(headerCells(wrapper)[0].attributes("style")).not.toContain("left:");
    expect(wrapper.find("tbody tr td").attributes("style") ?? "").not.toContain("position: sticky");
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

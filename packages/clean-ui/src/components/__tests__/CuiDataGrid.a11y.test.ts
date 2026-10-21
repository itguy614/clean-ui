import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { h } from "vue";
import CuiDataGrid from "../CuiDataGrid.vue";

/**
 * #161 — sorting was a click handler on the <th>, unreachable by keyboard and unannounced,
 * and the checkboxes, row-actions buttons and view toggle were unnamed.
 */

const columns = [
  { key: "name", label: "Name", sortable: true },
  { key: "role", label: "Role" },
];
const data = [
  { id: 1, name: "Alice", role: "Dev", _actions: [{ key: "edit", label: "Edit" }] },
  { id: 2, name: "Bob", role: "Ops", _actions: [{ key: "edit", label: "Edit" }] },
];

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  w = undefined;
});

function mountGrid(props: Record<string, unknown> = {}) {
  w = mount(CuiDataGrid, {
    props: { columns, data, hideToolbar: true, bulkActions: [{ key: "delete", label: "Delete" }], ...props },
    attachTo: document.body,
  });
  return w;
}

const nameHeader = () => w!.findAll("thead th").find((th) => th.text().includes("Name"))!;

describe("CuiDataGrid sorting and naming", () => {
  it("makes a sortable header a button, and says how it's sorted with aria-sort", async () => {
    mountGrid();
    const button = nameHeader().find("button.cui-data-grid-table__sort");
    expect(button.exists()).toBe(true);
    expect(button.text()).toBe("Name");
    expect(nameHeader().attributes("aria-sort")).toBeUndefined(); // only the sorted column has it

    await button.trigger("click");
    expect(nameHeader().attributes("aria-sort")).toBe("ascending");
    await button.trigger("click");
    expect(nameHeader().attributes("aria-sort")).toBe("descending");
  });

  it("leaves an unsortable header as plain text, with no aria-sort", () => {
    mountGrid();
    const role = w!.findAll("thead th").find((th) => th.text().includes("Role"))!;
    expect(role.find("button").exists()).toBe(false);
    expect(role.attributes("aria-sort")).toBeUndefined();
  });

  it("names the select-all checkbox and each row's checkbox after its row", () => {
    mountGrid();
    const boxes = w!.findAll('[role="checkbox"]');
    expect(boxes.map((b) => b.attributes("aria-label"))).toEqual(["Select all rows", "Select Alice", "Select Bob"]);
  });

  it("names a row by its position when its first column isn't text or a number", () => {
    mountGrid({ data: data.map((r) => ({ ...r, name: { first: r.name } })) });
    const boxes = w!.findAll('[role="checkbox"]').slice(1);
    expect(boxes.map((b) => b.attributes("aria-label"))).toEqual(["Select row 1", "Select row 2"]);
  });

  it("takes a consumer's rowLabel", () => {
    mountGrid({ rowLabel: (row: { name: string; role: string }) => `${row.name} (${row.role})` });
    expect(w!.findAll('[role="checkbox"]')[1].attributes("aria-label")).toBe("Select Alice (Dev)");
  });

  it("names each row's actions button after its row", () => {
    mountGrid();
    const names = w!.findAll(".cui-dropdown-trigger button").map((b) => b.attributes("aria-label"));
    expect(names).toEqual(["Actions for Alice", "Actions for Bob"]);
  });

  it("names the view toggle's buttons and marks the active one pressed", () => {
    w = mount(CuiDataGrid, {
      props: { columns, data },
      slots: { card: ({ row }: { row: { name: string } }) => h("div", row.name) },
      attachTo: document.body,
    });
    const toggle = w.findAll(".cui-data-grid-view-toggle button");
    expect(toggle.map((b) => b.attributes("aria-label"))).toEqual(["Table view", "Card view"]);
    expect(toggle.map((b) => b.attributes("aria-pressed"))).toEqual(["true", "false"]);
  });
});

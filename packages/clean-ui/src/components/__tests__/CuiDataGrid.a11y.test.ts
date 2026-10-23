import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import CuiDataGrid from "../CuiDataGrid.vue";
import CuiConfigProvider from "../CuiConfigProvider.vue";

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

// #373 — the toolbar's search box had only a placeholder, which is no accessible name, and
// its clear button only an icon.
describe("CuiDataGrid toolbar search names", () => {
  const nameOf = (input: HTMLElement) =>
    (input.getAttribute("aria-labelledby") ?? "")
      .split(" ")
      .map((id) => document.getElementById(id)?.textContent?.trim())
      .join(" ");
  const searchBox = () => document.querySelector<HTMLInputElement>(".cui-data-grid-search input")!;

  it("names the search box 'Search' by default", () => {
    mountGrid({ hideToolbar: false });
    expect(nameOf(searchBox())).toBe("Search");
  });

  it("takes a name from searchLabel", () => {
    mountGrid({ hideToolbar: false, searchLabel: "Search tags" });
    expect(nameOf(searchBox())).toBe("Search tags");
  });

  it("names the clear button, and hands focus back to the box when it clears", async () => {
    mountGrid({ hideToolbar: false, searchDebounce: 0 });
    await w!.find(".cui-data-grid-search input").setValue("ali");
    const clear = w!.find(".cui-data-grid-search .cui-input__clear");
    expect(clear.attributes("aria-label")).toBe("Clear input");
    await clear.trigger("click");
    expect(searchBox().value).toBe("");
    expect(document.activeElement, "not dropped to the body").toBe(searchBox());
  });

  it("names the box in the catalogue's language, from its search text", () => {
    w = mount(
      defineComponent({
        render: () =>
          h(CuiConfigProvider, { messages: { dataGrid: { search: "Rechercher…" } } }, () =>
            h(CuiDataGrid, { columns, data }),
          ),
      }),
      { attachTo: document.body },
    );
    expect(nameOf(searchBox())).toBe("Rechercher");
  });
});

// #373, found in review — two controls in the saved-views menu were unnamed too.
describe("CuiDataGrid saved-views menu names", () => {
  it("names each view's delete button and the save-as field", async () => {
    const view = { id: "v1", name: "Mine", config: {} };
    const adapter = { load: async () => [view], save: async () => {}, remove: async () => {} };
    w = mount(CuiDataGrid, { props: { columns, data, gridId: "g", viewAdapter: adapter }, attachTo: document.body });
    await new Promise((r) => setTimeout(r));
    const trigger = [...w.findAll(".cui-button")].find((b) => b.text().includes("Views"))!;
    await trigger.trigger("click");
    await new Promise((r) => setTimeout(r));
    const del = document.querySelector<HTMLButtonElement>('.cui-dropdown-menu button[aria-label="Delete view Mine"]');
    expect(del, "the delete button is named for its view").not.toBeNull();
    const saveAs = [...document.querySelectorAll<HTMLElement>(".cui-dropdown-item")].find((el) => el.textContent?.includes("Save as"))!;
    saveAs.click();
    await new Promise((r) => setTimeout(r));
    const field = document.querySelector<HTMLInputElement>(".cui-dropdown-menu input")!;
    expect(document.getElementById(field.getAttribute("aria-labelledby")!)?.textContent).toBe("View name");
  });
});

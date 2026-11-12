import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { h, nextTick } from "vue";
import CuiDataGrid from "../CuiDataGrid.vue";
import CuiConfigProvider from "../CuiConfigProvider.vue";
import type { DataGridColumnDef, DataGridRow } from "../../types/data-grid";

/** #465 (frozen columns in the column manager) and #461 (group names in filters and cards). */

const columns: DataGridColumnDef[] = [
  { key: "n1", label: "Name" },
  { key: "epc", label: "EPC", sticky: true, width: "100px" },
  {
    label: "Reads",
    children: [
      { key: "r1", label: "A1", filterable: true, filterType: "text" },
      { key: "r2", label: "A2" },
    ],
  },
  { label: "RSSI", children: [{ key: "s1", label: "A1", filterable: true, filterType: "text" }] },
];
const data: DataGridRow[] = [{ id: 1, n1: "x", epc: "e1", r1: 1, r2: 2, s1: -40 }];

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  w = undefined;
  document.body.innerHTML = "";
});

const rows = () => [...document.body.querySelectorAll<HTMLElement>(".cui-data-grid-column-manager__row")];
const rowOf = (text: string) => rows().find((r) => r.textContent?.includes(text))!;

async function openManager(cols: DataGridColumnDef[] = columns) {
  w = mount(CuiDataGrid, { props: { columns: cols, data }, attachTo: document.body });
  await w.find(".cui-data-grid-column-manager button").trigger("click");
  await nextTick();
}

describe("the column manager and frozen columns", () => {
  it("lists the frozen column first, with a named lock, no handle, no move buttons, not draggable", async () => {
    await openManager();
    expect(rows().map((r) => r.textContent?.trim().replace(/\s+/g, " "))[0]).toContain("EPC");
    const epc = rowOf("EPC");
    const lock = epc.querySelector<HTMLElement>(".cui-data-grid-column-manager__lock")!;
    expect(lock.getAttribute("aria-label")).toBe("EPC is frozen and stays in place");
    expect(epc.getAttribute("draggable")).toBe("false");
    expect(epc.querySelector("button")).toBeNull();
    // a normal row keeps its handle and buttons
    const name = rowOf("Name");
    expect(name.getAttribute("draggable")).toBe("true");
    expect(name.querySelector(".cui-data-grid-column-manager__lock")).toBeNull();
    expect(name.querySelectorAll("button").length).toBe(2);
  });

  it("stops the first normal row moving up into the frozen block", async () => {
    await openManager();
    expect(document.body.querySelector<HTMLButtonElement>('button[aria-label="Move Name up"]')!.disabled).toBe(true);
    expect(document.body.querySelector<HTMLButtonElement>('button[aria-label="Move Name down"]')!.disabled).toBe(false);
  });

  it("refuses a drop onto a frozen row (no indicator, dropEffect none)", async () => {
    await openManager();
    const dt = { effectAllowed: "", dropEffect: "", setData() {} };
    const fire = (el: HTMLElement, type: string) => {
      const e = new Event(type, { bubbles: true, cancelable: true });
      (e as unknown as { dataTransfer: unknown }).dataTransfer = dt;
      el.dispatchEvent(e);
      return e;
    };
    fire(rowOf("Name"), "dragstart");
    const over = fire(rowOf("EPC"), "dragover");
    expect(dt.dropEffect).toBe("none");
    expect(over.defaultPrevented).toBe(false);
    await nextTick();
    expect(rowOf("EPC").classList.contains("cui-data-grid-column-manager__row--drop")).toBe(false);
  });

  it("freezes a group wholly: lock on the group and its leaves, none movable", async () => {
    await openManager([
      { key: "n1", label: "Name" },
      { label: "Reads", children: [{ key: "r1", label: "A1", sticky: true }, { key: "r2", label: "A2", sticky: true }] },
    ]);
    const locks = document.body.querySelectorAll(".cui-data-grid-column-manager__lock");
    expect(locks).toHaveLength(3);
    expect(rowOf("Reads").querySelector("button")).toBeNull();
    expect(rowOf("A1").querySelector("button")).toBeNull();
  });
});

describe("group names in filters (#461)", () => {
  it("shows the group in the active-filter chip", async () => {
    w = mount(CuiDataGrid, {
      props: {
        columns,
        data,
        hideToolbar: false,
        initialView: {
          columns: [],
          sort: null,
          filters: [{ key: "r1", value: "1", type: "text" }],
          perPage: 10,
          viewMode: "grid",
          filterPanelPinned: false,
        },
      },
      attachTo: document.body,
    });
    await nextTick();
    expect(w.find(".cui-data-grid-active-filters").text()).toContain("Reads · A1: 1");
  });

  it("names the group in the filter panel, so the two A1 fields differ", async () => {
    w = mount(CuiDataGrid, { props: { columns, data, hideToolbar: false }, attachTo: document.body });
    const toggle = w.findAll("button").find((b) => /filter/i.test(b.text() + (b.attributes("aria-label") ?? "")));
    await toggle!.trigger("click");
    await nextTick();
    const labels = [...document.body.querySelectorAll(".cui-data-grid-filter-panel__label")].map((l) => l.textContent?.trim());
    expect(labels).toEqual(["Reads · A1", "RSSI · A1"]);
  });

  it("takes the format from the message catalogue", async () => {
    w = mount(CuiConfigProvider, {
      props: { messages: { dataGrid: { groupedColumn: (g: string, c: string) => `${c} (${g})` } } },
      slots: {
        default: () =>
          h(CuiDataGrid, {
            columns,
            data,
            hideToolbar: false,
            initialView: {
              columns: [],
              sort: null,
              filters: [{ key: "s1", value: "9", type: "text" }],
              perPage: 10,
              viewMode: "grid",
              filterPanelPinned: false,
            },
          }),
      },
      attachTo: document.body,
    });
    await nextTick();
    expect(w.find(".cui-data-grid-active-filters").text()).toContain("A1 (RSSI): 9");
  });

  it("hands the card slot a columnLabel that names the group", async () => {
    let label: ((key: string) => string) | undefined;
    w = mount(CuiDataGrid, {
      props: {
        columns,
        data,
        initialView: {
          columns: [],
          sort: null,
          filters: [],
          perPage: 10,
          viewMode: "card",
          filterPanelPinned: false,
        },
      },
      slots: {
        card: (p: { row: DataGridRow; columnLabel: (key: string) => string }) => {
          label = p.columnLabel;
          return h("div", { class: "card" }, `${p.columnLabel("r1")} / ${p.columnLabel("n1")}`);
        },
      },
      attachTo: document.body,
    });
    await nextTick();
    expect(label).toBeDefined();
    expect(w.find(".card").text()).toBe("Reads · A1 / Name");
  });
});

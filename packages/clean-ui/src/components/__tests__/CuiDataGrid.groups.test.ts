import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { h, nextTick, ref } from "vue";
import CuiDataGrid from "../CuiDataGrid.vue";
import CuiConfigProvider from "../CuiConfigProvider.vue";
import { useDataGrid } from "../../composables/useDataGrid";
import type { DataGridColumnDef, DataGridRow } from "../../types/data-grid";

/** #376 — column groups (a two-row header) and the header slot. */

const columns: DataGridColumnDef[] = [
  { key: "epc", label: "EPC", sortable: true },
  {
    label: "Reads",
    children: [
      { key: "r1", label: "A1", sortable: true },
      { key: "r2", label: "A2", sortable: true },
      { key: "r3", label: "A3" },
    ],
  },
  { label: "RSSI (dBm)", children: [{ key: "s1", label: "A1" }, { key: "s2", label: "A2" }] },
  { key: "note", label: "Note" },
];
const data: DataGridRow[] = [
  { id: 1, epc: "e1", r1: 5, r2: 3, r3: 1, s1: -40, s2: -50, note: "x" },
  { id: 2, epc: "e2", r1: 2, r2: 9, r3: 4, s1: -60, s2: -70, note: "y" },
];

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  w = undefined;
  document.body.innerHTML = "";
});

function mountGrid(props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) {
  w = mount(CuiDataGrid, {
    props: { columns, data, hideToolbar: true, ...props },
    slots: slots as never,
    attachTo: document.body,
  });
  return w;
}

const headRows = () => w!.findAll("thead tr");
const cellsOf = (row: number) => headRows()[row].findAll("th");
const th = (text: string, row?: number) =>
  (row === undefined ? w!.findAll("thead th") : cellsOf(row)).find((c) => c.text() === text)!;

// A manager checkbox: what it shows, and the name it is announced by.
const managerChecks = () =>
  [...document.body.querySelectorAll<HTMLElement>(".cui-checkbox")].map((el) => ({
    el,
    visible: el.querySelector("[aria-hidden=true]:not(input)")?.textContent?.trim() ?? el.textContent?.trim(),
    name: el.querySelector(".cui-sr-only:not(input)")?.textContent?.trim() ?? el.textContent?.trim(),
  }));

describe("CuiDataGrid column groups", () => {
  it("renders a two-row header with colspan over the leaves and rowspan 2 for ungrouped columns", () => {
    mountGrid();
    expect(headRows()).toHaveLength(2);
    expect(cellsOf(0).map((c) => c.text())).toEqual(["EPC", "Reads", "RSSI (dBm)", "Note"]);
    expect(cellsOf(1).map((c) => c.text())).toEqual(["A1", "A2", "A3", "A1", "A2"]);

    expect(th("Reads", 0).attributes("colspan")).toBe("3");
    expect(th("RSSI (dBm)", 0).attributes("colspan")).toBe("2");
    expect(th("EPC", 0).attributes("rowspan")).toBe("2");
    expect(th("Note", 0).attributes("rowspan")).toBe("2");
    expect(th("Reads", 0).attributes("rowspan")).toBeUndefined();
  });

  it("keeps a flat grid as a single header row with no spans", () => {
    mountGrid({ columns: [{ key: "a", label: "A" }, { key: "b", label: "B" }] });
    expect(headRows()).toHaveLength(1);
    expect(w!.findAll("thead th").every((c) => !c.attributes("rowspan") && !c.attributes("colspan"))).toBe(true);
  });

  it("spans the select-all and actions cells over both rows", () => {
    mountGrid({
      bulkActions: [{ key: "delete", label: "Delete" }],
      data: data.map((r) => ({ ...r, _actions: [{ key: "edit", label: "Edit" }] })),
    });
    const first = cellsOf(0);
    expect(first[0].attributes("rowspan")).toBe("2");
    expect(first[first.length - 1].attributes("rowspan")).toBe("2");
  });

  it("gives leaves their group as accessible context", () => {
    mountGrid();
    const reads = th("Reads", 0);
    expect(reads.attributes("scope")).toBe("colgroup");
    expect(reads.attributes("id")).toBeTruthy();
    const [a1, , , rssiA1] = cellsOf(1);
    expect(a1.attributes("scope")).toBe("col");
    expect(a1.attributes("headers")).toBe(reads.attributes("id"));
    expect(rssiA1.attributes("headers")).toBe(th("RSSI (dBm)", 0).attributes("id"));
    expect(rssiA1.attributes("headers")).not.toBe(a1.attributes("headers"));
  });

  it("sorts from a leaf header and puts aria-sort on that leaf", async () => {
    mountGrid();
    const button = () => cellsOf(1)[1].find("button.cui-data-grid-table__sort");
    expect(button().text()).toBe("A2");
    expect(cellsOf(1)[1].attributes("aria-sort")).toBeUndefined();

    await button().trigger("click");
    expect(cellsOf(1)[1].attributes("aria-sort")).toBe("ascending");
    expect(w!.findAll("tbody tr")[0].text()).toContain("e1"); // r2: 3 before 9
    await button().trigger("click");
    expect(cellsOf(1)[1].attributes("aria-sort")).toBe("descending");
    expect(w!.findAll("tbody tr")[0].text()).toContain("e2");
    // the group cell and the other leaves carry none
    expect(th("Reads", 0).attributes("aria-sort")).toBeUndefined();
    expect(cellsOf(1)[0].attributes("aria-sort")).toBeUndefined();
  });

  it("shrinks a group's span when a leaf is hidden, and drops the group when all are", async () => {
    mountGrid({ initialView: { columns: [{ key: "r3", visible: false }] } });
    expect(th("Reads", 0).attributes("colspan")).toBe("2");
    expect(cellsOf(1).map((c) => c.text())).toEqual(["A1", "A2", "A1", "A2"]);

    w!.unmount();
    mountGrid({
      initialView: {
        columns: [
          { key: "s1", visible: false },
          { key: "s2", visible: false },
        ],
      },
    });
    expect(cellsOf(0).map((c) => c.text())).toEqual(["EPC", "Reads", "Note"]);

    w!.unmount();
    mountGrid({
      initialView: { columns: ["r1", "r2", "r3", "s1", "s2"].map((key) => ({ key, visible: false })) },
    });
    // nothing grouped is showing: back to a single row, no stray spans
    expect(headRows()).toHaveLength(1);
    expect(cellsOf(0).map((c) => c.text())).toEqual(["EPC", "Note"]);
    expect(cellsOf(0).every((c) => !c.attributes("rowspan"))).toBe(true);
  });

  it("follows the column manager: hiding a leaf from it shrinks the span", async () => {
    mountGrid({ hideToolbar: false });
    await w!.find(".cui-data-grid-column-manager button").trigger("click");
    await nextTick();
    managerChecks().find((c) => c.name === "Reads · A3")!.el.click();
    await nextTick();
    expect(th("Reads", 0).attributes("colspan")).toBe("2");
  });

  it("shows a grouped leaf's plain label in the manager, and names it with its group", async () => {
    mountGrid({ hideToolbar: false });
    await w!.find(".cui-data-grid-column-manager button").trigger("click");
    await nextTick();
    const checks = managerChecks();
    expect(checks.map((c) => c.visible)).toEqual(["EPC", "A1", "A2", "A3", "A1", "A2", "Note"]);
    expect(checks.map((c) => c.name)).toEqual([
      "EPC", "Reads · A1", "Reads · A2", "Reads · A3", "RSSI (dBm) · A1", "RSSI (dBm) · A2", "Note",
    ]);
    // the group name never shows beside a leaf: only as its own header row
    expect(checks[1].visible).not.toContain("·");
    expect(document.body.querySelector('button[aria-label="Move Reads · A2 up"]')).not.toBeNull();
  });

  it("takes the group/leaf format of a leaf's name from the message catalogue", async () => {
    w = mount(CuiConfigProvider, {
      props: { messages: { dataGrid: { groupedColumn: (g: string, c: string) => `${c} (${g})` } } },
      slots: { default: () => h(CuiDataGrid, { columns, data, hideToolbar: false }) },
      attachTo: document.body,
    });
    await w.find(".cui-data-grid-column-manager button").trigger("click");
    await nextTick();
    const names = managerChecks().map((c) => c.name);
    expect(names).toContain("A1 (Reads)");
    expect(names).not.toContain("Reads · A1");
  });

  it("takes the move buttons' labels and announcement from the message catalogue", async () => {
    w = mount(CuiConfigProvider, {
      props: {
        messages: {
          dataGrid: {
            moveUp: (n: string) => `Hoch ${n}`,
            moveDown: (n: string) => `Runter ${n}`,
            moved: (n: string, p: number, t: number) => `${n}: ${p}/${t}`,
          },
        },
      },
      slots: { default: () => h(CuiDataGrid, { columns, data, hideToolbar: false }) },
      attachTo: document.body,
    });
    await w.find(".cui-data-grid-column-manager button").trigger("click");
    await nextTick();
    document.body.querySelector<HTMLButtonElement>('button[aria-label="Runter Reads"]')!.click();
    await nextTick();
    expect(document.body.querySelector("[role=status]")!.textContent).toBe("Reads: 3/4");
  });

  it("refuses a drop outside the group in the column manager, and allows one inside", async () => {
    mountGrid({ hideToolbar: false });
    await w!.find(".cui-data-grid-column-manager button").trigger("click");
    await nextTick();
    const row = (text: string) =>
      [...document.body.querySelectorAll<HTMLElement>(".cui-data-grid-column-manager__row")].find((r) =>
        r.textContent?.includes(text),
      )!;
    const dataTransfer = () => ({ effectAllowed: "", dropEffect: "", setData() {} });
    const fire = (el: HTMLElement, type: string, dt: unknown) => {
      const e = new Event(type, { bubbles: true, cancelable: true });
      (e as unknown as { dataTransfer: unknown }).dataTransfer = dt;
      el.dispatchEvent(e);
      return e;
    };
    const dt = dataTransfer();
    fire(row("Reads · A1"), "dragstart", dt);
    const outside = fire(row("RSSI (dBm) · A1"), "dragover", dt);
    expect(dt.dropEffect).toBe("none");
    expect(outside.defaultPrevented).toBe(false);
    expect(row("RSSI (dBm) · A1").classList.contains("cui-data-grid-column-manager__row--drop")).toBe(false);
    // a browser fires no drop on a refused target; a forced one changes nothing either
    fire(row("RSSI (dBm) · A1"), "drop", dt);
    expect(cellsOf(1).map((c) => c.text())).toEqual(["A1", "A2", "A3", "A1", "A2"]);
    fire(row("Reads · A1"), "dragstart", dt);
    const inside = fire(row("Reads · A3"), "dragover", dt);
    expect(dt.dropEffect).toBe("move");
    expect(inside.defaultPrevented).toBe(true);
    fire(row("Reads · A3"), "drop", dt);
    await nextTick();
    expect(cellsOf(1).slice(0, 3).map((c) => c.text())).toEqual(["A2", "A3", "A1"]);
  });

  it("flattens groups to leaf columns, so state, saved views and filters never see a group", () => {
    const grid = useDataGrid({ columns: ref(columns), data: ref(data) });
    expect(grid.columns.map((c) => c.key)).toEqual(["epc", "r1", "r2", "r3", "s1", "s2", "note"]);
    expect(grid.getConfig().columns.map((c) => c.key)).toEqual(grid.columns.map((c) => c.key));
    // a saved view naming a key that is no column (a stale or group-ish entry) is dropped
    grid.loadConfig({
      ...grid.getConfig(),
      columns: [{ key: "Reads", visible: true }, ...grid.getConfig().columns],
    });
    expect(grid.columnState.value.map((c) => c.key)).not.toContain("Reads");
    expect(grid.visibleColumns.value).toHaveLength(7);
  });

  it("follows a change of group definitions", async () => {
    mountGrid();
    await w!.setProps({
      columns: [{ label: "Renamed", children: [{ key: "r1", label: "A1" }] }, ...columns.slice(0, 1)],
    });
    expect(cellsOf(0).map((c) => c.text())).toEqual(["EPC", "Renamed"]);
    expect(th("Renamed", 0).attributes("colspan")).toBe("1");
  });

  it("does not rebuild columns when a parent re-creates identical groups inline", async () => {
    const make = (): DataGridColumnDef[] => [{ label: "G", children: [{ key: "a", label: "A" }] }];
    const defs = ref(make());
    const grid = useDataGrid({ columns: defs, data: ref(data) });
    const first = grid.columns[0];
    defs.value = make();
    await nextTick();
    expect(grid.columns[0]).toBe(first);
  });

  it("offsets aria-rowindex by both header rows when virtualized", () => {
    mountGrid({ virtualize: true, maxHeight: "300px" });
    expect(w!.find("table").attributes("aria-rowcount")).toBe(String(data.length + 2));
    expect(headRows().map((r) => r.attributes("aria-rowindex"))).toEqual(["1", "2"]);
    expect(w!.find("tbody tr").attributes("aria-rowindex")).toBe("3");
  });
});

describe("CuiDataGrid header slots", () => {
  it("renders #header-<key> in place of the label, beside (never inside) the sort button of a sortable column", () => {
    mountGrid({}, { "header-epc": `<b class="custom">Tag EPC</b>` });
    const epc = th("Tag EPC");
    expect(epc.find(".custom").exists()).toBe(true);
    expect(epc.find("button .custom").exists()).toBe(false);
    // the icon-only sort button keeps the column's label as its name
    expect(epc.find("button.cui-data-grid-table__sort").attributes("aria-label")).toBe("EPC");
  });

  it("keeps interactive header content out of the sort button, and still sorts from the button", async () => {
    mountGrid({}, { "header-epc": `<a class="link" href="#x">Tag EPC</a>` });
    const epc = th("Tag EPC");
    expect(epc.find("button a").exists()).toBe(false);
    expect(epc.find("a.link").exists()).toBe(true);
    await epc.find("button.cui-data-grid-table__sort").trigger("click");
    expect(epc.attributes("aria-sort")).toBe("ascending");
  });

  it("still sorts on a click of plain slot content, but not of a link inside it", async () => {
    mountGrid({}, { "header-epc": `<span class="plain">Tag</span> <a class="link" href="#x">more</a>` });
    const epc = th("Tag more");
    await epc.find("a.link").trigger("click");
    expect(epc.attributes("aria-sort")).toBeUndefined();
    await epc.find(".plain").trigger("click");
    expect(epc.attributes("aria-sort")).toBe("ascending");
    // and a click on the sort button sorts once, not twice
    await epc.find("button.cui-data-grid-table__sort").trigger("click");
    expect(epc.attributes("aria-sort")).toBe("descending");
  });

  it("names an icon-only sort button with its group, so grouped A1s differ", () => {
    mountGrid({}, { header: `<svg aria-hidden="true"></svg>` });
    const names = w!.findAll("thead button.cui-data-grid-table__sort").map((b) => b.attributes("aria-label"));
    expect(names).toContain("Reads · A2");
    expect(names).toContain("EPC");
  });

  it("names the sort button from the label when the slot is only an icon", () => {
    mountGrid({}, { "header-epc": `<svg class="ico" aria-hidden="true"></svg>` });
    expect(w!.find("thead button.cui-data-grid-table__sort").attributes("aria-label")).toBe("EPC");
  });

  it("keeps the label inside the sort button when no header slot is given", () => {
    mountGrid();
    expect(th("EPC").find("button.cui-data-grid-table__sort").text()).toBe("EPC");
  });

  it("renders a generic #header with the column, and #header-<key> wins over it", () => {
    mountGrid(
      {},
      {
        header: `<template #header="{ column }">[{{ column.key }}]</template>`,
        "header-note": `<template #header-note>Custom note</template>`,
      },
    );
    expect(th("[epc]").exists()).toBe(true);
    expect(th("[r2]", 1).exists()).toBe(true);
    expect(th("Custom note").exists()).toBe(true);
    // group labels are not columns: no slot
    expect(th("Reads", 0).exists()).toBe(true);
  });

  it("falls back to the label when no slot is given", () => {
    mountGrid();
    expect(th("EPC").exists()).toBe(true);
  });

  it("keeps label for the column manager when a header slot replaces it", async () => {
    mountGrid({ hideToolbar: false }, { "header-epc": `<b>Tag EPC</b>` });
    await w!.find(".cui-data-grid-column-manager button").trigger("click");
    await nextTick();
    const names = managerChecks().map((c) => c.name);
    expect(names).toContain("EPC");
    expect(names).not.toContain("Tag EPC");
  });
});

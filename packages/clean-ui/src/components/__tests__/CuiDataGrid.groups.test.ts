import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick, ref } from "vue";
import CuiDataGrid from "../CuiDataGrid.vue";
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

  it("follows the column manager: hiding a leaf from it shrinks the span, with the group in its label", async () => {
    mountGrid({ hideToolbar: false });
    await w!.find(".cui-data-grid-column-manager button").trigger("click");
    await nextTick();
    const labels = [...document.body.querySelectorAll("label")].map((l) => l.textContent?.trim());
    expect(labels).toContain("Reads · A1");
    expect(labels).toContain("RSSI (dBm) · A1");
    expect(labels).toContain("EPC");
    [...document.body.querySelectorAll("label")].find((l) => l.textContent?.trim() === "Reads · A3")!.click();
    await nextTick();
    expect(th("Reads", 0).attributes("colspan")).toBe("2");
  });

  it("starts a new group cell when the manager reorders a leaf away from its siblings", () => {
    const defs = ref<DataGridColumnDef[]>(columns);
    const grid = useDataGrid({ columns: defs, data: ref(data) });
    // r1 r2 r3 s1 s2 → r1 s1 r2 ...
    grid.reorderColumns(grid.columnState.value.findIndex((c) => c.key === "s1"), 2);
    expect(grid.columnState.value.map((c) => c.key).slice(0, 4)).toEqual(["epc", "r1", "s1", "r2"]);
    expect(grid.columnGroupOf("s1")?.label).toBe("RSSI (dBm)");
    expect(grid.columnGroupOf("epc")).toBeUndefined();
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

  it("offsets aria-rowindex by both header rows when virtualized", () => {
    mountGrid({ virtualize: true, maxHeight: "300px" });
    expect(w!.find("table").attributes("aria-rowcount")).toBe(String(data.length + 2));
    expect(headRows().map((r) => r.attributes("aria-rowindex"))).toEqual(["1", "2"]);
    expect(w!.find("tbody tr").attributes("aria-rowindex")).toBe("3");
  });
});

describe("CuiDataGrid header slots", () => {
  it("renders #header-<key> in place of the label, inside the sort button for a sortable column", () => {
    mountGrid({}, { "header-epc": `<b class="custom">Tag EPC</b>` });
    const epc = th("Tag EPC");
    expect(epc.find("button.cui-data-grid-table__sort .custom").exists()).toBe(true);
    expect(epc.find("button").text()).toBe("Tag EPC");
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
    const labels = [...document.body.querySelectorAll("label")].map((l) => l.textContent?.trim());
    expect(labels).toContain("EPC");
    expect(labels).not.toContain("Tag EPC");
  });
});

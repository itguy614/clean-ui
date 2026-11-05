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

  it("takes the group/leaf format in the column manager from the message catalogue", async () => {
    w = mount(CuiConfigProvider, {
      props: { messages: { dataGrid: { groupedColumn: (g: string, c: string) => `${c} (${g})` } } },
      slots: { default: () => h(CuiDataGrid, { columns, data, hideToolbar: false }) },
      attachTo: document.body,
    });
    await w.find(".cui-data-grid-column-manager button").trigger("click");
    await nextTick();
    const labels = [...document.body.querySelectorAll("label")].map((l) => l.textContent?.trim());
    expect(labels).toContain("A1 (Reads)");
    expect(labels).not.toContain("Reads · A1");
  });

  it("never splits a group: a leaf stays in its group's range, a loose column lands outside it", () => {
    const grid = useDataGrid({ columns: ref(columns), data: ref(data) });
    const order = () => grid.columnState.value.map((c) => c.key);
    // epc r1 r2 r3 s1 s2 note
    grid.reorderColumns(order().indexOf("s1"), 2); // into Reads' middle
    expect(order()).toEqual(["epc", "r1", "r2", "r3", "s1", "s2", "note"]);
    grid.reorderColumns(order().indexOf("r1"), 6); // past the end of Reads
    expect(order()).toEqual(["epc", "r2", "r3", "r1", "s1", "s2", "note"]);
    grid.reorderColumns(order().indexOf("note"), 2); // a loose column into the middle of Reads
    expect(order().slice(0, 4)).not.toEqual(["epc", "r2", "note", "r3"]);
    for (const g of [["r1", "r2", "r3"], ["s1", "s2"]]) {
      const at = g.map((k) => order().indexOf(k)).sort((x, y) => x - y);
      expect(at[at.length - 1] - at[0]).toBe(g.length - 1);
    }
    expect(grid.columnGroupOf("s1")?.label).toBe("RSSI (dBm)");
    expect(grid.columnGroupOf("epc")).toBeUndefined();
  });

  it("heals a persisted order that splits a group, on load, on loadConfig and on a column change", () => {
    const split = ["r1", "s1", "r2", "epc", "r3", "s2", "note"].map((key) => ({ key, visible: true }));
    const expected = ["r1", "r2", "r3", "s1", "s2", "epc", "note"];
    const fresh = useDataGrid({ columns: ref(columns), data: ref(data), initialView: { columns: split } as never });
    expect(fresh.columnState.value.map((c) => c.key)).toEqual(expected);

    const grid = useDataGrid({ columns: ref(columns), data: ref(data) });
    grid.loadConfig({ ...grid.getConfig(), columns: split });
    expect(grid.columnState.value.map((c) => c.key)).toEqual(expected);
    expect(grid.visibleColumns.value.map((c) => c.key)).toEqual(expected);
  });

  it("moves a whole group among the units, and the order persists in a saved view", () => {
    const grid = useDataGrid({ columns: ref(columns), data: ref(data) });
    expect(grid.columnUnits.value.map((u) => (u.type === "group" ? u.group.label : u.key))).toEqual([
      "epc", "Reads", "RSSI (dBm)", "note",
    ]);
    grid.reorderGroup(grid.columnGroupOf("s1")!, 0);
    expect(grid.columnState.value.map((c) => c.key)).toEqual(["s1", "s2", "epc", "r1", "r2", "r3", "note"]);
    grid.moveGroup(grid.columnGroupOf("r1")!, 1);
    expect(grid.columnState.value.map((c) => c.key)).toEqual(["s1", "s2", "epc", "note", "r1", "r2", "r3"]);

    const saved = grid.getConfig();
    const restored = useDataGrid({ columns: ref(columns), data: ref(data), initialView: saved });
    expect(restored.columnState.value.map((c) => c.key)).toEqual(saved.columns.map((c) => c.key));
    expect(restored.columnUnits.value[0]).toMatchObject({ type: "group", keys: ["s1", "s2"] });
  });

  it("moves a leaf one step within its group, and a loose column among the units", () => {
    const grid = useDataGrid({ columns: ref(columns), data: ref(data) });
    grid.moveColumn("r1", -1); // first in its group: stays
    expect(grid.columnState.value.map((c) => c.key).slice(0, 4)).toEqual(["epc", "r1", "r2", "r3"]);
    grid.moveColumn("r1", 1);
    expect(grid.columnState.value.map((c) => c.key).slice(0, 4)).toEqual(["epc", "r2", "r1", "r3"]);
    grid.moveColumn("epc", 1); // past the whole Reads group, not into it
    expect(grid.columnState.value.map((c) => c.key).slice(0, 4)).toEqual(["r2", "r1", "r3", "epc"]);
  });

  it("draws a separator on the first leaf of each group but the first group", () => {
    mountGrid();
    const starts = (sel: string) => w!.findAll(sel).map((c) => c.classes("cui-data-grid-table__group-start"));
    // header groups: Reads (first, none), RSSI (yes)
    expect(cellsOf(0).map((c) => c.classes("cui-data-grid-table__group-start"))).toEqual([false, false, true, false]);
    // leaves: A1 A2 A3 | A1 A2
    expect(cellsOf(1).map((c) => c.classes("cui-data-grid-table__group-start"))).toEqual([false, false, false, true, false]);
    // body cells: epc r1 r2 r3 s1 s2 note
    expect(starts("tbody tr:first-child td")).toEqual([false, false, false, false, true, false, false]);
  });

  it("opens the column manager as groups with leaves, and moves with the keyboard", async () => {
    mountGrid({ hideToolbar: false });
    await w!.find(".cui-data-grid-column-manager button").trigger("click");
    await nextTick();
    const rows = () => [...document.body.querySelectorAll(".cui-data-grid-column-manager__row")];
    expect(rows().map((r) => r.classList[1]?.replace("cui-data-grid-column-manager__row--", ""))).toEqual([
      "column", "group", "leaf", "leaf", "leaf", "group", "leaf", "leaf", "column",
    ]);
    const button = (label: string) =>
      document.body.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
    expect(button("Move Reads · A1 up").disabled).toBe(true); // first in its group
    button("Move RSSI (dBm) up").click();
    await nextTick();
    expect(cellsOf(0).map((c) => c.text())).toEqual(["EPC", "RSSI (dBm)", "Reads", "Note"]);
    expect(document.body.querySelector("[role=status]")!.textContent).toBe("RSSI (dBm) moved to position 2 of 4");
    button("Move Reads · A1 down").click();
    await nextTick();
    expect(cellsOf(1).map((c) => c.text())).toEqual(["A1", "A2", "A2", "A1", "A3"]);
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
    expect(row("RSSI (dBm) · A1").style.borderTop).toContain("transparent");
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

import { describe, it, expect, vi, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick, reactive } from "vue";
import CuiDataGrid from "../../components/CuiDataGrid.vue";

/**
 * #273 — client-side search lower-cased every cell on every keystroke. It now reads a
 * per-row cache of lower-cased cells, rebuilt only for a value that changed.
 */

const columns = Array.from({ length: 10 }, (_, c) => ({ key: `c${c}`, label: `C${c}` }));
const rows = (n: number) =>
  Array.from({ length: n }, (_, r) => ({ id: r + 1, ...Object.fromEntries(columns.map((c, i) => [c.key, `Cell ${r}-${i}`])) }));

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  w = undefined;
  vi.restoreAllMocks();
  vi.useRealTimers();
});


describe("CuiDataGrid search index", () => {
  it("lower-cases each cell once, not on every keystroke", async () => {
    w = mount(CuiDataGrid, { props: { columns, data: rows(5000), searchDebounce: 0 }, attachTo: document.body });
    const input = w.find(".cui-data-grid-search input");
    await input.setValue("cell 1");
    await nextTick();

    // The cache fills lazily: a search stops at a row's first matching cell, so a narrower
    // query may lower a few more cells once. Warm it, then count a keystroke.
    await input.setValue("cell 12");
    await nextTick();
    // Count only the lowering of cell text: rendering lowers attribute names too.
    const original = String.prototype.toLowerCase;
    let cellLowers = 0;
    vi.spyOn(String.prototype, "toLowerCase").mockImplementation(function (this: string) {
      if (this.startsWith("Cell ")) cellLowers++;
      return original.call(this);
    });
    await input.setValue("cell 123");
    await nextTick();
    expect(cellLowers).toBe(0); // was 50,000 a keystroke
  });

  it("finds the same rows as before, case-insensitively, and follows an edited row", async () => {
    const data = reactive([
      { id: 1, name: "Alice", role: "Dev" },
      { id: 2, name: "Bob", role: "Ops" },
    ]);
    w = mount(CuiDataGrid, {
      props: { columns: [{ key: "name", label: "Name" }, { key: "role", label: "Role" }], data, searchDebounce: 0 },
      attachTo: document.body,
    });
    const input = w.find(".cui-data-grid-search input");
    await input.setValue("ALI");
    await nextTick();
    expect(w.findAll("tbody tr").map((r) => r.text())).toEqual([expect.stringContaining("Alice")]);

    data[1].name = "Alina"; // edited in place: the cached cell is stale and must be redone
    await nextTick();
    expect(w.findAll("tbody tr")).toHaveLength(2);
  });

  it("waits searchDebounce ms after the last keystroke, 300 by default", async () => {
    vi.useFakeTimers();
    w = mount(CuiDataGrid, {
      props: { columns: [{ key: "name", label: "Name" }], data: [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }] },
      attachTo: document.body,
    });
    await w.find(".cui-data-grid-search input").setValue("bob");
    await nextTick();
    expect(w.findAll("tbody tr")).toHaveLength(2);
    vi.advanceTimersByTime(300);
    await nextTick();
    expect(w.findAll("tbody tr")).toHaveLength(1);
  });
});

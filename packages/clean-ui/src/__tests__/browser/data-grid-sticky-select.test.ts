import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount } from "@vue/test-utils";
import CuiDataGrid from "../../components/CuiDataGrid.vue";
import type { DataGridColumn } from "../../types/data-grid";
import preflight from "../../styles/preflight.css?inline";
import { frames, installTokens, mountHosts } from "./helpers";

/**
 * #233 — with bulk selection and a frozen data column, the checkbox column scrolled away
 * on horizontal scroll, leaving a 48px gap left of the frozen column, and its header
 * cell was painted over by the header cells that scroll under it.
 *
 * Real browser: sticky positioning and what paints on top are layout, which jsdom
 * does not compute.
 */
describe("CuiDataGrid bulk-select column with frozen columns (real browser)", () => {
  const { host, track, cleanup } = mountHosts();
  let teardown: () => void;
  beforeAll(() => (teardown = installTokens(preflight)));
  afterAll(() => teardown());
  afterEach(cleanup);

  const columns: DataGridColumn[] = [
    { key: "name", label: "Name", sticky: true, width: "120px" },
    ...["a", "b", "c", "d", "e"].map((k) => ({ key: k, label: k.toUpperCase(), width: "150px" })),
  ];
  const data = Array.from({ length: 5 }, (_, i) => ({
    id: String(i),
    name: `Row ${i}`,
    a: "1", b: "2", c: "3", d: "4", e: "5",
  }));

  async function scrolledGrid(
    size: string,
    cols = columns,
    rows: Record<string, unknown>[] = data,
    hostStyle: Record<string, string> = {},
  ) {
    const el = host({ width: "400px" });
    for (const [prop, value] of Object.entries(hostStyle)) el.style.setProperty(prop, value);
    const wrapper = track(
      mount(CuiDataGrid, {
        attachTo: el,
        props: {
          columns: cols,
          data: rows,
          bulkActions: [{ key: "delete", label: "Delete" }],
          maxHeight: "300px",
          hideToolbar: true,
          size,
        },
      }),
    );
    await frames(2);
    const table = wrapper.element.querySelector("table")!;
    const scroller = table.parentElement!;
    expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
    scroller.scrollLeft = 300;
    await frames(2);
    return { table, scroller };
  }

  // Each size pads its cells differently; the checkbox column has to come out at the
  // width the frozen columns' offsets assume at all of them, or they overlap it.
  it.each(["sm", "md", "lg"])("keeps the body checkbox cell at the left edge, flush against the frozen column (%s)", async (size) => {
    const { table, scroller } = await scrolledGrid(size);
    const left = scroller.getBoundingClientRect().left;
    const firstRow = table.querySelector("tbody tr")!;
    const [select, name] = Array.from(firstRow.children) as HTMLElement[];

    expect(select.getBoundingClientRect().left).toBeCloseTo(left, 0);
    expect(name.getBoundingClientRect().left).toBeCloseTo(select.getBoundingClientRect().right, 0);
  });

  it("lines up frozen columns whose widths are not in px", async () => {
    // Offsets used to parseInt each width as px, so "8rem" pinned the next column 8px in.
    const { table } = await scrolledGrid("md", [
      { key: "name", label: "Name", sticky: true, width: "8rem" },
      { key: "a", label: "A", sticky: true, width: "100px" },
      ...columns.slice(2),
    ]);
    const [, name, a] = Array.from(table.querySelector("tbody tr")!.children) as HTMLElement[];
    expect(a.getBoundingClientRect().left).toBeCloseTo(name.getBoundingClientRect().right, 0);
  });

  it("leaves no gap between adjacent frozen columns when rows have actions", async () => {
    // The actions button plus cell padding overflowed the column's 3rem, so the table
    // squeezed every other column to fit its min-width; each frozen column then came
    // out narrower than the next one's offset, and scrolled content showed through.
    // A roomier density widens the padding, which is what made the actions cell overflow.
    const { table } = await scrolledGrid(
      "md",
      [{ key: "name", label: "Name", sticky: true, width: "120px" }, { key: "a", label: "A", sticky: true, width: "100px" }, ...columns.slice(2)],
      data.map((r) => ({ ...r, _actions: [{ key: "edit", label: "Edit" }] })),
      { "--cui-density-scale": "3" } as Record<string, string>,
    );
    const [, name, a] = Array.from(table.querySelector("tbody tr")!.children) as HTMLElement[];
    expect(name.getBoundingClientRect().width).toBeCloseTo(120, 1);
    expect(a.getBoundingClientRect().left).toBeCloseTo(name.getBoundingClientRect().right, 0);
  });

  it("keeps the header checkbox cell in place and on top", async () => {
    const { table, scroller } = await scrolledGrid("md");
    const headerSelect = table.querySelector<HTMLElement>("thead tr > :first-child")!;
    const rect = headerSelect.getBoundingClientRect();

    expect(rect.left).toBeCloseTo(scroller.getBoundingClientRect().left, 0);
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    expect(headerSelect.contains(hit)).toBe(true);
  });
});

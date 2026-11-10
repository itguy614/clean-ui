import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount } from "@vue/test-utils";
import CuiDataGrid from "../../components/CuiDataGrid.vue";
import type { DataGridColumnDef } from "../../types/data-grid";
import preflight from "../../styles/preflight.css?inline";
import { frames, installTokens, mountHosts } from "../../../../../config/test/browser-helpers";

/**
 * #376 — a two-row header. The second row has to pin under the first (not on top of it),
 * and a frozen column that is a group's leaf has to stay put on horizontal scroll.
 *
 * Real browser: sticky positioning and rowspan layout are not computed by jsdom.
 */
describe("CuiDataGrid column groups: sticky header and frozen columns (real browser)", () => {
  const { host, track, cleanup } = mountHosts();
  let teardown: () => void;
  beforeAll(() => (teardown = installTokens(preflight)));
  afterAll(() => teardown());
  afterEach(cleanup);

  const columns: DataGridColumnDef[] = [
    { key: "epc", label: "EPC", sticky: true, width: "120px" },
    {
      label: "Reads",
      children: ["r1", "r2", "r3", "r4"].map((k) => ({ key: k, label: k.toUpperCase(), width: "150px" })),
    },
    { label: "RSSI (dBm)", children: ["s1", "s2"].map((k) => ({ key: k, label: k.toUpperCase(), width: "150px" })) },
  ];
  const data = Array.from({ length: 30 }, (_, i) => ({
    id: String(i),
    epc: `tag-${i}`,
    r1: 1, r2: 2, r3: 3, r4: 4, s1: -40, s2: -50,
  }));

  async function scrolledGrid(extra: Record<string, unknown> = {}) {
    const wrapper = track(
      mount(CuiDataGrid, {
        attachTo: host({ width: "400px" }),
        props: { columns, data, maxHeight: "200px", hideToolbar: true, hidePagination: true, ...extra },
      }),
    );
    await frames(3);
    const table = wrapper.element.querySelector("table")!;
    return { table, scroller: table.parentElement! };
  }
  const rect = (el: Element) => el.getBoundingClientRect();
  const cell = (table: Element, text: string) =>
    [...table.querySelectorAll("thead th")].find((c) => c.textContent?.trim() === text)!;

  it("pins the second header row directly under the first on vertical scroll", async () => {
    const { table, scroller } = await scrolledGrid();
    scroller.scrollTop = 120;
    await frames(2);
    const group = cell(table, "Reads");
    const leaf = cell(table, "R1");
    expect(rect(group).top).toBeCloseTo(rect(scroller).top, 0);
    expect(rect(leaf).top).toBeCloseTo(rect(group).bottom, 0);
    // and the first body row scrolled under the header, not over it
    const hit = document.elementFromPoint(rect(leaf).left + 5, rect(leaf).top + rect(leaf).height / 2);
    expect(leaf.contains(hit)).toBe(true);
  });

  it("spans the ungrouped column over both rows and the group over its leaves", async () => {
    const { table } = await scrolledGrid();
    const epc = cell(table, "EPC");
    const group = cell(table, "Reads");
    const r1 = cell(table, "R1");
    const r4 = cell(table, "R4");
    expect(rect(epc).height).toBeCloseTo(rect(group).height + rect(r1).height, 0);
    expect(rect(group).left).toBeCloseTo(rect(r1).left, 0);
    expect(rect(group).right).toBeCloseTo(rect(r4).right, 0);
  });

  it("keeps a frozen ungrouped column in place across both header rows on horizontal scroll", async () => {
    const { table, scroller } = await scrolledGrid();
    scroller.scrollLeft = 300;
    scroller.scrollTop = 60;
    await frames(2);
    const epc = cell(table, "EPC");
    expect(rect(epc).left).toBeCloseTo(rect(scroller).left, 0);
    expect(rect(epc).top).toBeCloseTo(rect(scroller).top, 0);
    // the frozen body cell lines up beneath it
    const body = table.querySelector("tbody tr td")!;
    expect(rect(body).left).toBeCloseTo(rect(epc).left, 0);
  });

  it("pins a frozen leaf inside a group, in the second row", async () => {
    const { table, scroller } = await scrolledGrid({
      columns: [
        { key: "name", label: "Name", width: "100px" },
        { label: "Reads", children: [{ key: "r1", label: "R1", sticky: true, width: "100px" }, { key: "r2", label: "R2", sticky: true, width: "100px" }] },
        { key: "z", label: "Z", width: "300px" },
      ],
      data: data.map((r) => ({ ...r, name: r.epc, z: 1 })),
    });
    scroller.scrollLeft = 200;
    scroller.scrollTop = 40;
    await frames(2);
    const group = cell(table, "Reads");
    const leaf = cell(table, "R1");
    // a frozen group is wholly frozen (#465): its spanning cell pins over its whole span too
    expect(rect(group).left).toBeCloseTo(rect(scroller).left, 0);
    expect(rect(group).width).toBeCloseTo(200, 0);
    expect(getComputedStyle(group).position).toBe("sticky");
    expect(rect(leaf).left).toBeCloseTo(rect(scroller).left, 0);
    expect(rect(leaf).top).toBeCloseTo(rect(group).bottom, 0);
  });

  describe("group separators", () => {
    const RULE = "rgb(255, 0, 0)";
    // both groups are frozen, so they lead (#465); "name" scrolls
    const sepColumns: DataGridColumnDef[] = [
      { key: "name", label: "Name", width: "300px" },
      { label: "North", children: [{ key: "a1", label: "A1", sticky: true, width: "100px" }, { key: "a2", label: "A2", sticky: true, width: "50px" }] },
      { label: "South", children: [{ key: "b1", label: "B1", sticky: true, width: "100px" }, { key: "b2", label: "B2", sticky: true, width: "50px" }] },
    ];
    const sepData = data.map((r) => ({ ...r, name: r.epc, a1: 1, a2: 2, b1: 3, b2: 4 }));
    const rule = (el: Element) => getComputedStyle(el, "::before");

    async function grid(extra: Record<string, unknown> = {}) {
      const el = host({ width: "400px" });
      el.style.setProperty("--cui-data-grid-group-border", RULE);
      const wrapper = track(
        mount(CuiDataGrid, {
          attachTo: el,
          props: { columns: sepColumns, data: sepData, maxHeight: "200px", hideToolbar: true, hidePagination: true, ...extra },
        }),
      );
      await frames(3);
      const table = wrapper.element.querySelector("table")!;
      return { table, scroller: table.parentElement! };
    }

    it("draws a themeable rule on the second group's first leaf, in the header and the body, not the first group's", async () => {
      const { table } = await grid();
      const b1Head = cell(table, "B1");
      const b1Body = table.querySelector("tbody tr")!.children[2];
      for (const el of [b1Head, cell(table, "South"), b1Body]) {
        expect(rule(el).content).not.toBe("none");
        expect(rule(el).width).toBe("1px");
        expect(rule(el).backgroundColor).toBe(RULE);
      }
      expect(rule(cell(table, "A1")).content).toBe("none");
      expect(rule(cell(table, "North")).content).toBe("none");
      expect(rule(table.querySelector("tbody tr")!.children[0]).content).toBe("none");
    });

    it("keeps the rule with a frozen group-start leaf on horizontal scroll", async () => {
      const { table, scroller } = await grid();
      scroller.scrollLeft = 340;
      scroller.scrollTop = 40;
      await frames(2);
      const b1 = cell(table, "B1");
      const bodyB1 = table.querySelector("tbody tr")!.children[2];
      // pinned beside North, still carrying its rule
      expect(rect(b1).left).toBeCloseTo(rect(scroller).left + 150, 0);
      expect(rect(bodyB1).left).toBeCloseTo(rect(b1).left, 0);
      expect(getComputedStyle(b1).position).toBe("sticky");
      expect(rule(b1).backgroundColor).toBe(RULE);
      expect(rule(bodyB1).backgroundColor).toBe(RULE);
    });
  });

  describe("stacking against a sticky page header", () => {
    // The docs site's header is sticky, z-index 10 (the docs site had one), and earlier
    // in the document than the grid. A grid header cell that meets it must pass under it.
    it.each([
      ["a flat grid", [{ key: "a", label: "A", sticky: true, width: "100px" }, { key: "b", label: "B", width: "100px" }] as DataGridColumnDef[]],
      ["a grouped grid", columns],
    ])("keeps %s's header cells under a page header above them", async (_name, cols) => {
      const bar = document.createElement("div");
      bar.style.cssText =
        "position: fixed; top: 0; left: 0; right: 0; height: 120px; background: rgb(0, 128, 0); z-index: 10;";
      document.body.prepend(bar);
      try {
        const { table, scroller } = await scrolledGrid({
          columns: cols,
          data: data.map((r) => ({ ...r, a: 1, b: 2 })),
          maxHeight: "300px",
        });
        scroller.scrollTop = 40;
        await frames(2);
        let checked = 0;
        for (const th of table.querySelectorAll("thead th")) {
          const r = th.getBoundingClientRect();
          if (r.width === 0 || r.top > 110 || r.left > 360) continue;
          const hit = document.elementFromPoint(r.left + Math.min(r.width / 2, 30), Math.max(r.top, 0) + 1);
          expect(hit === bar, `${th.textContent?.trim()} is covered by the page header`).toBe(true);
          checked++;
        }
        expect(checked).toBeGreaterThan(0);
      } finally {
        bar.remove();
      }
    });
  });
});

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
        { label: "Reads", children: [{ key: "r1", label: "R1", sticky: true, width: "100px" }, { key: "r2", label: "R2", width: "300px" }] },
        { key: "z", label: "Z", width: "300px" },
      ],
      data: data.map((r) => ({ ...r, name: r.epc, z: 1 })),
    });
    scroller.scrollLeft = 200;
    scroller.scrollTop = 40;
    await frames(2);
    const group = cell(table, "Reads");
    const leaf = cell(table, "R1");
    expect(rect(leaf).left).toBeCloseTo(rect(scroller).left, 0);
    expect(rect(leaf).top).toBeCloseTo(rect(group).bottom, 0);
  });
});

import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import CuiDataGrid from "../../components/CuiDataGrid.vue";
import type { DataGridColumnDef } from "../../types/data-grid";
import preflight from "../../styles/preflight.css?inline";
import { frames, installTokens, mountHosts } from "../../../../../config/test/browser-helpers";

/**
 * #485 — a frozen column with no `width` is measured from its header cell, so the frozen
 * column (or group header) after it pins at its right edge instead of on top of it.
 * Real browser: widths and sticky `left` are layout, which jsdom does not compute.
 */
describe("CuiDataGrid frozen columns without a width (real browser)", () => {
  const { host, track, cleanup } = mountHosts();
  let teardown: () => void;
  beforeAll(() => (teardown = installTokens(preflight)));
  afterAll(() => teardown());
  afterEach(cleanup);

  const data = [{ id: "1", f1: "a fairly long frozen value", f2: "two", g1: "x", g2: "y", c: "z" }];
  const th = (el: Element, text: string) =>
    [...el.querySelectorAll("thead th")].find((c) => c.textContent?.trim() === text) as HTMLElement;
  const left = (el: HTMLElement) => parseFloat(getComputedStyle(el).left);
  const width = (el: HTMLElement) => el.getBoundingClientRect().width;

  async function grid(columns: DataGridColumnDef[], extra: Record<string, unknown> = {}) {
    const cols = ref(columns);
    const App = defineComponent({
      setup: () => () => h(CuiDataGrid, { columns: cols.value, data, hideToolbar: true, hidePagination: true, ...extra }),
    });
    const hostEl = host({ width: "600px" });
    const wrapper = track(mount(App, { attachTo: hostEl }));
    await frames(4);
    return { el: wrapper.element as HTMLElement, hostEl, cols };
  }

  const plain = (): DataGridColumnDef[] => [
    { key: "f1", label: "First", sticky: true },
    { key: "f2", label: "Second", sticky: true, width: "100px" },
    { key: "c", label: "Other", width: "300px" },
  ];

  it("pins the next frozen column at the first one's measured width", async () => {
    const { el } = await grid(plain());
    expect(width(th(el, "First"))).toBeGreaterThan(40);
    expect(left(th(el, "Second"))).toBeCloseTo(width(th(el, "First")), 0);
  });

  it("keeps a declared width as the source of truth", async () => {
    const { el } = await grid([{ key: "f1", label: "First", sticky: true, width: "200px" }, ...plain().slice(1)]);
    expect(th(el, "Second").style.left).toBe("200px");
  });

  it("stacks a frozen group header over unsized frozen leaves", async () => {
    const { el } = await grid([
      { key: "f1", label: "First", sticky: true },
      {
        label: "Grp",
        children: [
          { key: "g1", label: "G1", sticky: true },
          { key: "g2", label: "G2", sticky: true },
        ],
      },
      { key: "c", label: "Other", width: "300px" },
    ]);
    const firstW = width(th(el, "First"));
    expect(left(th(el, "Grp"))).toBeCloseTo(firstW, 0);
    expect(left(th(el, "G1"))).toBeCloseTo(firstW, 0);
    expect(left(th(el, "G2"))).toBeCloseTo(firstW + width(th(el, "G1")), 0);
  });

  it("follows the container being resized", async () => {
    const { el, hostEl } = await grid(plain());
    const before = left(th(el, "Second"));
    hostEl.style.width = "1000px";
    await frames(4);
    expect(left(th(el, "Second"))).toBeGreaterThan(before + 20);
    expect(left(th(el, "Second"))).toBeCloseTo(width(th(el, "First")), 0);
  });

  it("shifts the next frozen column when the first is hidden", async () => {
    const { el, cols } = await grid(plain());
    expect(left(th(el, "Second"))).toBeGreaterThan(40);
    cols.value = [{ ...plain()[0], visible: false }, ...plain().slice(1)];
    await frames(4);
    expect(left(th(el, "Second"))).toBe(0);
  });

  it("starts after the bulk-select column", async () => {
    const { el } = await grid(plain(), { bulkActions: [{ key: "x", label: "X" }] });
    const first = th(el, "First");
    expect(left(th(el, "Second"))).toBeCloseTo(left(first) + width(first), 0);
    expect(left(first)).toBeGreaterThan(20);
  });
});

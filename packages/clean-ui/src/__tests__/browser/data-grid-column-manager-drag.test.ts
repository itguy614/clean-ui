import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { userEvent } from "@vitest/browser/context";
import CuiDataGrid from "../../components/CuiDataGrid.vue";
import type { DataGridColumnDef } from "../../types/data-grid";
import preflight from "../../styles/preflight.css?inline";
import { frames, installTokens, mountHosts } from "../../../../../config/test/browser-helpers";

/**
 * The column manager's drag and drop, driven by the browser's own HTML5 drag events
 * (Playwright's drag), not by calling a handler: a leaf moves within its group, a group
 * header moves the whole group, and anything else is refused.
 */
describe("CuiDataGrid column manager drag and drop (real browser)", () => {
  const { host, track, cleanup } = mountHosts();
  let teardown: () => void;
  beforeAll(() => (teardown = installTokens(preflight)));
  afterAll(() => teardown());
  afterEach(cleanup);

  const columns: DataGridColumnDef[] = [
    { key: "epc", label: "EPC" },
    { label: "Reads", children: ["r1", "r2", "r3"].map((k, i) => ({ key: k, label: `A${i + 1}` })) },
    { label: "RSSI", children: ["s1", "s2"].map((k, i) => ({ key: k, label: `B${i + 1}` })) },
  ];
  const data = [{ id: "1", epc: "e", r1: 1, r2: 2, r3: 3, s1: 4, s2: 5 }];

  async function openManager() {
    // Rendered through a parent, as an app does, so the grid is handed the plain definition
    // objects. (mount()'s own props would hand it reactive proxies of them, which hid #376's
    // drag bug: a group compared against its proxy was never the same group.)
    const App = defineComponent({ render: () => h(CuiDataGrid, { columns, data }) });
    const wrapper = track(mount(App, { attachTo: host({ width: "700px" }) }));
    await frames(2);
    await userEvent.click(wrapper.element.querySelector<HTMLElement>(".cui-data-grid-column-manager button")!);
    await frames(3);
    return wrapper.element as HTMLElement;
  }
  const row = (text: string) =>
    [...document.body.querySelectorAll<HTMLElement>(".cui-data-grid-column-manager__row")].find((r) =>
      r.textContent?.includes(text),
    )!;
  const headerOrder = (grid: HTMLElement) =>
    [...grid.querySelectorAll("thead tr")].map((tr) => [...tr.querySelectorAll("th")].map((th) => th.textContent?.trim()));
  const leafOrder = (grid: HTMLElement) => headerOrder(grid)[1];

  it("moves a leaf onto another leaf of its group", async () => {
    const grid = await openManager();
    expect(leafOrder(grid)).toEqual(["A1", "A2", "A3", "B1", "B2"]);
    await userEvent.dragAndDrop(row("A1"), row("A3"));
    await frames(2);
    expect(leafOrder(grid)).toEqual(["A2", "A3", "A1", "B1", "B2"]);
    await userEvent.dragAndDrop(row("A3"), row("A2"));
    await frames(2);
    expect(leafOrder(grid)).toEqual(["A3", "A2", "A1", "B1", "B2"]);
  });

  it("refuses a leaf dropped on another group's leaf", async () => {
    const grid = await openManager();
    await userEvent.dragAndDrop(row("A1"), row("B1"));
    await frames(2);
    expect(leafOrder(grid)).toEqual(["A1", "A2", "A3", "B1", "B2"]);
  });

  it("moves a whole group by its header row", async () => {
    const grid = await openManager();
    await userEvent.dragAndDrop(row("RSSI"), row("Reads"));
    await frames(2);
    expect(headerOrder(grid)[0]).toEqual(["EPC", "RSSI", "Reads"]);
    expect(leafOrder(grid)).toEqual(["B1", "B2", "A1", "A2", "A3"]);
  });
});

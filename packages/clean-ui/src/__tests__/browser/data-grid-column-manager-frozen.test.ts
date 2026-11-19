import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { userEvent } from "@vitest/browser/context";
import CuiDataGrid from "../../components/CuiDataGrid.vue";
import type { DataGridColumnDef } from "../../types/data-grid";
import preflight from "../../styles/preflight.css?inline";
import { frames, installTokens, mountHosts } from "../../../../../config/test/browser-helpers";

/**
 * #465 — frozen columns in the column manager, driven by the browser's own HTML5 drag events
 * through a parent component (plain definition objects, as an app passes them): a frozen
 * column cannot be dragged, and nothing can be dropped in among them.
 */
describe("CuiDataGrid column manager: frozen columns (real browser)", () => {
  const { host, track, cleanup } = mountHosts();
  let teardown: () => void;
  beforeAll(() => (teardown = installTokens(preflight)));
  afterAll(() => teardown());
  afterEach(cleanup);

  const columns: DataGridColumnDef[] = [
    { key: "a", label: "Alpha" },
    { key: "f1", label: "Frozen1", sticky: true, width: "100px" },
    { key: "b", label: "Beta" },
    { key: "f2", label: "Frozen2", sticky: true, width: "100px" },
    { key: "c", label: "Gamma" },
  ];
  const data = [{ id: "1", a: 1, f1: 2, b: 3, f2: 4, c: 5 }];

  async function openManager() {
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
  const order = (grid: HTMLElement) => [...grid.querySelectorAll("thead th")].map((th) => th.textContent?.trim());

  it("leads with the frozen columns, in declared order, and shows their locks", async () => {
    const grid = await openManager();
    expect(order(grid)).toEqual(["Frozen1", "Frozen2", "Alpha", "Beta", "Gamma"]);
    expect(row("Frozen1").querySelector(".cui-data-grid-column-manager__lock")).not.toBeNull();
    expect(row("Frozen1").querySelector("button")).toBeNull();
  });

  const handle = (name: string) => document.body.querySelector<HTMLElement>(`button[aria-label="Reorder ${name}"]`);
  function pointer(target: EventTarget, type: string, x: number, y: number) {
    target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, composed: true, pointerId: 7, isPrimary: true, pointerType: "mouse", clientX: x, clientY: y, button: 0 }));
  }
  /** Drag a normal column's handle `dy` pixels (negative: up, toward the frozen block), and drop. */
  async function dragBy(name: string, dy: number) {
    const r = handle(name)!.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    pointer(handle(name)!, "pointerdown", x, y);
    await frames(1);
    pointer(document, "pointermove", x, y + Math.sign(dy) * 8);
    await frames(2);
    pointer(document, "pointermove", x, y + dy);
    await frames(6);
    pointer(document, "pointerup", x, y + dy);
    await frames(30);
  }

  it("gives a frozen column no handle, so it cannot be dragged", async () => {
    const grid = await openManager();
    expect(handle("Frozen1")).toBeNull();
    expect(handle("Frozen2")).toBeNull();
    expect(order(grid)).toEqual(["Frozen1", "Frozen2", "Alpha", "Beta", "Gamma"]);
  });

  it("refuses a drop of a normal column onto the frozen block: it stops at the first normal place", async () => {
    const grid = await openManager();
    await dragBy("Gamma", -400);
    expect(order(grid)).toEqual(["Frozen1", "Frozen2", "Gamma", "Alpha", "Beta"]);
  });

  it("still moves normal columns among themselves", async () => {
    const grid = await openManager();
    const gap = handle("Beta")!.getBoundingClientRect().top - handle("Alpha")!.getBoundingClientRect().top;
    await dragBy("Gamma", -(gap + 10));
    expect(order(grid)).toEqual(["Frozen1", "Frozen2", "Alpha", "Gamma", "Beta"]);
  });
});

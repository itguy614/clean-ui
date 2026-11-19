import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { userEvent } from "@vitest/browser/context";
import CuiDataGrid from "../../components/CuiDataGrid.vue";
import type { DataGridColumnDef } from "../../types/data-grid";
import main from "../../styles/main.css?inline";
import { frames, installTokens, mountHosts } from "../../../../../config/test/browser-helpers";

/**
 * The column manager's reordering is CuiSortableList's (#560), driven here as a user does, in
 * the popover: a pointer drag of a handle, and the keyboard's grab, move, drop and Escape. A
 * leaf moves within its group, a group moves whole among the groups and loose columns, and the
 * order is the grid's: it is read back from the grid's own header.
 */
describe("CuiDataGrid column manager reordering (real browser)", () => {
  const { host, track, cleanup } = mountHosts();
  let teardown: () => void;
  beforeAll(() => (teardown = installTokens(main)));
  afterAll(() => teardown());
  afterEach(cleanup);

  const columns: DataGridColumnDef[] = [
    { key: "epc", label: "EPC" },
    { label: "Reads", children: ["r1", "r2", "r3"].map((k, i) => ({ key: k, label: `A${i + 1}` })) },
    { label: "RSSI", children: ["s1", "s2"].map((k, i) => ({ key: k, label: `B${i + 1}` })) },
  ];
  const data = [{ id: "1", epc: "e", r1: 1, r2: 2, r3: 3, s1: 4, s2: 5 }];

  async function openManager(cols: DataGridColumnDef[] = columns) {
    // Rendered through a parent, as an app does, so the grid is handed the plain definition
    // objects. (mount()'s own props would hand it reactive proxies of them, which hid #376's
    // drag bug: a group compared against its proxy was never the same group.)
    const App = defineComponent({ render: () => h(CuiDataGrid, { columns: cols, data }) });
    const wrapper = track(mount(App, { attachTo: host({ width: "700px" }) }));
    await frames(2);
    await userEvent.click(wrapper.element.querySelector<HTMLElement>(".cui-data-grid-column-manager button")!);
    await frames(12);
    return wrapper.element as HTMLElement;
  }
  const handle = (name: string) => document.body.querySelector<HTMLElement>(`button[aria-label="Reorder ${name}"]`)!;
  const headerOrder = (grid: HTMLElement) =>
    [...grid.querySelectorAll("thead tr")].map((tr) => [...tr.querySelectorAll("th")].map((th) => th.textContent?.trim()));
  const leafOrder = (grid: HTMLElement) => headerOrder(grid)[1];
  const unitOrder = (grid: HTMLElement) => headerOrder(grid)[0];
  const status = (selector: string) => document.body.querySelector(`${selector} > [role="status"]`)!.textContent!.trim();

  function pointer(target: EventTarget, type: string, x: number, y: number) {
    target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, composed: true, pointerId: 7, isPrimary: true, pointerType: "mouse", clientX: x, clientY: y, button: 0 }));
  }
  const center = (el: Element) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };
  /** Drag the named handle to just past the far edge of `toEl` (a tall group item shifts as the list makes room), and drop. */
  async function dragTo(name: string, toEl: Element, drop = true) {
    const from = center(handle(name));
    const down = toEl.getBoundingClientRect().top > from.y;
    const to = { x: from.x, y: down ? toEl.getBoundingClientRect().bottom - 2 : toEl.getBoundingClientRect().top + 2 };
    pointer(handle(name), "pointerdown", from.x, from.y);
    await frames(1);
    pointer(document, "pointermove", from.x, from.y + Math.sign(to.y - from.y) * 8);
    await frames(2);
    pointer(document, "pointermove", from.x, to.y);
    await frames(6);
    if (drop) {
      pointer(document, "pointerup", from.x, to.y);
      await frames(30);
    }
    return { from, to };
  }
  const itemOf = (name: string) => handle(name).closest<HTMLElement>(".cui-sortable-list__item")!;

  describe("pointer drag", () => {
    it("moves a leaf among its group's leaves, and commits on drop", async () => {
      const grid = await openManager();
      await dragTo("Reads · A1", itemOf("Reads · A3"), false);
      // A floating ghost over a placeholder; nothing committed yet.
      expect(itemOf("Reads · A1").classList.contains("cui-sortable-list__item--dragging")).toBe(true);
      expect(document.body.querySelector(".cui-sortable-list__placeholder")).not.toBeNull();
      expect(leafOrder(grid)).toEqual(["A1", "A2", "A3", "B1", "B2"]);
      const { to } = { to: center(itemOf("Reads · A3")) };
      pointer(document, "pointerup", to.x, to.y);
      await frames(30);
      expect(leafOrder(grid)).toEqual(["A2", "A3", "A1", "B1", "B2"]);
      expect(unitOrder(grid)).toEqual(["EPC", "Reads", "RSSI"]);
    });

    it("keeps a dragged leaf inside its group: dropping it over another group's leaf moves it to the end of its own", async () => {
      const grid = await openManager();
      await dragTo("Reads · A1", itemOf("RSSI · B1"));
      expect(leafOrder(grid)).toEqual(["A2", "A3", "A1", "B1", "B2"]);
      expect(unitOrder(grid)).toEqual(["EPC", "Reads", "RSSI"]);
    });

    it("moves a whole group by its header handle, its leaves with it", async () => {
      const grid = await openManager();
      await dragTo("RSSI", itemOf("Reads"));
      expect(unitOrder(grid)).toEqual(["EPC", "RSSI", "Reads"]);
      expect(leafOrder(grid)).toEqual(["B1", "B2", "A1", "A2", "A3"]);
    });

    it("moves a loose column among the groups, never into one", async () => {
      const grid = await openManager();
      await dragTo("EPC", itemOf("RSSI"));
      expect(unitOrder(grid)).toEqual(["Reads", "RSSI", "EPC"]);
      expect(leafOrder(grid)).toEqual(["A1", "A2", "A3", "B1", "B2"]);
    });

    it("restores everything on Escape mid-drag", async () => {
      const grid = await openManager();
      await dragTo("RSSI", itemOf("Reads"), false);
      await userEvent.keyboard("{Escape}");
      await frames(30);
      expect(unitOrder(grid)).toEqual(["EPC", "Reads", "RSSI"]);
      expect(document.body.querySelector(".cui-sortable-list__placeholder")).toBeNull();
      // Escape cancelled the drag only: the popover is still open.
      expect(document.body.querySelector(".cui-data-grid-column-manager__list")).not.toBeNull();
    });

    it("does not start a drag from a frozen row", async () => {
      const grid = await openManager([{ key: "f", label: "Frozen", sticky: true, width: "100px" }, ...columns]);
      expect(document.body.querySelector('button[aria-label="Reorder Frozen"]')).toBeNull();
      expect(unitOrder(grid)[0]).toBe("Frozen");
    });
  });

  describe("keyboard", () => {
    it("grabs a leaf, moves it within its group, drops it, and announces each step", async () => {
      const grid = await openManager();
      handle("Reads · A1").focus();
      await userEvent.keyboard(" ");
      expect(status(".cui-data-grid-column-manager__leaves")).toBe("Reads · A1 grabbed, position 1 of 3.");
      // (the grab's wording is the list's own; a move's is the grid's `moved`, which has no full stop)
      await userEvent.keyboard("{ArrowDown}");
      await frames(3);
      expect(status(".cui-data-grid-column-manager__leaves")).toBe("Reads · A1 moved to position 2 of 3");
      expect(leafOrder(grid)).toEqual(["A1", "A2", "A3", "B1", "B2"]); // not committed until the drop
      await userEvent.keyboard(" ");
      await frames(3);
      expect(leafOrder(grid)).toEqual(["A2", "A1", "A3", "B1", "B2"]);
      expect(document.activeElement).toBe(handle("Reads · A1"));
    });

    it("stops a grabbed leaf at its group's last place", async () => {
      const grid = await openManager();
      handle("Reads · A1").focus();
      await userEvent.keyboard(" {ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown} ");
      await frames(3);
      expect(leafOrder(grid)).toEqual(["A2", "A3", "A1", "B1", "B2"]);
    });

    it("grabs a group and moves it whole; Escape puts it back", async () => {
      const grid = await openManager();
      handle("Reads").focus();
      await userEvent.keyboard(" {ArrowDown}");
      await frames(3);
      await userEvent.keyboard("{Escape}");
      await frames(3);
      expect(unitOrder(grid)).toEqual(["EPC", "Reads", "RSSI"]);
      expect(document.body.querySelector(".cui-data-grid-column-manager__list")).not.toBeNull();
      await userEvent.keyboard(" {ArrowDown} ");
      await frames(3);
      expect(unitOrder(grid)).toEqual(["EPC", "RSSI", "Reads"]);
      expect(leafOrder(grid)).toEqual(["B1", "B2", "A1", "A2", "A3"]);
    });

    it("moves between a group's handles and its leaves' with the arrow keys, each list on its own", async () => {
      await openManager();
      handle("Reads").focus();
      await userEvent.keyboard("{ArrowDown}");
      // Down from a group goes to the next group, not into its leaves: they are another list.
      expect(document.activeElement).toBe(handle("RSSI"));
      handle("Reads · A1").focus();
      await userEvent.keyboard("{ArrowDown}");
      expect(document.activeElement).toBe(handle("Reads · A2"));
      await userEvent.keyboard("{End}");
      expect(document.activeElement).toBe(handle("Reads · A3"));
      await userEvent.keyboard("{ArrowDown}");
      expect(document.activeElement).toBe(handle("Reads · A3"));
    });
  });

  describe("move buttons", () => {
    const button = (name: string) => document.body.querySelector<HTMLElement>(`button[aria-label="${name}"]`)!;

    it("move a leaf, and a group as a block", async () => {
      const grid = await openManager();
      await userEvent.click(button("Move Reads · A3 up"));
      await frames(3);
      expect(leafOrder(grid)).toEqual(["A1", "A3", "A2", "B1", "B2"]);
      await userEvent.click(button("Move Reads down"));
      await frames(3);
      expect(unitOrder(grid)).toEqual(["EPC", "RSSI", "Reads"]);
      expect(leafOrder(grid)).toEqual(["B1", "B2", "A1", "A3", "A2"]);
    });
  });
});

import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { defineComponent, h, ref } from "vue";
import { mount, type VueWrapper } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import main from "../../styles/main.css?inline";
import CuiTransferList from "../../components/CuiTransferList.vue";
import { frames, installTokens } from "../../../../../config/test/browser-helpers";

/**
 * #559 — CuiTransferList's selected list is a CuiSortableList. In a real browser, where the
 * ghost, the placeholder and the focus are real: a pointer drag on a row's handle commits on
 * the drop and Escape restores it, the keyboard grabs, moves and drops, and a transfer between
 * the two lists still works with the sortable on the right.
 */
describe("CuiTransferList selected list (real browser)", () => {
  let removeTokens: () => void;
  beforeAll(() => (removeTokens = installTokens(main)));
  afterAll(() => removeTokens());

  const mounted: VueWrapper[] = [];
  afterEach(() => {
    mounted.splice(0).forEach((w) => w.unmount());
    document.body.innerHTML = "";
  });

  const ITEMS = [
    { value: "a", label: "Alpha" },
    { value: "b", label: "Bravo" },
    { value: "c", label: "Charlie" },
    { value: "d", label: "Delta" },
    { value: "e", label: "Echo" },
  ];

  function mountList(selected = ["a", "b", "c"], { sourceOrder: initialOrder, ...props }: Record<string, unknown> = {}) {
    const model = ref<(string | number)[]>(selected);
    const order = ref<(string | number)[] | undefined>(initialOrder as (string | number)[] | undefined);
    const emits: Array<(string | number)[]> = [];
    /** Every emit in the order it happened: the left order and the selected list. */
    const log: string[] = [];
    const orders: Array<(string | number)[]> = [];
    const App = defineComponent({
      render: () =>
        h(CuiTransferList, {
          items: ITEMS,
          modelValue: model.value,
          filterable: false,
          "onUpdate:modelValue": (v: (string | number)[]) => {
            emits.push(v);
            log.push("model");
            model.value = v;
          },
          sourceOrder: order.value,
          "onUpdate:sourceOrder": (v: (string | number)[]) => {
            orders.push(v);
            log.push("order");
            order.value = v;
          },
          ...props,
        }),
    });
    const host = document.createElement("div");
    host.style.cssText = "width: 520px; padding: 8px";
    document.body.append(host);
    mounted.push(mount(App, { attachTo: host }));
    return { model, emits, orders, order, log };
  }

  const sortable = () => document.querySelector<HTMLElement>(".cui-transfer-list__sortable")!;
  const rowItems = () => [...sortable().querySelectorAll<HTMLElement>(".cui-sortable-list__item")];
  const order = () => rowItems().map((li) => li.querySelector(".cui-transfer-list__label")!.textContent!.trim());
  const rowOf = (label: string) => rowItems().find((li) => li.textContent!.includes(label))!;
  const handle = (label: string) => rowOf(label).querySelector<HTMLElement>(".cui-sortable-list__handle")!;
  const placeholder = () => sortable().querySelector<HTMLElement>(".cui-sortable-list__placeholder");
  const sourceOptions = () => [...document.querySelectorAll<HTMLElement>('[role="listbox"] [role="option"]')];

  function pointer(target: EventTarget, type: string, x: number, y: number) {
    target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, composed: true, pointerId: 7, isPrimary: true, pointerType: "mouse", clientX: x, clientY: y, button: 0 }));
  }
  const center = (el: Element) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };
  async function dragBy(label: string, dy: number) {
    const from = center(handle(label));
    pointer(handle(label), "pointerdown", from.x, from.y);
    await frames(1);
    pointer(document, "pointermove", from.x, from.y + 8);
    await frames(2);
    pointer(document, "pointermove", from.x, from.y + dy);
    await frames(3);
    return from;
  }

  describe("pointer drag", () => {
    it("floats the dragged row after the pointer, then commits the new order on the drop", async () => {
      const { model, emits } = mountList();
      await frames(2);
      const slot = rowOf("Alpha").getBoundingClientRect();
      const dy = rowOf("Bravo").getBoundingClientRect().height + 14;
      const from = await dragBy("Alpha", dy);
      // The ghost follows the pointer, over a placeholder that holds its slot.
      const ghost = rowOf("Alpha");
      expect(getComputedStyle(ghost).position).toBe("absolute");
      expect(Math.abs(center(ghost).y - (slot.top + slot.height / 2 + dy))).toBeLessThan(2);
      expect(placeholder()).not.toBeNull();
      expect(emits).toEqual([]); // nothing is committed mid-drag
      pointer(document, "pointerup", from.x, from.y + dy);
      await frames(30);
      expect(model.value).toEqual(["b", "a", "c"]);
      expect(order()).toEqual(["Bravo", "Alpha", "Charlie"]);
      expect(emits).toEqual([["b", "a", "c"]]); // once
      expect(placeholder()).toBeNull();
    });

    it("restores the order on Escape and emits nothing", async () => {
      const { model, emits } = mountList();
      await frames(2);
      await dragBy("Alpha", 2 * rowOf("Bravo").getBoundingClientRect().height + 20);
      await frames(5);
      await userEvent.keyboard("{Escape}");
      await frames(30);
      expect(order()).toEqual(["Alpha", "Bravo", "Charlie"]);
      expect(model.value).toEqual(["a", "b", "c"]);
      expect(emits).toEqual([]);
    });

    it("keeps the other panel and the move buttons out of the drag", async () => {
      mountList();
      await frames(2);
      const before = sourceOptions().map((o) => o.textContent);
      const from = await dragBy("Alpha", 30);
      pointer(document, "pointerup", from.x, from.y + 30);
      await frames(30);
      expect(sourceOptions().map((o) => o.textContent)).toEqual(before);
    });
  });

  describe("keyboard", () => {
    it("grabs with Space, moves with the arrows, drops with Space, committing once", async () => {
      const { model, emits } = mountList();
      await frames(2);
      handle("Alpha").focus();
      await userEvent.keyboard(" {ArrowDown}{ArrowDown}");
      expect(emits).toEqual([]);
      await userEvent.keyboard(" ");
      await frames(2);
      expect(model.value).toEqual(["b", "c", "a"]);
      expect(emits).toHaveLength(1);
      expect(document.activeElement).toBe(handle("Alpha")); // focus stays with the item
    });

    it("cancels a grab with Escape", async () => {
      const { model } = mountList();
      await frames(2);
      handle("Bravo").focus();
      await userEvent.keyboard("{Enter}{End}{Escape}");
      await frames(2);
      expect(order()).toEqual(["Alpha", "Bravo", "Charlie"]);
      expect(model.value).toEqual(["a", "b", "c"]);
    });

    it("has one tab stop in the list, on a handle", async () => {
      mountList();
      await frames(2);
      const stops = [...sortable().querySelectorAll<HTMLElement>(".cui-sortable-list__handle")].filter((h) => h.tabIndex === 0);
      expect(stops).toHaveLength(1);
    });

    it("marks a row with Shift+Space and Move down then reorders it", async () => {
      const { model } = mountList();
      await frames(2);
      handle("Alpha").focus();
      await userEvent.keyboard("{Shift>} {/Shift}");
      await frames(2);
      expect(rowOf("Alpha").querySelector(".cui-transfer-list__option--selected")).not.toBeNull();
      (document.querySelector('button[aria-label="Move down"]') as HTMLElement).click();
      await frames(2);
      expect(model.value).toEqual(["b", "a", "c"]);
    });
  });

  describe("disabled rows and announcements (#577)", () => {
    const live = () => document.querySelector<HTMLElement>(".cui-sortable-list [role=status]")!;
    const disabledB = { items: ITEMS.map((i) => (i.value === "b" ? { ...i, disabled: true } : i)) };

    it("reaches a disabled row by the arrows, and Space, Enter, Shift+Space and Delete do nothing on it", async () => {
      const { model, emits } = mountList(["a", "b", "c"], disabledB);
      await frames(2);
      handle("Alpha").focus();
      await userEvent.keyboard("{ArrowDown}");
      expect(document.activeElement).toBe(handle("Bravo"));
      expect(handle("Bravo").getAttribute("aria-disabled")).toBe("true");
      await userEvent.keyboard(" {Enter}{Shift>} {/Shift}{Delete}{Backspace}");
      await frames(3);
      expect(handle("Bravo").getAttribute("aria-pressed")).toBe("false");
      expect(rowOf("Bravo").querySelector(".cui-transfer-list__option--selected")).toBeNull();
      expect(model.value).toEqual(["a", "b", "c"]);
      expect(emits).toEqual([]);
    });

    it("lets a neighbour's move pass a disabled row", async () => {
      const { model } = mountList(["a", "b", "c"], disabledB);
      await frames(2);
      handle("Alpha").focus();
      await userEvent.keyboard(" {ArrowDown} ");
      await frames(2);
      expect(model.value).toEqual(["b", "a", "c"]);
    });

    it("announces marking and unmarking through the sortable's one live region", async () => {
      mountList();
      await frames(2);
      handle("Alpha").focus();
      await userEvent.keyboard("{Shift>} {/Shift}");
      await frames(2);
      expect(live().textContent!.trim()).toBe("Alpha selected");
      await userEvent.keyboard("{Shift>} {/Shift}");
      await frames(2);
      expect(live().textContent!.trim()).toBe("Alpha not selected");
    });

    it("lists Shift+Space and Delete in the handle's instructions", async () => {
      mountList();
      await frames(2);
      const text = document.getElementById(handle("Alpha").getAttribute("aria-describedby")!)!.textContent!;
      expect(text).toContain("Shift+Space");
      expect(text).toContain("Delete");
    });
  });

  describe("transfer between the lists", () => {
    it("takes a row from the source into the selected list, keyed so the others keep their place", async () => {
      const { model } = mountList(["a", "b"]);
      await frames(2);
      const alphaHandle = handle("Alpha");
      sourceOptions().find((o) => o.textContent!.includes("Delta"))!.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
      await frames(3);
      expect(model.value).toEqual(["a", "b", "d"]);
      expect(order()).toEqual(["Alpha", "Bravo", "Delta"]);
      expect(handle("Alpha")).toBe(alphaHandle); // the same DOM: the key held
    });

    it("returns a row with Delete and the sortable keeps working afterwards", async () => {
      const { model } = mountList();
      await frames(2);
      handle("Bravo").focus();
      await userEvent.keyboard("{Delete}");
      await frames(3);
      expect(model.value).toEqual(["a", "c"]);
      expect(document.activeElement).toBe(handle("Charlie"));
      await userEvent.keyboard(" {ArrowUp} ");
      await frames(2);
      expect(model.value).toEqual(["c", "a"]);
    });

    it("moves the marked rows back with the toolbar button", async () => {
      const { model } = mountList();
      await frames(2);
      rowOf("Charlie").querySelector<HTMLElement>(".cui-transfer-list__option")!.click();
      await frames(1);
      (document.querySelector('button[aria-label="Move selected to Available"]') as HTMLElement).click();
      await frames(3);
      expect(model.value).toEqual(["a", "b"]);
      expect(order()).toEqual(["Alpha", "Bravo"]);
    });
  });
  /** A drag from a row of either list: press, a first move past the slop, then to (x, y). */
  async function dragRow(row: HTMLElement, to: (rows: HTMLElement) => { x: number; y: number }) {
    const from = center(row);
    pointer(row, "pointerdown", from.x, from.y);
    await frames(1);
    pointer(document, "pointermove", from.x + 2, from.y + 8);
    await frames(2);
    const at = to(row);
    pointer(document, "pointermove", at.x, at.y);
    await frames(3);
    return at;
  }
  const sourceOption = (label: string) => sourceOptions().find((o) => o.textContent!.includes(label))!;
  const ghost = () => document.querySelector<HTMLElement>(".cui-transfer-list__ghost");
  const slotOfPlaceholder = () => [...sortable().querySelectorAll(".cui-sortable-list__item, .cui-sortable-list__placeholder")].findIndex((el) => el.classList.contains("cui-sortable-list__placeholder"));
  const rect = (el: Element) => el.getBoundingClientRect();
  const targetPoint = (frac: number, row = 0) => ({ x: rect(rowItems()[0]).left + 40, y: rect(rowItems()[row]).top + rect(rowItems()[row]).height * frac });

  describe("dragging between the lists (pointer, either direction)", () => {
    it("floats a tilted ghost after a source row, which stays behind, faint", async () => {
      mountList(["a", "b"]);
      await frames(2);
      const row = sourceOption("Delta");
      const at = await dragRow(row, () => targetPoint(0.5));
      expect(ghost()).not.toBeNull();
      await frames(20); // the lift eases in
      const g = getComputedStyle(ghost()!);
      expect(g.position).toBe("fixed");
      expect(g.rotate).toBe("2deg");
      expect(Number(g.opacity)).toBeCloseTo(0.9, 2);
      expect(g.boxShadow).not.toBe("none");
      const r = rect(ghost()!);
      // It follows the pointer (the tilt turns the offset a little, as the sortable's own ghost does).
      expect(Math.abs(r.left + r.width / 2 - at.x)).toBeLessThan(12);
      expect(Math.abs(r.top + r.height / 2 - at.y)).toBeLessThan(12);
      expect(row.classList.contains("cui-transfer-list__option--lifted")).toBe(true);
      pointer(document, "pointerup", at.x, at.y);
      await frames(3);
      expect(ghost()).toBeNull();
    });

    it("shows the sortable's placeholder at the top, middle and bottom of the selected list, and commits there on the drop", async () => {
      for (const [where, slot, expected] of [
        ["top", 0, ["d", "a", "b", "c"]],
        ["middle", 1, ["a", "d", "b", "c"]],
        ["bottom", 3, ["a", "b", "c", "d"]],
      ] as const) {
        const { model, emits } = mountList(["a", "b", "c"]);
        await frames(2);
        const last = rowItems().length - 1;
        const at = await dragRow(sourceOption("Delta"), () => (where === "top" ? targetPoint(0.2, 0) : where === "middle" ? targetPoint(0.7, 0) : targetPoint(0.9, last)));
        await frames(3);
        expect(slotOfPlaceholder(), where).toBe(slot);
        const ph = sortable().querySelector<HTMLElement>(".cui-sortable-list__placeholder")!;
        expect(Math.abs(rect(ph).height - rect(sourceOption("Delta")).height)).toBeLessThan(2); // the larger target: the row's size
        expect(emits).toEqual([]); // nothing is committed mid-drag
        pointer(document, "pointerup", at.x, at.y);
        await frames(3);
        expect(model.value, where).toEqual(expected);
        expect(emits).toHaveLength(1);
        expect(sortable().querySelector(".cui-sortable-list__placeholder")).toBeNull();
        mounted.splice(0).forEach((w) => w.unmount());
        document.body.innerHTML = "";
      }
    });

    it("lets the rows slide aside: the ones below the placeholder move down by its height", async () => {
      mountList(["a", "b", "c"]);
      await frames(2);
      const before = rowItems().map((li) => rect(li).top);
      await dragRow(sourceOption("Delta"), () => targetPoint(0.2, 0));
      await frames(30);
      const after = rowItems().map((li) => rect(li).top);
      const h = rect(sortable().querySelector(".cui-sortable-list__placeholder")!).height;
      after.forEach((t, i) => expect(t - before[i]).toBeCloseTo(h, 0));
      pointer(document, "pointerup", 0, 0);
      await frames(3);
    });

    it("walks down the slots: a slot is taken by the rows' own places, not shifted by the placeholder", async () => {
      mountList(["a", "b", "c"]);
      await frames(2);
      const rows = rowItems().map(rect);
      const x = rows[0].left + 40;
      const row = sourceOption("Delta");
      const from = center(row);
      pointer(row, "pointerdown", from.x, from.y);
      await frames(1);
      pointer(document, "pointermove", from.x + 2, from.y + 8);
      for (const [y, slot] of [[rows[0].top + rows[0].height * 0.7, 1], [rows[1].top + rows[1].height * 0.7, 2], [rows[2].top + rows[2].height * 0.7, 3], [rows[0].top + 2, 0]] as const) {
        pointer(document, "pointermove", x, y);
        await frames(3);
        expect(slotOfPlaceholder()).toBe(slot);
      }
      pointer(document, "pointerup", x, rows[0].top + 2);
      await frames(3);
    });

    it("slides the rows aside by animation, not a jump", async () => {
      mountList(["a", "b", "c"]);
      await frames(2);
      await dragRow(sourceOption("Delta"), () => targetPoint(0.2, 0));
      const sliding = rowItems().filter((li) => li.getAnimations().length > 0);
      expect(sliding.length).toBeGreaterThan(0);
      pointer(document, "pointerup", 0, 0);
      await frames(3);
    });

    it("maps a slot of the filtered selected list back into the full order", async () => {
      const { model } = mountList(["a", "b", "c", "d"], { filterable: true });
      await frames(2);
      const input = document.querySelectorAll<HTMLInputElement>("input")[1];
      input.value = "l"; // Alpha, Charlie, Delta
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await frames(3);
      expect(order()).toEqual(["Alpha", "Charlie", "Delta"]);
      const at = await dragRow(sourceOption("Echo"), () => targetPoint(0.2, 1)); // before Charlie
      expect(slotOfPlaceholder()).toBe(1);
      pointer(document, "pointerup", at.x, at.y);
      await frames(3);
      expect(model.value).toEqual(["a", "b", "e", "c", "d"]); // Bravo stays hidden, in place
    });

    it("does not light or drop onto the list a row was dragged from", async () => {
      const { emits } = mountList(["a"]);
      await frames(2);
      const scroller = document.querySelectorAll<HTMLElement>(".cui-transfer-list__scroller")[0];
      const at = await dragRow(sourceOption("Delta"), () => ({ x: rect(scroller).left + 40, y: rect(scroller).top + 60 }));
      expect(scroller.classList.contains("cui-transfer-list__scroller--drop")).toBe(false);
      pointer(document, "pointerup", at.x, at.y);
      await frames(3);
      expect(emits).toEqual([]);
    });

    it("shows the placeholder in an empty selected list, and drops into it", async () => {
      const { model } = mountList([]);
      await frames(2);
      const scroller = document.querySelectorAll<HTMLElement>(".cui-transfer-list__scroller")[1];
      const at = await dragRow(sourceOption("Delta"), () => ({ x: rect(scroller).left + 20, y: rect(scroller).top + 20 }));
      expect(slotOfPlaceholder()).toBe(0);
      expect(document.querySelectorAll(".cui-transfer-list__empty")).toHaveLength(0); // the "No items" message steps aside
      pointer(document, "pointerup", at.x, at.y);
      await frames(3);
      expect(model.value).toEqual(["d"]);
    });

    it("cancels a left-to-right drag on Escape: nothing moves, nothing is emitted", async () => {
      const { model, emits } = mountList(["a", "b"]);
      await frames(2);
      await dragRow(sourceOption("Delta"), () => targetPoint(0.2, 0));
      expect(slotOfPlaceholder()).toBe(0);
      await userEvent.keyboard("{Escape}");
      await frames(3);
      expect(ghost()).toBeNull();
      expect(sortable().querySelector(".cui-sortable-list__placeholder")).toBeNull();
      expect(model.value).toEqual(["a", "b"]);
      expect(emits).toEqual([]);
    });

    it("does nothing when released over the same list or outside both", async () => {
      const { emits } = mountList(["a"]);
      await frames(2);
      const at = await dragRow(sourceOption("Delta"), () => ({ x: 2, y: 2 }));
      expect(sortable().querySelector(".cui-sortable-list__placeholder")).toBeNull();
      pointer(document, "pointerup", at.x, at.y);
      await frames(3);
      expect(emits).toEqual([]);
    });

    it("does not mark the row the drag ended on", async () => {
      mountList(["a"]);
      await frames(2);
      const row = sourceOption("Delta");
      const at = await dragRow(row, () => ({ x: rect(row).left + 30, y: rect(row).top + 10 }));
      pointer(document, "pointerup", at.x, at.y);
      row.click();
      await frames(2);
      expect(row.getAttribute("aria-selected")).toBe("false");
      row.click(); // an ordinary click marks again
      await frames(2);
      expect(row.getAttribute("aria-selected")).toBe("true");
    });

    it("drags a selected row's body over the source list: the panel lights, and the drop returns it", async () => {
      const { model, orders } = mountList(["a", "b", "c"]);
      await frames(2);
      const body = rowOf("Bravo").querySelector<HTMLElement>(".cui-transfer-list__option")!;
      const scroller = document.querySelectorAll<HTMLElement>(".cui-transfer-list__scroller")[0];
      const at = await dragRow(body, () => ({ x: rect(scroller).left + 40, y: rect(scroller).top + 30 }));
      expect(ghost()).not.toBeNull();
      expect(scroller.classList.contains("cui-transfer-list__scroller--drop")).toBe(true);
      const style = getComputedStyle(scroller);
      expect(style.outlineStyle).toBe("solid"); // not the old thin dashed line
      expect(style.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
      pointer(document, "pointerup", at.x, at.y);
      await frames(3);
      expect(model.value).toEqual(["a", "c"]);
      expect(scroller.classList.contains("cui-transfer-list__scroller--drop")).toBe(false);
      expect(orders).toEqual([]); // no sourceOrder: nothing to say about a left order
    });

    it("cancels a right-to-left drag on Escape", async () => {
      const { model } = mountList(["a", "b"]);
      await frames(2);
      const body = rowOf("Alpha").querySelector<HTMLElement>(".cui-transfer-list__option")!;
      const scroller = document.querySelectorAll<HTMLElement>(".cui-transfer-list__scroller")[0];
      await dragRow(body, () => ({ x: rect(scroller).left + 40, y: rect(scroller).top + 30 }));
      await userEvent.keyboard("{Escape}");
      await frames(3);
      expect(model.value).toEqual(["a", "b"]);
      expect(ghost()).toBeNull();
    });

    it("does not drag a disabled item or in a disabled list", async () => {
      mountList(["a"], { items: ITEMS.map((i) => (i.value === "d" ? { ...i, disabled: true } : i)) });
      await frames(2);
      await dragRow(sourceOption("Delta"), () => targetPoint(0.5));
      expect(ghost()).toBeNull();
    });

    it("takes a touch drag only from the grip", async () => {
      mountList(["a"]);
      await frames(2);
      const row = sourceOption("Delta");
      const down = (el: Element) => el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true, pointerId: 9, isPrimary: true, pointerType: "touch", clientX: 50, clientY: 50, button: 0 }));
      down(row.querySelector(".cui-transfer-list__label")!);
      const move = (x: number, y: number) => document.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerId: 9, isPrimary: true, pointerType: "touch", clientX: x, clientY: y }));
      move(50, 90);
      await frames(2);
      move(80, 140);
      await frames(2);
      expect(ghost()).toBeNull();
      expect(getComputedStyle(row.querySelector(".cui-transfer-list__grip")!).touchAction).toBe("none");
    });
  });
  describe("an orderable left list (sourceOrder)", () => {
    const ORDER = ["a", "b", "c", "d", "e"];
    const leftList = () => document.querySelectorAll<HTMLElement>(".cui-transfer-list__sortable")[0];
    const leftItems = () => [...leftList().querySelectorAll<HTMLElement>(".cui-sortable-list__item")];
    const leftOrder = () => leftItems().map((li) => li.querySelector(".cui-transfer-list__label")!.textContent!.trim());
    const leftHandle = (label: string) => leftItems().find((li) => li.textContent!.includes(label))!.querySelector<HTMLElement>(".cui-sortable-list__handle")!;
    const leftSlot = () => [...leftList().querySelectorAll(".cui-sortable-list__item, .cui-sortable-list__placeholder")].findIndex((el) => el.classList.contains("cui-sortable-list__placeholder"));
    // Both lists are sortables here: the helpers above look at the first, which is now the left one.
    const rightBody = (label: string) =>
      [...document.querySelectorAll<HTMLElement>(".cui-transfer-list__sortable")[1].querySelectorAll<HTMLElement>(".cui-sortable-list__item")]
        .find((li) => li.textContent!.includes(label))!
        .querySelector<HTMLElement>(".cui-transfer-list__option")!;
    const leftPoint = (frac: number, row: number) => ({ x: rect(leftItems()[0]).left + 40, y: rect(leftItems()[row]).top + rect(leftItems()[row]).height * frac });

    it("drags a left row by its handle within the left list: only the left order is emitted, once", async () => {
      const { orders, emits, order } = mountList(["d", "e"], { sourceOrder: ORDER });
      await frames(2);
      expect(leftOrder()).toEqual(["Alpha", "Bravo", "Charlie"]);
      const from = center(leftHandle("Alpha"));
      const dy = rect(leftItems()[1]).height + 14;
      pointer(leftHandle("Alpha"), "pointerdown", from.x, from.y);
      await frames(1);
      pointer(document, "pointermove", from.x, from.y + 8);
      await frames(2);
      pointer(document, "pointermove", from.x, from.y + dy);
      await frames(3);
      expect(getComputedStyle(leftItems().find((li) => li.textContent!.includes("Alpha"))!).position).toBe("absolute"); // the sortable's own ghost
      expect(orders).toEqual([]);
      pointer(document, "pointerup", from.x, from.y + dy);
      await frames(30);
      expect(leftOrder()).toEqual(["Bravo", "Alpha", "Charlie"]);
      expect(orders).toEqual([["b", "a", "c"]]);
      expect(order.value).toEqual(["b", "a", "c"]);
      expect(emits).toEqual([]);
    });

    it("opens the placeholder at the top, middle and bottom of the left list for a right-hand row, and commits there", async () => {
      for (const [where, slot, expected] of [
        ["top", 0, ["d", "a", "b", "c"]],
        ["middle", 2, ["a", "b", "d", "c"]],
        ["bottom", 3, ["a", "b", "c", "d"]],
      ] as const) {
        const { orders, emits, log } = mountList(["d", "e"], { sourceOrder: ["a", "b", "c"] });
        await frames(2);
        const last = leftItems().length - 1;
        const at = await dragRow(rightBody("Delta"), () => (where === "top" ? leftPoint(0.2, 0) : where === "middle" ? leftPoint(0.7, 1) : leftPoint(0.9, last)));
        await frames(3);
        expect(leftSlot(), where).toBe(slot);
        const ph = leftList().querySelector<HTMLElement>(".cui-sortable-list__placeholder")!;
        expect(Math.abs(rect(ph).height - rect(rightBody("Delta")).height)).toBeLessThan(2);
        expect(document.querySelector(".cui-transfer-list__scroller--drop"), "no whole-panel outline").toBeNull();
        expect(orders).toEqual([]);
        pointer(document, "pointerup", at.x, at.y);
        await frames(3);
        expect(orders, where).toEqual([expected]);
        expect(emits).toEqual([["e"]]);
        expect(log).toEqual(["order", "model"]); // once each, the left order first
        mounted.splice(0).forEach((w) => w.unmount());
        document.body.innerHTML = "";
      }
    });

    it("drops into an empty left list", async () => {
      const { orders, model } = mountList(["a", "b", "c", "d", "e"], { sourceOrder: ORDER });
      await frames(2);
      const scroller = document.querySelectorAll<HTMLElement>(".cui-transfer-list__scroller")[0];
      const at = await dragRow(rightBody("Bravo"), () => ({ x: rect(scroller).left + 20, y: rect(scroller).top + 20 }));
      expect(leftSlot()).toBe(0);
      expect(scroller.querySelector(".cui-transfer-list__empty")).toBeNull(); // "No items" steps aside
      pointer(document, "pointerup", at.x, at.y);
      await frames(3);
      expect(orders).toEqual([["b"]]);
      expect(model.value).toEqual(["a", "c", "d", "e"]);
    });

    it("cancels a right-to-left drag on Escape: no placeholder, nothing emitted", async () => {
      const { log } = mountList(["d", "e"], { sourceOrder: ["a", "b", "c"] });
      await frames(2);
      await dragRow(rightBody("Delta"), () => leftPoint(0.2, 0));
      expect(leftSlot()).toBe(0);
      await userEvent.keyboard("{Escape}");
      await frames(3);
      expect(leftList().querySelector(".cui-sortable-list__placeholder")).toBeNull();
      expect(log).toEqual([]);
    });

    it("maps a drop in the filtered left list back into the full left order", async () => {
      const { orders } = mountList(["e"], { sourceOrder: ["a", "b", "c", "d"], filterable: true });
      await frames(2);
      const input = document.querySelectorAll<HTMLInputElement>("input")[0];
      input.value = "l"; // Alpha, Charlie, Delta
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await frames(3);
      expect(leftOrder()).toEqual(["Alpha", "Charlie", "Delta"]);
      const at = await dragRow(rightBody("Echo"), () => leftPoint(0.2, 1)); // before Charlie
      expect(leftSlot()).toBe(1);
      pointer(document, "pointerup", at.x, at.y);
      await frames(3);
      expect(orders).toEqual([["a", "b", "e", "c", "d"]]);
    });

    it("grabs, moves and drops a left row from the keyboard", async () => {
      const { orders, emits } = mountList(["d", "e"], { sourceOrder: ORDER });
      await frames(2);
      leftHandle("Alpha").focus();
      await userEvent.keyboard(" {ArrowDown}{ArrowDown}");
      expect(orders).toEqual([]);
      await userEvent.keyboard(" ");
      await frames(2);
      expect(orders).toEqual([["b", "c", "a"]]);
      expect(emits).toEqual([]);
      expect(document.activeElement).toBe(leftHandle("Alpha"));
    });

    it("keeps the whole-panel highlight, and no placeholder, when the left list is not orderable", async () => {
      mountList(["a", "b"]);
      await frames(2);
      const scroller = document.querySelectorAll<HTMLElement>(".cui-transfer-list__scroller")[0];
      await dragRow(rowOf("Alpha").querySelector<HTMLElement>(".cui-transfer-list__option")!, () => ({ x: rect(scroller).left + 40, y: rect(scroller).top + 30 }));
      expect(scroller.classList.contains("cui-transfer-list__scroller--drop")).toBe(true);
      expect(document.querySelectorAll(".cui-sortable-list__placeholder")).toHaveLength(0);
      pointer(document, "pointerup", 0, 0);
      await frames(3);
    });
  });

  describe("dragging by the grip across the lists (#577)", () => {
    const lists = () => document.querySelectorAll<HTMLElement>(".cui-transfer-list__sortable");
    const leftScroller = () => document.querySelectorAll<HTMLElement>(".cui-transfer-list__scroller")[0];
    const inList = (list: HTMLElement, label: string) =>
      [...list.querySelectorAll<HTMLElement>(".cui-sortable-list__item")].find((li) => li.textContent!.includes(label))!.querySelector<HTMLElement>(".cui-sortable-list__handle")!;
    const leftSlotOf = () => [...lists()[0].querySelectorAll(".cui-sortable-list__item, .cui-sortable-list__placeholder")].findIndex((el) => el.classList.contains("cui-sortable-list__placeholder"));

    it("takes a selected row to the left list by its grip: the panel lights, one ghost, the drop transfers", async () => {
      const { model, orders } = mountList(["a", "b", "c"]);
      await frames(2);
      const to = { x: rect(leftScroller()).left + 40, y: rect(leftScroller()).top + 30 };
      const at = await dragRow(handle("Bravo"), () => to);
      expect(document.querySelectorAll(".cui-transfer-list__ghost")).toHaveLength(1);
      expect(leftScroller().classList.contains("cui-transfer-list__scroller--drop")).toBe(true);
      expect(order()).toEqual(["Alpha", "Bravo", "Charlie"]); // the sortable's own reorder was undone
      pointer(document, "pointerup", at.x, at.y);
      await frames(30);
      expect(model.value).toEqual(["a", "c"]);
      expect(orders).toEqual([]);
      expect(ghost()).toBeNull();
    });

    it("takes it to a slot of an orderable left list", async () => {
      const { model, orders, log } = mountList(["d", "e"], { sourceOrder: ["a", "b", "c"] });
      await frames(2);
      const items = [...lists()[0].querySelectorAll<HTMLElement>(".cui-sortable-list__item")];
      const at = await dragRow(inList(lists()[1], "Delta"), () => ({ x: rect(items[0]).left + 40, y: rect(items[1]).top + rect(items[1]).height * 0.7 }));
      expect(leftSlotOf()).toBe(2);
      expect(document.querySelector(".cui-transfer-list__scroller--drop")).toBeNull();
      pointer(document, "pointerup", at.x, at.y);
      await frames(30);
      expect(orders).toEqual([["a", "b", "d", "c"]]);
      expect(model.value).toEqual(["e"]);
      expect(log).toEqual(["order", "model"]);
    });

    it("takes a left row by its grip to the selected list at the slot", async () => {
      const { model, orders } = mountList(["d", "e"], { sourceOrder: ["a", "b", "c"] });
      await frames(2);
      const items = [...lists()[1].querySelectorAll<HTMLElement>(".cui-sortable-list__item")];
      const at = await dragRow(inList(lists()[0], "Bravo"), () => ({ x: rect(items[0]).left + 40, y: rect(items[1]).top + rect(items[1]).height * 0.7 }));
      expect(document.querySelectorAll(".cui-transfer-list__ghost")).toHaveLength(1);
      pointer(document, "pointerup", at.x, at.y);
      await frames(30);
      expect(model.value).toEqual(["d", "e", "b"]);
      expect(orders).toEqual([]);
    });

    it("still reorders by the grip within its own list", async () => {
      const { model, emits } = mountList(["a", "b", "c"]);
      await frames(2);
      await dragBy("Alpha", 100);
      expect(ghost()).toBeNull();
      const from = center(handle("Alpha"));
      pointer(document, "pointerup", from.x, from.y);
      await frames(30);
      expect(emits).toHaveLength(1);
      expect(model.value).not.toEqual(["a", "b", "c"]);
      expect(model.value.slice().sort()).toEqual(["a", "b", "c"]);
    });

    it("restores both lists on Escape after leaving", async () => {
      const { model, log } = mountList(["a", "b", "c"], { sourceOrder: ["d", "e"] });
      await frames(2);
      const items = [...lists()[0].querySelectorAll<HTMLElement>(".cui-sortable-list__item")];
      await dragRow(inList(lists()[1], "Bravo"), () => ({ x: rect(items[0]).left + 40, y: rect(items[0]).top + 5 }));
      expect(leftSlotOf()).toBe(0);
      await userEvent.keyboard("{Escape}");
      await frames(30);
      expect(leftSlotOf()).toBe(-1);
      expect(ghost()).toBeNull();
      expect([...lists()[1].querySelectorAll(".cui-transfer-list__label")].map((l) => l.textContent!.trim())).toEqual(["Alpha", "Bravo", "Charlie"]);
      expect(model.value).toEqual(["a", "b", "c"]);
      expect(log).toEqual([]);
    });

    it("does not drag a disabled row by its grip", async () => {
      const { model } = mountList(["a", "b", "c"], { items: ITEMS.map((i) => (i.value === "b" ? { ...i, disabled: true } : i)) });
      await frames(2);
      await dragRow(handle("Bravo"), () => ({ x: rect(leftScroller()).left + 40, y: rect(leftScroller()).top + 30 }));
      expect(ghost()).toBeNull();
      pointer(document, "pointerup", 0, 0);
      await frames(5);
      expect(model.value).toEqual(["a", "b", "c"]);
    });
  });
});

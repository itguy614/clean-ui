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

  function mountList(selected = ["a", "b", "c"], props: Record<string, unknown> = {}) {
    const model = ref<(string | number)[]>(selected);
    const emits: Array<(string | number)[]> = [];
    const App = defineComponent({
      render: () =>
        h(CuiTransferList, {
          items: ITEMS,
          modelValue: model.value,
          filterable: false,
          "onUpdate:modelValue": (v: (string | number)[]) => {
            emits.push(v);
            model.value = v;
          },
          ...props,
        }),
    });
    const host = document.createElement("div");
    host.style.cssText = "width: 520px; padding: 8px";
    document.body.append(host);
    mounted.push(mount(App, { attachTo: host }));
    return { model, emits };
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
});

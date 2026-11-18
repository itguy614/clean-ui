import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { defineComponent, h, ref } from "vue";
import { mount, type VueWrapper } from "@vue/test-utils";
import { cdp, userEvent } from "@vitest/browser/context";
import main from "../../styles/main.css?inline";
import CuiSortableList from "../../components/CuiSortableList.vue";
import { frames, installTokens } from "../../../../../config/test/browser-helpers";

/**
 * #198 — CuiSortableList in a real browser, where the layout it measures, the transform it
 * writes onto the dragged item and the stylesheet's own lift are all real. The pointer is
 * dispatched on the handle and the document (a synthetic mouse is the portable way to make
 * one); the keys are the browser's own.
 */
describe("CuiSortableList (real browser)", () => {
  let removeTokens: () => void;
  beforeAll(() => (removeTokens = installTokens(main)));
  afterAll(() => removeTokens());

  const mounted: VueWrapper[] = [];
  afterEach(() => {
    mounted.splice(0).forEach((w) => w.unmount());
    document.body.innerHTML = "";
  });

  const items = () => [
    { id: "a", label: "Alpha" },
    { id: "b", label: "Bravo" },
    { id: "c", label: "Charlie" },
    { id: "d", label: "Delta" },
  ];

  /** A parent holding the v-model, as an app does; `events` records what the list emitted. */
  function mountList(props: Record<string, unknown> = {}) {
    const model = ref(items());
    const events: Array<{ item: { id: string }; from: number; to: number }> = [];
    const App = defineComponent({
      render: () =>
        h(CuiSortableList, {
          modelValue: model.value,
          "onUpdate:modelValue": (v: typeof model.value) => (model.value = v),
          onReorder: (e: (typeof events)[number]) => events.push(e),
          ...props,
        }),
    });
    const host = document.createElement("div");
    host.style.cssText = "width: 320px; padding: 8px";
    document.body.append(host);
    const wrapper = mount(App, { attachTo: host });
    mounted.push(wrapper);
    return { model, events, host };
  }

  const order = () => [...document.querySelectorAll<HTMLElement>(".cui-sortable-list__item")].map((li) => li.querySelector(".cui-sortable-list__content")!.textContent!.trim());
  const itemEl = (label: string) => [...document.querySelectorAll<HTMLElement>(".cui-sortable-list__item")].find((li) => li.textContent!.includes(label))!;
  const handle = (label: string) => itemEl(label).querySelector<HTMLElement>(".cui-sortable-list__handle")!;
  const status = () => document.querySelector('[role="status"]')!.textContent!.trim();
  const placeholder = () => document.querySelector<HTMLElement>(".cui-sortable-list__placeholder");

  function pointer(target: EventTarget, type: string, x: number, y: number) {
    target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, composed: true, pointerId: 7, isPrimary: true, pointerType: "mouse", clientX: x, clientY: y, button: 0 }));
  }
  const center = (el: Element) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };
  /** Press a handle and move the pointer by `dy`, one frame later so the document listener is in place. */
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
    it("floats the dragged item after the pointer over a placeholder that holds its slot", async () => {
      mountList();
      await frames(2);
      const slot = itemEl("Alpha").getBoundingClientRect();
      const from = await dragBy("Alpha", 20);
      const ghost = itemEl("Alpha");
      expect(ghost.classList.contains("cui-sortable-list__item--dragging")).toBe(true);
      expect(getComputedStyle(ghost).position).toBe("absolute");
      // It follows the pointer: its center moved by exactly what the pointer moved (the tilt and
      // scale turn about the center, so the box's edges would not say).
      expect(center(ghost).y).toBeCloseTo(slot.top + slot.height / 2 + 20, 0);
      // The placeholder stands in the list where the item was, the same height.
      const ph = placeholder()!;
      expect(ph).not.toBeNull();
      expect(ph.getBoundingClientRect().top).toBeCloseTo(slot.top, 0);
      expect(ph.getBoundingClientRect().height).toBeCloseTo(slot.height, 0);
      // The order is not committed until the drop.
      expect(order()).toEqual(["Alpha", "Bravo", "Charlie", "Delta"]);
      pointer(document, "pointerup", from.x, from.y + 20);
      await frames(20);
    });

    it("is lifted: a soft shadow, about 0.9 opacity and a tilt of about 2deg", async () => {
      mountList();
      await frames(2);
      await dragBy("Alpha", 20);
      await frames(20); // the lift eases in
      const style = getComputedStyle(itemEl("Alpha"));
      expect(Number(style.opacity)).toBeCloseTo(0.9, 2);
      expect(style.rotate).toBe("2deg");
      expect(style.boxShadow).not.toBe("none");
      pointer(document, "pointerup", 0, 0);
      await frames(20);
    });

    it("moves the placeholder under the dragged item and commits the order on drop", async () => {
      const { model, events } = mountList();
      await frames(2);
      const start = center(handle("Alpha"));
      const rowHeight = itemEl("Bravo").getBoundingClientRect().height;
      // Down past Bravo's center: one slot.
      const dy = rowHeight + 14;
      await dragBy("Alpha", dy);
      await frames(5);
      expect([...document.querySelectorAll(".cui-sortable-list__item, .cui-sortable-list__placeholder")].map((el) => el.textContent!.trim() || "·")).toEqual(["Bravo", "·", "Alpha", "Charlie", "Delta"]);
      expect(model.value.map((i) => i.label)).toEqual(["Alpha", "Bravo", "Charlie", "Delta"]);
      pointer(document, "pointerup", start.x, start.y + dy);
      await frames(30);
      expect(model.value.map((i) => i.label)).toEqual(["Bravo", "Alpha", "Charlie", "Delta"]);
      expect(order()).toEqual(["Bravo", "Alpha", "Charlie", "Delta"]);
      expect(placeholder()).toBeNull();
      expect(itemEl("Alpha").style.transform).toBe("");
      expect(events).toEqual([{ item: { id: "a", label: "Alpha" }, from: 0, to: 1 }]);
      expect(status()).toBe("Alpha dropped at position 2 of 4.");
    });

    it("takes several slots when the pointer moves far at once", async () => {
      const { model } = mountList();
      await frames(2);
      const start = center(handle("Alpha"));
      const dy = 3 * itemEl("Bravo").getBoundingClientRect().height + 30;
      await dragBy("Alpha", dy);
      await frames(5);
      pointer(document, "pointerup", start.x, start.y + dy);
      await frames(30);
      expect(model.value.map((i) => i.label)).toEqual(["Bravo", "Charlie", "Delta", "Alpha"]);
    });

    it("restores the order on Escape, and emits nothing", async () => {
      const { model, events } = mountList();
      await frames(2);
      const dy = 2 * itemEl("Bravo").getBoundingClientRect().height + 20;
      await dragBy("Alpha", dy);
      await frames(5);
      await userEvent.keyboard("{Escape}");
      // The ghost glides back to where it came from: the placeholder is already in its first slot.
      await frames(1);
      expect(placeholder()!.nextElementSibling).toBe(itemEl("Alpha"));
      expect(placeholder()!.previousElementSibling).toBeNull();
      await frames(30);
      expect(order()).toEqual(["Alpha", "Bravo", "Charlie", "Delta"]);
      expect(model.value.map((i) => i.label)).toEqual(["Alpha", "Bravo", "Charlie", "Delta"]);
      expect(events).toEqual([]);
      expect(placeholder()).toBeNull();
      expect(status()).toBe("Reorder cancelled. Alpha is back at position 1 of 4.");
    });

    it("restores the order when the browser cancels the pointer", async () => {
      const { model } = mountList();
      await frames(2);
      const dy = itemEl("Bravo").getBoundingClientRect().height + 14;
      const from = await dragBy("Alpha", dy);
      pointer(document, "pointercancel", from.x, from.y + dy);
      await frames(30);
      expect(model.value.map((i) => i.label)).toEqual(["Alpha", "Bravo", "Charlie", "Delta"]);
      expect(placeholder()).toBeNull();
    });

    it("treats a press and release on the handle, without moving, as no drag", async () => {
      const { events } = mountList();
      await frames(2);
      const from = center(handle("Alpha"));
      pointer(handle("Alpha"), "pointerdown", from.x, from.y);
      await frames(1);
      pointer(document, "pointerup", from.x, from.y);
      await frames(3);
      expect(placeholder()).toBeNull();
      expect(events).toEqual([]);
    });

    it("does not start a drag until the pointer has moved a few pixels", async () => {
      const { events } = mountList();
      await frames(2);
      const from = center(handle("Alpha"));
      pointer(handle("Alpha"), "pointerdown", from.x, from.y);
      await frames(1);
      pointer(document, "pointermove", from.x, from.y + 2);
      await frames(2);
      expect(placeholder()).toBeNull();
      expect(itemEl("Alpha").classList.contains("cui-sortable-list__item--dragging")).toBe(false);
      pointer(document, "pointerup", from.x, from.y + 2);
      await frames(2);
      expect(events).toEqual([]);
    });

    it("gives the handle to the pointer: no touch panning", async () => {
      mountList();
      await frames(2);
      expect(getComputedStyle(handle("Alpha")).touchAction).toBe("none");
    });

    it("drags along a horizontal list", async () => {
      const { model } = mountList({ orientation: "horizontal" });
      await frames(2);
      const from = center(handle("Alpha"));
      const dx = itemEl("Bravo").getBoundingClientRect().width + 20;
      pointer(handle("Alpha"), "pointerdown", from.x, from.y);
      await frames(1);
      pointer(document, "pointermove", from.x + 8, from.y);
      await frames(2);
      pointer(document, "pointermove", from.x + dx, from.y);
      await frames(5);
      pointer(document, "pointerup", from.x + dx, from.y);
      await frames(30);
      expect(model.value.map((i) => i.label).slice(0, 2)).toEqual(["Bravo", "Alpha"]);
    });
  });

  describe("keyboard", () => {
    it("grabs with Space, moves with the arrows, drops with Space, and announces each step", async () => {
      const { model, events } = mountList();
      await frames(2);
      handle("Alpha").focus();
      await userEvent.keyboard(" ");
      expect(handle("Alpha").getAttribute("aria-pressed")).toBe("true");
      expect(status()).toBe("Alpha grabbed, position 1 of 4.");
      await userEvent.keyboard("{ArrowDown}");
      await frames(3);
      expect(status()).toBe("Alpha moved to position 2 of 4.");
      expect(order()).toEqual(["Bravo", "Alpha", "Charlie", "Delta"]);
      // The handle keeps focus as its item moves in the DOM.
      expect(document.activeElement).toBe(handle("Alpha"));
      await userEvent.keyboard("{ArrowDown}");
      await frames(3);
      expect(model.value.map((i) => i.label)).toEqual(["Alpha", "Bravo", "Charlie", "Delta"]); // not committed yet
      await userEvent.keyboard(" ");
      await frames(3);
      expect(model.value.map((i) => i.label)).toEqual(["Bravo", "Charlie", "Alpha", "Delta"]);
      expect(events).toEqual([{ item: { id: "a", label: "Alpha" }, from: 0, to: 2 }]);
      expect(status()).toBe("Alpha dropped at position 3 of 4.");
      expect(handle("Alpha").getAttribute("aria-pressed")).toBe("false");
      expect(document.activeElement).toBe(handle("Alpha"));
    });

    it("cancels with Escape and puts the item back", async () => {
      const { model, events } = mountList();
      await frames(2);
      handle("Bravo").focus();
      await userEvent.keyboard("{Enter}{ArrowDown}{ArrowDown}");
      await frames(3);
      expect(order()).toEqual(["Alpha", "Charlie", "Delta", "Bravo"]);
      await userEvent.keyboard("{Escape}");
      await frames(3);
      expect(order()).toEqual(["Alpha", "Bravo", "Charlie", "Delta"]);
      expect(model.value.map((i) => i.label)).toEqual(["Alpha", "Bravo", "Charlie", "Delta"]);
      expect(events).toEqual([]);
      expect(status()).toBe("Reorder cancelled. Bravo is back at position 2 of 4.");
    });

    it("moves a grabbed item to the ends with Home and End", async () => {
      const { model } = mountList();
      await frames(2);
      handle("Bravo").focus();
      await userEvent.keyboard(" {End} ");
      await frames(3);
      expect(model.value.map((i) => i.label)).toEqual(["Alpha", "Charlie", "Delta", "Bravo"]);
    });

    it("uses the left and right arrows in a horizontal list", async () => {
      const { model } = mountList({ orientation: "horizontal" });
      await frames(2);
      handle("Alpha").focus();
      await userEvent.keyboard(" {ArrowRight} ");
      await frames(3);
      expect(model.value.map((i) => i.label).slice(0, 2)).toEqual(["Bravo", "Alpha"]);
    });

    it("moves focus between handles with the arrows when nothing is grabbed, one tab stop for the list", async () => {
      mountList();
      await frames(2);
      const stops = [...document.querySelectorAll<HTMLElement>(".cui-sortable-list__handle")].filter((h) => h.tabIndex === 0);
      expect(stops).toHaveLength(1);
      handle("Alpha").focus();
      await userEvent.keyboard("{ArrowDown}");
      expect(document.activeElement).toBe(handle("Bravo"));
      await userEvent.keyboard("{End}");
      expect(document.activeElement).toBe(handle("Delta"));
    });

    it("drops the grab, restoring the order, when focus leaves the handle", async () => {
      const { model } = mountList();
      await frames(2);
      handle("Alpha").focus();
      await userEvent.keyboard(" {ArrowDown}");
      await frames(3);
      handle("Alpha").blur();
      await frames(3);
      expect(order()).toEqual(["Alpha", "Bravo", "Charlie", "Delta"]);
      expect(model.value.map((i) => i.label)).toEqual(["Alpha", "Bravo", "Charlie", "Delta"]);
      expect(handle("Alpha").getAttribute("aria-pressed")).toBe("false");
    });
  });

  describe("move buttons", () => {
    const button = (label: string, name: string) => itemEl(label).querySelector<HTMLElement>(`button[aria-label="${name}"]`)!;

    it("move an item one place and announce it", async () => {
      const { model, events } = mountList();
      await frames(2);
      button("Bravo", "Move Bravo down").click();
      await frames(3);
      expect(model.value.map((i) => i.label)).toEqual(["Alpha", "Charlie", "Bravo", "Delta"]);
      expect(events).toEqual([{ item: { id: "b", label: "Bravo" }, from: 1, to: 2 }]);
      expect(status()).toBe("Bravo moved to position 3 of 4.");
      button("Bravo", "Move Bravo up").click();
      await frames(3);
      expect(model.value.map((i) => i.label)).toEqual(["Alpha", "Bravo", "Charlie", "Delta"]);
    });

    it("are unavailable at the ends, and out of the tab order", async () => {
      mountList();
      await frames(2);
      expect(button("Alpha", "Move Alpha up").getAttribute("aria-disabled")).toBe("true");
      expect(button("Delta", "Move Delta down").getAttribute("aria-disabled")).toBe("true");
      expect(button("Bravo", "Move Bravo up").tabIndex).toBe(-1);
    });

    it("can be left out", async () => {
      mountList({ moveButtons: false });
      await frames(2);
      expect(document.querySelector(".cui-sortable-list__actions")).toBeNull();
    });
  });

  describe("motion", () => {
    const setReduced = (reduce: boolean) =>
      cdp().send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: reduce ? "reduce" : "" }] });
    const transformAnimations = (label: string) =>
      itemEl(label).getAnimations().filter((a) => (a.effect as KeyframeEffect).getKeyframes().some((k) => "transform" in k));

    /** Drag Alpha down past Bravo's center, and look at Bravo as it makes room. */
    async function dragPastBravo() {
      mountList();
      await frames(2);
      const from = center(handle("Alpha"));
      pointer(handle("Alpha"), "pointerdown", from.x, from.y);
      await frames(1);
      pointer(document, "pointermove", from.x, from.y + 8);
      await frames(1);
      pointer(document, "pointermove", from.x, from.y + itemEl("Bravo").getBoundingClientRect().height + 14);
      await frames(1);
    }

    it("slides the items that make room by transform", async () => {
      await dragPastBravo();
      expect(transformAnimations("Bravo").length).toBeGreaterThan(0);
      pointer(document, "pointerup", 0, 0);
      await frames(30);
    });

    it("moves them with no animation, and lifts nothing, under reduced motion", async () => {
      await setReduced(true);
      try {
        await dragPastBravo();
        expect(transformAnimations("Bravo")).toHaveLength(0);
        const ghost = getComputedStyle(itemEl("Alpha"));
        expect(ghost.rotate).toBe("none");
        expect(ghost.scale).toBe("none");
        // Still a ghost, still following the pointer: that is direct manipulation.
        expect(ghost.position).toBe("absolute");
        expect(itemEl("Alpha").style.transform).toContain("translate3d");
        pointer(document, "pointerup", 0, 0);
        await frames(10);
        expect(order()).toEqual(["Bravo", "Alpha", "Charlie", "Delta"]);
      } finally {
        await setReduced(false);
      }
    });
  });
});

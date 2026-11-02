import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { h, nextTick } from "vue";
import CuiTransferList from "../CuiTransferList.vue";
import { describeRovingFocusContract, press as pressKey } from "../../composables/__tests__/roving-focus-contract";

/**
 * #170 — both lists were click-only divs, so a keyboard user could mark nothing, every
 * transfer button stayed disabled, and the six icon-only buttons were unnamed.
 */

const items = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Bravo" },
  { value: "c", label: "Charlie", disabled: true },
  { value: "d", label: "Delta" },
];

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  w = undefined;
});

function mountList(props: Record<string, unknown> = {}) {
  w = mount(CuiTransferList, {
    props: { items, modelValue: [], "onUpdate:modelValue": (v: unknown) => w!.setProps({ modelValue: v }), ...props },
    attachTo: document.body,
  });
  return w;
}

const listbox = (name: string) => {
  const box = w!.findAll('[role="listbox"]').find((b) => document.getElementById(b.attributes("aria-labelledby")!)?.textContent === name);
  return box!;
};
const options = (name: string) => listbox(name).findAll('[role="option"]');
const press = (el: Element, key: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));

describe("CuiTransferList keyboard and ARIA", () => {
  it("makes each list a named, multiselectable listbox of options with one tab stop", () => {
    mountList({ modelValue: ["d"] });
    const source = listbox("Available");
    expect(source.attributes("aria-multiselectable")).toBe("true");
    expect(options("Available").map((o) => o.text())).toEqual(["Alpha", "Bravo", "Charlie"]);
    expect(options("Available").map((o) => o.attributes("tabindex"))).toEqual(["0", "-1", "-1"]);
    expect(options("Available")[2].attributes("aria-disabled")).toBe("true");
    expect(options("Selected").map((o) => o.text())).toEqual(["Delta"]);
  });

  it("names the six transfer and reorder buttons", () => {
    mountList();
    const names = w!.findAll("button.cui-button").map((b) => b.attributes("aria-label"));
    expect(names).toEqual([
      "Move selected to Selected",
      "Move all to Selected",
      "Move selected to Available",
      "Move all to Available",
      "Move up",
      "Move down",
    ]);
  });

  it("marks with Space, which enables the transfer button, and moves the marked items", async () => {
    mountList();
    const [alpha, bravo] = options("Available").map((o) => o.element as HTMLElement);
    alpha.focus();
    press(alpha, " ");
    press(alpha, "ArrowDown");
    await nextTick();
    expect(document.activeElement).toBe(bravo);
    press(bravo, " ");
    await nextTick();
    expect(options("Available").map((o) => o.attributes("aria-selected"))).toEqual(["true", "true", "false", "false"]);
    const moveSelected = w!.find('button[aria-label="Move selected to Selected"]');
    expect(moveSelected.attributes("aria-disabled")).toBeUndefined();
    await moveSelected.trigger("click");
    expect(options("Selected").map((o) => o.text())).toEqual(["Alpha", "Bravo"]);
  });

  it("moves the focused item across with Enter and keeps focus in the list", async () => {
    mountList();
    const bravo = options("Available")[1].element as HTMLElement;
    bravo.focus();
    press(bravo, "Enter");
    await nextTick();
    await nextTick();
    expect(options("Selected").map((o) => o.text())).toEqual(["Bravo"]);
    // Charlie, now at Bravo's position, is disabled: the nearest enabled item takes focus.
    expect(document.activeElement?.textContent).toBe("Delta");
  });

  it("unmarks an item that Enter moves, so moving the marked ones can't move it twice", async () => {
    mountList();
    const bravo = options("Available")[1].element as HTMLElement;
    press(bravo, " ");
    press(bravo, "Enter");
    await nextTick();
    expect(w!.find('button[aria-label="Move selected to Selected"]').attributes("aria-disabled")).toBe("true");
    expect(w!.props("modelValue")).toEqual(["b"]);
  });

  it("ignores Space and Enter on a disabled item", async () => {
    mountList();
    const charlie = options("Available")[2].element as HTMLElement;
    press(charlie, " ");
    press(charlie, "Enter");
    await nextTick();
    expect(options("Available")[2].attributes("aria-selected")).toBe("false");
    expect(w!.emitted("update:modelValue")).toBeUndefined();
  });

  it("leaves keys in a control inside an #item slot to that control", async () => {
    w = mount(CuiTransferList, {
      props: { items, modelValue: [] },
      slots: { item: ({ item }: { item: { label: string } }) => h("input", { class: "note", value: item.label }) },
      attachTo: document.body,
    });
    const note = w.find(".note").element as HTMLInputElement;
    const space = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });
    note.dispatchEvent(space);
    note.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    await nextTick();
    expect(space.defaultPrevented).toBe(false);
    expect(w.emitted("update:modelValue")).toBeUndefined();
  });

  it("follows the last item of a list to where it went", async () => {
    mountList({ items: [{ value: "a", label: "Alpha" }] });
    const alpha = options("Available")[0].element as HTMLElement;
    alpha.focus();
    press(alpha, "Enter");
    await nextTick();
    await nextTick();
    expect(document.activeElement).toBe(options("Selected")[0].element);
  });

  it("treats a disabled item in the selected list as disabled for the mouse too", async () => {
    mountList({ modelValue: ["c"] });
    const charlie = options("Selected")[0];
    expect(charlie.attributes("aria-disabled")).toBe("true");
    await charlie.trigger("click");
    await charlie.trigger("dblclick");
    expect(charlie.attributes("aria-selected")).toBe("false");
    expect(w!.emitted("update:modelValue")).toBeUndefined();
  });

  it("leaves no tab stop on a list whose items are all disabled", async () => {
    mountList({ disabled: true });
    await nextTick(); // the stop settles after the first render
    expect(w!.findAll('[role="option"]').every((o) => o.attributes("tabindex") === "-1")).toBe(true);
  });

  it("moves only the marked items the filter shows", async () => {
    mountList();
    const opts = options("Available");
    press(opts[0].element, " "); // Alpha
    press(opts[3].element, " "); // Delta
    await nextTick();
    await w!.findAll("input")[0].setValue("del");
    await w!.find('button[aria-label="Move selected to Selected"]').trigger("click");
    expect(w!.props("modelValue")).toEqual(["d"]);
    await w!.findAll("input")[0].setValue("");
    expect(options("Available")[0].attributes("aria-selected")).toBe("true"); // Alpha still marked
  });

  it("focus() focuses the list's tab stop", () => {
    mountList();
    (w!.vm as unknown as { focus: () => void }).focus();
    expect(document.activeElement).toBe(options("Available")[0].element);
  });

  it("names the filter fields", () => {
    mountList();
    const inputs = w!.findAll("input");
    const names = inputs.map((i) => document.getElementById(i.attributes("aria-labelledby")!)?.textContent);
    expect(names).toEqual(["Filter Available", "Filter Selected"]);
  });
});

/**
 * #421 — the six move buttons were six tab stops between the lists. They are one vertical
 * CuiToolbar now: Tab goes source list, buttons, target list, and Up/Down move between them.
 */
describe("CuiTransferList move buttons as a toolbar", () => {
  const toolbar = () => w!.find('[role="toolbar"]');
  const moveButtons = () => [...toolbar().element.querySelectorAll<HTMLButtonElement>(".cui-button")];

  it("is a vertical toolbar named from the messages, holding all six buttons", async () => {
    mountList();
    await nextTick();
    expect(toolbar().attributes("aria-label")).toBe("Move items");
    expect(toolbar().attributes("aria-orientation")).toBe("vertical");
    expect(moveButtons()).toHaveLength(6);
  });

  it("keeps a button disabled by the marks focusable, so the toolbar keeps its one tab stop", async () => {
    // Nothing marked and nothing selected: four of the six have nothing to do.
    mountList();
    await nextTick();
    const btns = moveButtons();
    expect(btns.map((b) => b.disabled)).toEqual([false, false, false, false, false, false]);
    expect(btns.map((b) => b.getAttribute("aria-disabled"))).toEqual(["true", null, "true", "true", "true", "true"]);
    expect(btns.map((b) => b.getAttribute("tabindex"))).toEqual(["0", "-1", "-1", "-1", "-1", "-1"]);
  });

  it("moves between the buttons with Up and Down, through disabled ones", async () => {
    mountList();
    await nextTick();
    moveButtons()[0].focus();
    await pressKey("ArrowDown");
    expect(document.activeElement).toBe(moveButtons()[1]);
    await pressKey("ArrowDown");
    expect(document.activeElement).toBe(moveButtons()[2]); // aria-disabled, still reached
    await pressKey("End");
    expect(document.activeElement).toBe(moveButtons()[5]);
    expect(moveButtons()[5].getAttribute("tabindex")).toBe("0");
  });

  it("does nothing on a click on a button disabled by the marks", async () => {
    mountList();
    await nextTick();
    await w!.find('button[aria-label="Move selected to Selected"]').trigger("click");
    expect(w!.emitted("update:modelValue")).toBeUndefined();
  });

  const ariaDisabled = (name: string) => w!.find(`button[aria-label="${name}"]`).attributes("aria-disabled");

  it("disables Move all when only disabled items are left to move", async () => {
    mountList({ modelValue: ["a", "b", "d"] }); // Charlie, disabled, is all that's left
    await nextTick();
    expect(ariaDisabled("Move all to Selected")).toBe("true");
  });

  it("disables Move selected when the marked items are filtered out of sight", async () => {
    mountList();
    press(options("Available")[0].element, " "); // Alpha
    await nextTick();
    expect(ariaDisabled("Move selected to Selected")).toBeUndefined();
    await w!.findAll("input")[0].setValue("del");
    expect(ariaDisabled("Move selected to Selected")).toBe("true");
  });

  it("disables Move up on the first item and Move down on the last", async () => {
    mountList({ modelValue: ["a", "b"] });
    press(options("Selected")[0].element, " ");
    await nextTick();
    expect([ariaDisabled("Move up"), ariaDisabled("Move down")]).toEqual(["true", undefined]);
    press(options("Selected")[0].element, " ");
    press(options("Selected")[1].element, " ");
    await nextTick();
    expect([ariaDisabled("Move up"), ariaDisabled("Move down")]).toEqual([undefined, "true"]);
    await w!.find('button[aria-label="Move up"]').trigger("click");
    expect(w!.props("modelValue")).toEqual(["b", "a"]);
  });

  it("disables every button outright on a disabled transfer list", async () => {
    mountList({ disabled: true });
    await nextTick();
    expect(moveButtons().every((b) => b.disabled)).toBe(true);
  });
});

describeRovingFocusContract("CuiTransferList move buttons", {
  mount: () =>
    mount(CuiTransferList, {
      props: { items: items.filter((i) => !i.disabled), modelValue: ["d"], filterable: false },
      attachTo: document.body,
    }),
  items: () => [...document.querySelectorAll<HTMLElement>('[role="toolbar"] .cui-button')],
  orientation: "vertical",
});

describeRovingFocusContract("CuiTransferList source list", {
  mount: () =>
    mount(CuiTransferList, {
      props: { items: items.filter((i) => !i.disabled), modelValue: [], filterable: false },
      attachTo: document.body,
    }),
  items: () => [...document.querySelectorAll<HTMLElement>('[role="listbox"]')[0].querySelectorAll<HTMLElement>('[role="option"]')],
  orientation: "vertical",
});

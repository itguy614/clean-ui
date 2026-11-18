import { describe, it, expect, afterEach, vi } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import CuiCombobox from "../CuiCombobox.vue";
import type { ComboboxOption, ComboboxOptionAction } from "../CuiCombobox.vue";
import { __clearWarned } from "../../utils/devWarn";

const OPTIONS: ComboboxOption[] = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
];

const attached: VueWrapper[] = [];
function mountAttached(props: Record<string, unknown>) {
  const w = mount(CuiCombobox, { props, attachTo: document.body });
  attached.push(w as unknown as VueWrapper);
  return w;
}

afterEach(() => {
  for (const w of attached.splice(0)) w.unmount();
  document.body.innerHTML = "";
});

async function openWith(props: Record<string, unknown>) {
  const w = mountAttached({ id: "cb", ...props });
  const input = w.find("input");
  await input.trigger("focus");
  await nextTick();
  return { w, input };
}

const optionTexts = () => [...document.querySelectorAll('[role="option"]')].map((o) => o.textContent?.trim());

describe("CuiCombobox groups (#445)", () => {
  const GROUPED: ComboboxOption[] = [
    { value: "apple", label: "Apple", group: "Favorites" },
    { value: "banana", label: "Banana", group: "Favorites" },
    { value: "cherry", label: "Cherry", group: "Fruit" },
    { value: "date", label: "Date", group: "Fruit" },
    { value: "plain", label: "Plain" },
  ];
  const groups = () => [...document.querySelectorAll<HTMLElement>('[role="group"]')];
  const headingOf = (g: HTMLElement) => document.getElementById(g.getAttribute("aria-labelledby")!)?.textContent;

  it("renders each run under a role=group named by its heading, ungrouped options outside any", async () => {
    await openWith({ options: GROUPED });
    expect(
      groups().map((g) => [headingOf(g), [...g.querySelectorAll('[role="option"]')].map((o) => o.textContent?.trim())]),
    ).toEqual([
      ["Favorites", ["Apple", "Banana"]],
      ["Fruit", ["Cherry", "Date"]],
    ]);
    const plain = [...document.querySelectorAll('[role="option"]')].find((o) => o.textContent?.includes("Plain"))!;
    expect(plain.closest('[role="group"]')).toBeNull();
    expect(document.querySelectorAll('[role="option"]')).toHaveLength(5);
  });

  it("headings are not options, and arrow keys and aria-activedescendant skip them", async () => {
    const { input } = await openWith({ options: GROUPED });
    const seen: (string | undefined)[] = [];
    for (let i = 0; i < 5; i++) {
      await input.trigger("keydown", { key: "ArrowDown" });
      const el = document.getElementById(input.attributes("aria-activedescendant")!)!;
      expect(el.getAttribute("role")).toBe("option");
      seen.push(el.textContent?.trim());
    }
    expect(seen).toEqual(["Apple", "Banana", "Cherry", "Date", "Plain"]);
  });

  it("numbers options across the whole list, not per group", async () => {
    await openWith({ options: GROUPED });
    const opts = [...document.querySelectorAll('[role="option"]')];
    expect(opts.map((o) => [o.getAttribute("aria-posinset"), o.getAttribute("aria-setsize")])).toEqual([
      ["1", "5"],
      ["2", "5"],
      ["3", "5"],
      ["4", "5"],
      ["5", "5"],
    ]);
  });

  it("sets no setsize and no group when nothing is grouped", async () => {
    await openWith({ options: OPTIONS });
    expect(document.querySelector('[role="option"]')!.hasAttribute("aria-setsize")).toBe(false);
    expect(document.querySelector('[role="group"]')).toBeNull();
  });

  it("drops a group that filtering empties", async () => {
    const { input } = await openWith({ options: GROUPED });
    await input.setValue("cher");
    expect(groups().map(headingOf)).toEqual(["Fruit"]);
    expect(optionTexts()).toEqual(["Cherry"]);
    expect(document.querySelector('[role="group"]')!.getAttribute("aria-labelledby")).toBeTruthy();
  });

  it("selects by the flat index across groups", async () => {
    const { w, input } = await openWith({ options: GROUPED });
    for (let i = 0; i < 3; i++) await input.trigger("keydown", { key: "ArrowDown" });
    await input.trigger("keydown", { key: "Enter" });
    expect(w.emitted("update:modelValue")![0]).toEqual(["cherry"]);
  });

  it("merges only consecutive options: a repeated label is a second group with its own heading id", async () => {
    await openWith({
      options: [
        { value: "a", label: "A", group: "X" },
        { value: "b", label: "B", group: "Y" },
        { value: "c", label: "C", group: "X" },
      ],
    });
    expect(groups().map(headingOf)).toEqual(["X", "Y", "X"]);
    expect(new Set(groups().map((g) => g.getAttribute("aria-labelledby"))).size).toBe(3);
  });
});

describe("CuiCombobox optionActions (#445)", () => {
  const triggered: string[] = [];
  const actions: ComboboxOptionAction[] = [
    { key: "d", modifiers: ["ctrl"], label: "Delete option", onTrigger: (o) => triggered.push(`del:${o.value}`) },
    { key: "f", modifiers: ["alt", "shift"], label: "Favorite option", onTrigger: (o) => triggered.push(`fav:${o.value}`) },
  ];
  async function open(extra: Record<string, unknown> = {}) {
    triggered.length = 0;
    return openWith({ options: OPTIONS, optionActions: actions, ...extra });
  }
  const active = () => document.getElementById(document.querySelector("input")!.getAttribute("aria-activedescendant")!)!;

  it("runs the matching action with the highlighted option and prevents the default", async () => {
    const { input } = await open();
    await input.trigger("keydown", { key: "ArrowDown" });
    await input.trigger("keydown", { key: "ArrowDown" });
    const e = new KeyboardEvent("keydown", { key: "d", ctrlKey: true, cancelable: true, bubbles: true });
    input.element.dispatchEvent(e);
    expect(triggered).toEqual(["del:banana"]);
    expect(e.defaultPrevented).toBe(true);
  });

  it("matches by physical key when the modifier changes the character", async () => {
    const { input } = await open();
    await input.trigger("keydown", { key: "ArrowDown" });
    await input.trigger("keydown", { key: "ƒ", code: "KeyF", altKey: true, shiftKey: true });
    expect(triggered).toEqual(["fav:apple"]);
  });

  it("needs exactly the declared modifiers", async () => {
    const { input } = await open();
    await input.trigger("keydown", { key: "ArrowDown" });
    await input.trigger("keydown", { key: "d", ctrlKey: true, shiftKey: true });
    await input.trigger("keydown", { key: "d" });
    await input.trigger("keydown", { key: "f", altKey: true });
    expect(triggered).toEqual([]);
  });

  it("does nothing with no highlighted option or a closed list", async () => {
    const { input } = await open();
    await input.trigger("keydown", { key: "d", ctrlKey: true });
    expect(triggered).toEqual([]);
    await input.trigger("keydown", { key: "ArrowDown" });
    await input.trigger("keydown", { key: "Escape" });
    await input.trigger("keydown", { key: "d", ctrlKey: true });
    expect(triggered).toEqual([]);
  });

  it("leaves Enter and the arrows working", async () => {
    const { w, input } = await open();
    await input.trigger("keydown", { key: "ArrowDown" });
    await input.trigger("keydown", { key: "ArrowDown" });
    expect(active().textContent).toContain("Banana");
    await input.trigger("keydown", { key: "Enter" });
    expect(w.emitted("update:modelValue")![0]).toEqual(["banana"]);
    expect(triggered).toEqual([]);
  });

  it("lets an option-keydown handler veto the action", async () => {
    const { input } = await open({ "onOption-keydown": (e: KeyboardEvent) => e.preventDefault() });
    await input.trigger("keydown", { key: "ArrowDown" });
    await input.trigger("keydown", { key: "d", ctrlKey: true });
    expect(triggered).toEqual([]);
  });

  it("describes the highlighted option, and only it, with the action labels", async () => {
    const { input } = await open();
    expect(document.querySelector('[role="option"][aria-describedby]')).toBeNull();
    await input.trigger("keydown", { key: "ArrowDown" });
    const ids = active().getAttribute("aria-describedby")!.split(" ");
    expect(ids.map((id) => document.getElementById(id)?.textContent)).toEqual(["Delete option", "Favorite option"]);
    expect(document.getElementById(ids[0])!.classList.contains("cui-sr-only")).toBe(true);
    expect(document.getElementById(ids[0])!.closest('[role="listbox"]')).toBeNull();
    expect(active().getAttribute("aria-keyshortcuts")).toBe("Control+D Alt+Shift+F");
    await input.trigger("keydown", { key: "ArrowDown" });
    expect(document.querySelectorAll('[role="option"][aria-describedby]')).toHaveLength(1);
  });

  it("sets no description without actions", async () => {
    const { input } = await openWith({ options: OPTIONS });
    await input.trigger("keydown", { key: "ArrowDown" });
    expect(document.querySelector('[role="option"][aria-describedby]')).toBeNull();
  });

  it("never runs an action with no modifiers, and warns in development", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    __clearWarned();
    const bare = [
      {
        key: "x",
        modifiers: [] as unknown as ComboboxOptionAction["modifiers"],
        label: "Bare",
        onTrigger: (o: ComboboxOption) => triggered.push(`bare:${o.value}`),
      },
    ];
    const { input } = await open({ optionActions: bare, options: [{ value: "a", label: "A", group: "G" }] });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain("no modifiers");
    await input.trigger("keydown", { key: "ArrowDown" });
    await input.trigger("keydown", { key: "x" });
    expect(triggered).toEqual([]);
    warn.mockRestore();
    __clearWarned();
  });

  it("does not warn for valid actions", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    __clearWarned();
    await open();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

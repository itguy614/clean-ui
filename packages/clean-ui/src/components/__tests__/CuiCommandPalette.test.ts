import { describe, it, expect, afterEach, vi } from "vitest";
import { effectScope, nextTick } from "vue";
import { mount, flushPromises, enableAutoUnmount } from "@vue/test-utils";
import CuiCommandPalette from "../CuiCommandPalette.vue";
import { useCommandPalette, type CuiCommand } from "../../composables/useCommandPalette";

// The palette wraps CuiModal, which teleports into <body> and flips its entry on a
// requestAnimationFrame: query through `document` after `settle()`.

// A failing test must not leave its palette (and its document listener) up for the next.
enableAutoUnmount(afterEach);

const palette = useCommandPalette();
const scopes: Array<{ stop: () => void }> = [];

/** Registers commands in a scope the test stops, as a route's setup would. */
function registerScoped(commands: CuiCommand[]) {
  const scope = effectScope();
  scopes.push(scope);
  scope.run(() => palette.register(commands));
  return scope;
}

const settle = async () => {
  await flushPromises();
  await new Promise((r) => requestAnimationFrame(() => r(null)));
  await flushPromises();
};

const input = () => document.querySelector<HTMLInputElement>(".cui-command-palette__input")!;
const options = () => [...document.querySelectorAll<HTMLElement>('[role="option"]')];
const labels = () => options().map((o) => o.querySelector(".cui-command-palette__label")?.textContent?.trim());
const headings = () => [...document.querySelectorAll(".cui-command-palette__heading")].map((h) => h.textContent?.trim());
const key = (init: KeyboardEventInit, target: EventTarget = input()) => {
  const e = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(e);
  return e;
};
async function type(text: string) {
  input().value = text;
  input().dispatchEvent(new Event("input", { bubbles: true }));
  await nextTick();
}

const COMMANDS: CuiCommand[] = [
  { id: "new", label: "New file", group: "actions", shortcut: "⌘N" },
  { id: "save", label: "Save file", group: "actions" },
  { id: "settings", label: "Open settings", group: "go", keywords: ["preferences"] },
  { id: "home", label: "Go home", group: "go", priority: 5 },
];
const GROUPS = [
  { id: "go", label: "Navigation", priority: 1 },
  { id: "actions", label: "Actions" },
];

async function open(props: Record<string, unknown> = {}) {
  const wrapper = mount(CuiCommandPalette, { props: { groups: GROUPS, hotkey: false, ...props } });
  palette.open();
  await settle();
  return wrapper;
}

afterEach(() => {
  scopes.splice(0).forEach((s) => s.stop());
  palette.close();
  palette.clearRecents();
  localStorage.clear();
  document.body.innerHTML = "";
  vi.useRealTimers();
});

describe("CuiCommandPalette", () => {
  it("renders nothing while closed and opens from the registry, with the combobox wired up", async () => {
    registerScoped(COMMANDS);
    const wrapper = mount(CuiCommandPalette, { props: { hotkey: false } });
    await settle();
    expect(document.querySelector(".cui-command-palette")).toBeNull();
    palette.open();
    await settle();
    expect(input().getAttribute("role")).toBe("combobox");
    expect(input().getAttribute("aria-expanded")).toBe("true");
    expect(input().getAttribute("aria-controls")).toBe(document.querySelector('[role="listbox"]')!.id);
    expect(document.querySelector('[role="dialog"]')!.getAttribute("aria-label")).toBe("Command palette");
    wrapper.unmount();
  });

  it("follows v-model:visible", async () => {
    registerScoped(COMMANDS);
    const wrapper = mount(CuiCommandPalette, { props: { visible: false, hotkey: false } });
    await settle();
    await wrapper.setProps({ visible: true });
    await settle();
    expect(input()).not.toBeNull();
    expect(palette.visible.value).toBe(true);
    await wrapper.setProps({ visible: false });
    await settle();
    expect(document.querySelector(".cui-command-palette")).toBeNull();
    wrapper.unmount();
  });

  it("emits update:visible when the registry opens it", async () => {
    const wrapper = mount(CuiCommandPalette, { props: { hotkey: false } });
    palette.open();
    await settle();
    expect(wrapper.emitted("update:visible")?.at(-1)).toEqual([true]);
    wrapper.unmount();
  });

  it("focuses the search field on open", async () => {
    registerScoped(COMMANDS);
    const wrapper = await open();
    expect(document.activeElement).toBe(input());
    wrapper.unmount();
  });

  it("groups by heading in group-priority order, and commands by priority within a group", async () => {
    registerScoped(COMMANDS);
    const wrapper = await open();
    expect(headings()).toEqual(["Navigation", "Actions"]);
    expect(labels()).toEqual(["Go home", "Open settings", "New file", "Save file"]);
    expect(document.querySelectorAll('[role="group"]')).toHaveLength(2);
    wrapper.unmount();
  });

  it("filters fuzzily, highlights the matched letters, and finds a command by keyword", async () => {
    registerScoped(COMMANDS);
    const wrapper = await open();
    await type("sfi");
    expect(labels()).toEqual(["Save file"]);
    expect([...document.querySelectorAll(".cui-command-palette__match")].map((m) => m.textContent)).toEqual(["S", "fi"]);
    await type("prefer");
    expect(labels()).toEqual(["Open settings"]);
    expect(document.querySelector(".cui-command-palette__match")).toBeNull();
    wrapper.unmount();
  });

  it("matches a keyword on its own, not letters scattered over all of them", async () => {
    registerScoped([{ id: "k", label: "Zebra", keywords: ["tag", "grid", "dark", "mode"] }]);
    const wrapper = await open();
    await type("mode");
    expect(labels()).toEqual(["Zebra"]);
    await type("tgdm");
    expect(labels()).toEqual([]);
    wrapper.unmount();
  });

  it("shows the empty message, and the empty slot in its place", async () => {
    registerScoped(COMMANDS);
    const wrapper = await open();
    await type("zzzz");
    expect(options()).toHaveLength(0);
    expect(document.querySelector(".cui-command-palette__empty")!.textContent).toContain("No matching commands");
    wrapper.unmount();

    const custom = mount(CuiCommandPalette, {
      props: { hotkey: false },
      slots: { empty: `<template #empty="{ query }">Nothing for {{ query }}</template>` },
    });
    palette.open();
    await settle();
    await type("qq");
    expect(document.querySelector(".cui-command-palette__empty")!.textContent).toContain("Nothing for qq");
    custom.unmount();
  });

  it("announces the result count in a live region as the list narrows, after a pause", async () => {
    registerScoped(COMMANDS);
    const wrapper = await open();
    vi.useFakeTimers();
    await type("file");
    const live = () => document.querySelector('[role="status"]')!.textContent;
    expect(live()).toBe("");
    vi.advanceTimersByTime(700);
    await nextTick();
    expect(live()).toMatch(/2/);
    wrapper.unmount();
  });

  it("moves the highlight with the arrow keys through aria-activedescendant, skipping disabled commands", async () => {
    registerScoped([
      { id: "a", label: "Alpha" },
      { id: "b", label: "Beta", disabled: true },
      { id: "c", label: "Gamma" },
    ]);
    const wrapper = await open();
    const active = () => input().getAttribute("aria-activedescendant");
    expect(active()).toBe(options()[0].id);
    key({ key: "ArrowDown" });
    await nextTick();
    expect(active()).toBe(options()[2].id);
    key({ key: "ArrowUp" });
    await nextTick();
    expect(active()).toBe(options()[0].id);
    expect(options()[1].getAttribute("aria-disabled")).toBe("true");
    wrapper.unmount();
  });

  it("runs the highlighted command on Enter, after the palette has closed", async () => {
    const calls: string[] = [];
    registerScoped([{ id: "go", label: "Go", action: () => calls.push(`ran with palette ${palette.visible.value ? "open" : "closed"}`) }]);
    const wrapper = await open();
    key({ key: "Enter" });
    await settle();
    expect(wrapper.emitted("select")?.[0][0]).toMatchObject({ id: "go" });
    expect(calls).toEqual(["ran with palette closed"]);
    expect(wrapper.emitted("close")).toBeTruthy();
    wrapper.unmount();
  });

  it("runs a command on click, but not a disabled one", async () => {
    const run = vi.fn();
    registerScoped([
      { id: "off", label: "Off", disabled: true, action: run },
      { id: "on", label: "On", action: run },
    ]);
    const wrapper = await open();
    options()[0].click();
    await settle();
    expect(run).not.toHaveBeenCalled();
    options()[1].click();
    await settle();
    expect(run).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it("starts the highlight on the first result again after typing, but keeps it when only the list changes", async () => {
    registerScoped([
      { id: "a1", label: "Alpha one" },
      { id: "a2", label: "Alpha two" },
      { id: "a3", label: "Alpha three" },
    ]);
    const wrapper = await open();
    key({ key: "ArrowDown" });
    key({ key: "ArrowDown" });
    await nextTick();
    expect(input().getAttribute("aria-activedescendant")).toBe(options()[2].id);
    // The same three rows in the same order, so only a reset can put it back on the first.
    await type("alph");
    expect(labels()).toEqual(["Alpha one", "Alpha two", "Alpha three"]);
    expect(input().getAttribute("aria-activedescendant")).toBe(options()[0].id);

    // A command arriving from elsewhere does not move the highlight off the row it is on.
    key({ key: "ArrowDown" });
    await nextTick();
    registerScoped([{ id: "z", label: "Alpha zero", priority: 0 }]);
    await nextTick();
    expect(document.getElementById(input().getAttribute("aria-activedescendant")!)!.textContent).toContain("Alpha two");
    wrapper.unmount();
  });

  it("closes on Escape through the layer stack", async () => {
    registerScoped(COMMANDS);
    const wrapper = await open();
    key({ key: "Escape" }, document.body);
    await settle();
    expect(document.querySelector(".cui-command-palette")).toBeNull();
    expect(palette.visible.value).toBe(false);
    wrapper.unmount();
  });

  it("lists recently run commands first while nothing is typed, instead of in their groups", async () => {
    registerScoped(COMMANDS);
    const wrapper = await open();
    await type("save");
    key({ key: "Enter" });
    await settle();
    palette.open();
    await settle();
    expect(headings()).toEqual(["Recent", "Navigation", "Actions"]);
    expect(labels()).toEqual(["Save file", "Go home", "Open settings", "New file"]);
    await type("save");
    expect(headings()).toEqual(["Actions"]);
    wrapper.unmount();
  });

  it("keeps recents under recentsStorageKey, and reads them back", async () => {
    registerScoped(COMMANDS);
    let wrapper = await open({ recentsStorageKey: "cmd-test" });
    await type("home");
    key({ key: "Enter" });
    await settle();
    expect(JSON.parse(localStorage.getItem("cmd-test")!)).toEqual(["home"]);
    wrapper.unmount();

    palette.clearRecents();
    localStorage.setItem("cmd-test", JSON.stringify(["settings"]));
    wrapper = await open({ recentsStorageKey: "cmd-test" });
    expect(headings()[0]).toBe("Recent");
    expect(labels()[0]).toBe("Open settings");
    wrapper.unmount();
  });

  it("limits the listed results to maxResults across groups", async () => {
    registerScoped(COMMANDS);
    const wrapper = await open({ maxResults: 3 });
    expect(options()).toHaveLength(3);
    wrapper.unmount();
  });

  it("lists commands passed as a prop alongside the registered ones, the prop winning on an id", async () => {
    registerScoped([{ id: "x", label: "From registry" }]);
    const wrapper = await open({ commands: [{ id: "x", label: "From prop" }, { id: "y", label: "Extra" }] });
    expect(labels()).toEqual(["From prop", "Extra"]);
    wrapper.unmount();
  });

  it("renders the item slot, with the segments", async () => {
    registerScoped([{ id: "x", label: "Open" }]);
    const wrapper = mount(CuiCommandPalette, {
      props: { hotkey: false },
      slots: { item: `<template #item="{ command, segments }"><b class="mine">{{ command.id }}:{{ segments.length }}</b></template>` },
    });
    palette.open();
    await settle();
    await type("op");
    expect(document.querySelector(".mine")!.textContent).toBe("x:2");
    wrapper.unmount();
  });

  it("renders the heading slot", async () => {
    registerScoped(COMMANDS);
    const wrapper = mount(CuiCommandPalette, {
      props: { hotkey: false, groups: GROUPS },
      slots: { heading: `<template #heading="{ group, count }"><i class="mine">{{ group.label }} ({{ count }})</i></template>` },
    });
    palette.open();
    await settle();
    expect([...document.querySelectorAll(".mine")].map((m) => m.textContent)).toEqual(["Navigation (2)", "Actions (2)"]);
    wrapper.unmount();
  });

  it("lets the listbox use the group as its accessible name", async () => {
    registerScoped(COMMANDS);
    const wrapper = await open();
    const group = document.querySelector('[role="group"]')!;
    expect(document.getElementById(group.getAttribute("aria-labelledby")!)!.textContent!.trim()).toBe("Navigation");
    wrapper.unmount();
  });
});

describe("CuiCommandPalette hotkey", () => {
  async function mounted(props: Record<string, unknown> = {}) {
    registerScoped(COMMANDS);
    const wrapper = mount(CuiCommandPalette, { props: { hotkey: "ctrl+k", ...props } });
    await settle();
    return wrapper;
  }

  it("opens on the shortcut, and the same shortcut closes it", async () => {
    const wrapper = await mounted();
    const e = key({ key: "k", ctrlKey: true }, document.body);
    await settle();
    expect(e.defaultPrevented).toBe(true);
    expect(input()).not.toBeNull();
    key({ key: "k", ctrlKey: true });
    await settle();
    expect(document.querySelector(".cui-command-palette")).toBeNull();
    wrapper.unmount();
  });

  it("works from inside a text field, and remembers it for the return", async () => {
    const wrapper = await mounted();
    const field = document.createElement("input");
    document.body.append(field);
    field.focus();
    key({ key: "k", ctrlKey: true }, field);
    await settle();
    expect(input()).not.toBeNull();
    key({ key: "Escape" }, input());
    await settle();
    expect(document.activeElement).toBe(field);
    wrapper.unmount();
  });

  it("opens over another open modal", async () => {
    const { default: CuiModal } = await import("../CuiModal.vue");
    const modal = mount(CuiModal, { props: { visible: true, title: "Under" } });
    await settle();
    const wrapper = await mounted();
    key({ key: "k", ctrlKey: true }, document.body);
    await settle();
    expect(input()).not.toBeNull();
    // Escape closes the palette first, the modal after.
    key({ key: "Escape" }, input());
    await settle();
    expect(document.querySelector(".cui-command-palette")).toBeNull();
    expect(document.body.textContent).toContain("Under");
    modal.unmount();
    wrapper.unmount();
  });

  it("is ignored when another handler already took the key, when held, and with other modifiers", async () => {
    const wrapper = await mounted();
    const taken = new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true, cancelable: true });
    document.body.addEventListener("keydown", (e) => e.preventDefault(), { once: true });
    document.body.dispatchEvent(taken);
    key({ key: "k", ctrlKey: true, repeat: true }, document.body);
    key({ key: "k", ctrlKey: true, shiftKey: true }, document.body);
    key({ key: "k" }, document.body);
    await settle();
    expect(document.querySelector(".cui-command-palette")).toBeNull();
    wrapper.unmount();
  });

  it("can be rebound, and turned off", async () => {
    const wrapper = await mounted({ hotkey: "alt+p" });
    key({ key: "k", ctrlKey: true }, document.body);
    await settle();
    expect(document.querySelector(".cui-command-palette")).toBeNull();
    key({ key: "p", altKey: true }, document.body);
    await settle();
    expect(input()).not.toBeNull();
    await wrapper.setProps({ hotkey: false });
    palette.close();
    await settle();
    key({ key: "p", altKey: true }, document.body);
    await settle();
    expect(document.querySelector(".cui-command-palette")).toBeNull();
    wrapper.unmount();
  });

  it("leaves no listener behind once unmounted", async () => {
    const wrapper = await mounted();
    wrapper.unmount();
    key({ key: "k", ctrlKey: true }, document.body);
    await settle();
    expect(palette.visible.value).toBe(false);
  });

  it("is still reachable without the hotkey: the exposed open() and v-model", async () => {
    registerScoped(COMMANDS);
    const wrapper = mount(CuiCommandPalette, { props: { hotkey: false } });
    (wrapper.vm as unknown as { open: () => void }).open();
    await settle();
    expect(input()).not.toBeNull();
    wrapper.unmount();
  });
});

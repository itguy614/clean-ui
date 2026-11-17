import { describe, it, expect, afterEach, vi } from "vitest";
import { effectScope, nextTick, ref } from "vue";
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
    const live = () => document.querySelector<HTMLElement>('.cui-sr-only[role="status"]')!.textContent;
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

  it("starts on the first row when reopened after a filtered visit, not where the old match sat", async () => {
    registerScoped([
      { id: "a", label: "Alpha" },
      { id: "b", label: "Beta" },
      { id: "c", label: "Gamma" },
    ]);
    const wrapper = await open();
    await type("gamma");
    key({ key: "Escape" }, document.body);
    await settle();
    palette.open();
    await settle();
    expect(input().value).toBe("");
    expect(input().getAttribute("aria-activedescendant")).toBe(options()[0].id);
    wrapper.unmount();
  });

  it("runs a chosen command even if the palette unmounts before its exit reports", async () => {
    const run = vi.fn();
    registerScoped([{ id: "a", label: "Alpha", action: run }]);
    const wrapper = await open();
    key({ key: "Enter" });
    wrapper.unmount();
    expect(run).toHaveBeenCalledTimes(1);
    expect(palette.visible.value).toBe(false);
  });

  it("moves the highlight to the row under a moving pointer, not to one that merely scrolled under it", async () => {
    registerScoped([
      { id: "a", label: "Alpha" },
      { id: "b", label: "Beta" },
    ]);
    const wrapper = await open();
    options()[1].dispatchEvent(new MouseEvent("mouseenter"));
    await nextTick();
    expect(input().getAttribute("aria-activedescendant")).toBe(options()[0].id);
    options()[1].dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
    await nextTick();
    expect(input().getAttribute("aria-activedescendant")).toBe(options()[1].id);
    wrapper.unmount();
  });

  it("does not claim an expanded popup when nothing matches", async () => {
    registerScoped(COMMANDS);
    const wrapper = await open();
    await type("zzzz");
    expect(input().getAttribute("aria-expanded")).toBe("false");
    expect(input().getAttribute("aria-controls")).toBeNull();
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

describe("CuiCommandPalette fetchCommands (async search)", () => {
  interface Pending {
    query: string;
    signal: AbortSignal;
    resolve: (found: CuiCommand[]) => void;
    reject: (err: unknown) => void;
  }
  /** A fetchCommands whose every call waits to be answered by the test. */
  function remote() {
    const calls: Pending[] = [];
    const fetchCommands = vi.fn(
      (query: string, { signal }: { signal: AbortSignal }) =>
        new Promise<CuiCommand[]>((resolve, reject) => calls.push({ query, signal, resolve, reject })),
    );
    return { calls, fetchCommands };
  }
  const wait = (ms = 20) => new Promise((r) => setTimeout(r, ms));
  const found = (...labels: string[]): CuiCommand[] => labels.map((label) => ({ id: `r:${label}`, label }));
  const status = () => document.querySelector(".cui-command-palette__empty")?.textContent?.trim();
  const list = () => document.querySelector('[role="listbox"]')!;

  async function openWith(props: Record<string, unknown> = {}) {
    registerScoped([{ id: "local", label: "Open settings" }, { id: "other", label: "Close window" }]);
    const r = remote();
    const wrapper = await open({ fetchCommands: r.fetchCommands, debounce: 0, ...props });
    return { ...r, wrapper };
  }

  it("lists the local matches first, then the server's under Results, as returned and not highlighted", async () => {
    const { calls, wrapper } = await openWith();
    await type("set");
    await wait();
    expect(labels()).toEqual(["Open settings"]);
    expect(document.querySelectorAll(".cui-command-palette__match").length).toBeGreaterThan(0);
    calls[0].resolve(found("Zebra settings", "Apple settings"));
    await settle();
    expect(labels()).toEqual(["Open settings", "Zebra settings", "Apple settings"]);
    expect(headings().at(-1)).toBe("Results");
    expect(options()[1].querySelector(".cui-command-palette__match")).toBeNull();
    wrapper.unmount();
  });

  it("lists a command the local list already shows once, the local one winning", async () => {
    const { calls, wrapper } = await openWith();
    await type("set");
    await wait();
    calls[0].resolve([{ id: "local", label: "Remote copy" }, ...found("Other")]);
    await settle();
    expect(labels()).toEqual(["Open settings", "Other"]);
    wrapper.unmount();
  });

  it("lets only the latest search land, and aborts the one before it", async () => {
    const { calls, wrapper } = await openWith();
    await type("a");
    await wait();
    await type("ab");
    await wait();
    expect(calls.map((c) => c.query)).toEqual(["a", "ab"]);
    expect(calls[0].signal.aborted).toBe(true);
    expect(calls[1].signal.aborted).toBe(false);
    calls[1].resolve(found("For ab"));
    await settle();
    calls[0].resolve(found("For a, too late"));
    await settle();
    expect(labels()).toEqual(["For ab"]);
    wrapper.unmount();
  });

  it("does not search below minChars, and drops what it had", async () => {
    const { calls, fetchCommands, wrapper } = await openWith({ minChars: 3 });
    await type("ab");
    await wait();
    expect(fetchCommands).not.toHaveBeenCalled();
    // Not a search the server was asked: no "Searching…" waiting for an answer that never comes.
    expect(status()).toBe("No matching commands");
    await type("abc");
    await wait();
    calls[0].resolve(found("Hit"));
    await settle();
    expect(labels()).toContain("Hit");
    await type("ab");
    await settle();
    expect(labels()).not.toContain("Hit");
    wrapper.unmount();
  });

  it("marks the list busy and shows the spinner while a search is out, and says Searching with nothing else to show", async () => {
    registerScoped([]);
    const r = remote();
    const wrapper = await open({ fetchCommands: r.fetchCommands, debounce: 0 });
    await type("zzz");
    await wait();
    expect(list().getAttribute("aria-busy")).toBe("true");
    expect(document.querySelector(".cui-command-palette__busy .cui-spinner, .cui-command-palette__busy [role]")).not.toBeNull();
    expect(status()).toBe("Searching…");
    r.calls[0].resolve([]);
    await settle();
    expect(list().getAttribute("aria-busy")).toBeNull();
    expect(status()).toBe("No matching commands");
    wrapper.unmount();
  });

  it("claims no results only once the search for the current query has come back", async () => {
    const { calls, wrapper } = await openWith();
    await type("qqq");
    await wait();
    expect(status()).toBe("Searching…");
    expect(status()).not.toContain("No matching");
    calls[0].resolve([]);
    await settle();
    expect(status()).toContain("No matching");
    wrapper.unmount();
  });

  it("shows a failed search as a message, without leaving the palette stuck loading", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { calls, wrapper } = await openWith();
    await type("set");
    await wait();
    calls[0].reject(new Error("boom"));
    await settle();
    expect(status()).toBe("Couldn't load results");
    expect(list().getAttribute("aria-busy")).toBeNull();
    expect(labels()).toEqual(["Open settings"]);
    // An abort is not a failure.
    await type("sett");
    await wait();
    await type("setti");
    await wait();
    calls[1].reject(new DOMException("aborted", "AbortError"));
    await settle();
    expect(status()).not.toBe("Couldn't load results");
    spy.mockRestore();
    wrapper.unmount();
  });

  it("announces the combined count once the search has landed, not while it is out", async () => {
    const { calls, wrapper } = await openWith();
    vi.useFakeTimers();
    await type("set");
    await vi.advanceTimersByTimeAsync(10);
    const live = () => document.querySelector<HTMLElement>('.cui-sr-only[role="status"]')!.textContent;
    await vi.advanceTimersByTimeAsync(800);
    expect(live(), "silent while the search is out").toBe("");
    calls[0].resolve(found("A", "B"));
    await vi.advanceTimersByTimeAsync(10);
    expect(live()).toBe("");
    await vi.advanceTimersByTimeAsync(800);
    expect(live()).toMatch(/3/);
    wrapper.unmount();
  });

  it("keeps the highlight on its command when results arrive, and Enter while loading runs the local one", async () => {
    const run = vi.fn();
    registerScoped([
      { id: "a", label: "Alpha one" },
      { id: "b", label: "Alpha two", action: run },
    ]);
    const r = remote();
    const wrapper = await open({ fetchCommands: r.fetchCommands, debounce: 0 });
    await type("alph");
    await wait();
    key({ key: "ArrowDown" });
    await nextTick();
    const active = () => document.getElementById(input().getAttribute("aria-activedescendant")!)!.textContent;
    expect(active()).toContain("Alpha two");
    r.calls[0].resolve(found("Alphabet soup"));
    await settle();
    expect(active()).toContain("Alpha two");
    // And a second query, still loading: Enter runs the highlighted local command.
    await type("alpha t");
    await wait();
    key({ key: "Enter" });
    await settle();
    expect(run).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it("runs a chosen server command like any other: select, then its action after the close, and a recent", async () => {
    const run = vi.fn();
    const { calls, wrapper } = await openWith();
    await type("set");
    await wait();
    calls[0].resolve([{ id: "r1", label: "Remote thing", action: run }, { id: "r2", label: "No action" }]);
    await settle();
    options()[1].click();
    await settle();
    expect(wrapper.emitted("select")?.[0][0]).toMatchObject({ id: "r1" });
    expect(run).toHaveBeenCalledTimes(1);
    expect(palette.recents.value[0]).toBe("r1");
    palette.open();
    await settle();
    await type("set");
    await wait();
    calls[1].resolve([{ id: "r2", label: "No action" }]);
    await settle();
    options().at(-1)!.click();
    await settle();
    expect(wrapper.emitted("select")?.at(-1)?.[0]).toMatchObject({ id: "r2" });
    wrapper.unmount();
  });

  it("cancels a search in flight when the palette closes or unmounts", async () => {
    const { calls, wrapper } = await openWith();
    await type("set");
    await wait();
    key({ key: "Escape" }, document.body);
    await settle();
    expect(calls[0].signal.aborted).toBe(true);
    palette.open();
    await settle();
    await type("set");
    await wait();
    wrapper.unmount();
    expect(calls[1].signal.aborted).toBe(true);
  });
});

describe("CuiCommandPalette badge", () => {
  const badges = () => options().map((o) => o.querySelector(".cui-command-palette__badge .cui-badge")?.textContent?.trim() ?? null);
  /** A fetchCommands the test answers by hand. */
  function manual() {
    const box: { resolve: (c: CuiCommand[]) => void } = { resolve: () => {} };
    const fetchCommands = () => new Promise<CuiCommand[]>((r) => (box.resolve = r));
    return { box, fetchCommands };
  }

  it("shows a count or label as a suffix, and nothing for 0, an empty label or none", async () => {
    registerScoped([
      { id: "n", label: "Notifications", badge: 3 },
      { id: "t", label: "Tags", badge: "new" },
      { id: "z", label: "Zero", badge: 0 },
      { id: "e", label: "Empty", badge: "" },
      { id: "o", label: "Obj", badge: { label: 7, color: "error" } },
      { id: "oz", label: "ObjZero", badge: { label: 0 } },
      { id: "none", label: "None" },
    ]);
    const wrapper = await open();
    expect(badges()).toEqual(["3", "new", null, null, "7", null, null]);
    wrapper.unmount();
  });

  it("uses the library's subtle badge by default, and takes a color role", async () => {
    registerScoped([
      { id: "a", label: "Plain", badge: 1 },
      { id: "b", label: "Red", badge: { label: 2, color: "error" } },
    ]);
    const wrapper = await open();
    const [plain, red] = [...document.querySelectorAll<HTMLElement>(".cui-command-palette__badge")];
    expect(plain.querySelector(".cui-badge")).not.toBeNull();
    expect(plain.style.getPropertyValue("--cui-badge-bg")).toContain("primary-100");
    expect(red.style.getPropertyValue("--cui-badge-bg")).toContain("error-100");
    wrapper.unmount();
  });

  it("is part of the row's accessible name, so it does not rely on position", async () => {
    registerScoped([{ id: "n", label: "Notifications", badge: 3, shortcut: "G N" }]);
    const wrapper = await open();
    const named = options()[0].cloneNode(true) as HTMLElement;
    named.querySelectorAll("[aria-hidden='true']").forEach((el) => el.remove());
    expect(named.textContent!.replace(/\s+/g, " ").trim()).toBe("Notifications, 3");
    // The shortcut chips stay out of it (aria-hidden), and the highlight is still the option's id.
    expect(options()[0].querySelector(".cui-command-palette__shortcut")!.getAttribute("aria-hidden")).toBe("true");
    expect(input().getAttribute("aria-activedescendant")).toBe(options()[0].id);
    wrapper.unmount();
  });

  it("follows a registered getter while the palette is open", async () => {
    const count = ref(2);
    const scope = effectScope();
    scopes.push(scope);
    scope.run(() => palette.register(() => ({ id: "n", label: "Notifications", badge: count.value })));
    const wrapper = await open();
    expect(badges()).toEqual(["2"]);
    count.value = 9;
    await nextTick();
    expect(badges()).toEqual(["9"]);
    count.value = 0;
    await nextTick();
    expect(badges()).toEqual([null]);
    wrapper.unmount();
  });

  it("shows on results from fetchCommands, and reaches the item slot", async () => {
    registerScoped([]);
    const { box, fetchCommands } = manual();
    const wrapper = mount(CuiCommandPalette, {
      props: { hotkey: false, debounce: 0, fetchCommands },
      slots: { item: `<template #item="{ command, badge }"><i class="mine">{{ command.label }}:{{ badge ? badge.label : "-" }}</i></template>` },
    });
    palette.open();
    await settle();
    await type("a");
    await new Promise((r) => setTimeout(r, 20));
    box.resolve([{ id: "r", label: "Inbox", badge: 12 }, { id: "q", label: "Quiet" }]);
    await settle();
    expect([...document.querySelectorAll(".mine")].map((m) => m.textContent)).toEqual(["Inbox:12", "Quiet:-"]);
    wrapper.unmount();
  });

  it("renders a badge on async rows by default too", async () => {
    registerScoped([]);
    const { box, fetchCommands } = manual();
    const wrapper = mount(CuiCommandPalette, { props: { hotkey: false, debounce: 0, fetchCommands } });
    palette.open();
    await settle();
    await type("a");
    await new Promise((r) => setTimeout(r, 20));
    box.resolve([{ id: "r", label: "Inbox", badge: 12 }]);
    await settle();
    expect(badges()).toEqual(["12"]);
    wrapper.unmount();
  });
});

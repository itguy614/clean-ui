import { describe, it, expect, vi, afterEach, beforeAll } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick, type Component } from "vue";
import CuiCombobox from "../CuiCombobox.vue";
import CuiTagInput from "../CuiTagInput.vue";
import CuiSelect from "../CuiSelect.vue";
import CuiDropdown from "../CuiDropdown.vue";
import CuiDropdownTrigger from "../CuiDropdownTrigger.vue";
import CuiDropdownMenu from "../CuiDropdownMenu.vue";
import CuiDropdownItem from "../CuiDropdownItem.vue";
import CuiContextMenu from "../CuiContextMenu.vue";
import CuiTooltip from "../CuiTooltip.vue";
import CuiPopover from "../CuiPopover.vue";
import CuiModal from "../CuiModal.vue";

/**
 * #202 — CuiCombobox and CuiTagInput registered their window scroll/resize listeners as
 * inline arrow functions, so onUnmounted had nothing to remove them with. Every mount
 * permanently added two listeners (one capture-phase scroll) and retained the
 * component's setup scope.
 *
 * A balance check rather than a count, so it fits every floating component: whatever a
 * component adds to window or document on mount, it must remove — same type, same
 * listener, same capture flag — on unmount.
 */
const captureOf = (options: unknown) =>
  typeof options === "boolean" ? options : Boolean((options as AddEventListenerOptions | undefined)?.capture);

function recordListeners() {
  const spies = [window, document].map((target) => ({
    add: vi.spyOn(target, "addEventListener"),
    remove: vi.spyOn(target, "removeEventListener"),
  }));
  const added = () => spies.flatMap(({ add }) => add.mock.calls);
  const unremoved = () =>
    spies.flatMap(({ add, remove }) =>
      add.mock.calls
        .filter(([type, listener, opts]) => !remove.mock.calls.some(
          ([rType, rListener, rOpts]) => rType === type && rListener === listener && captureOf(rOpts) === captureOf(opts),
        ))
        .map(([type, , opts]) => `${type}${captureOf(opts) ? " (capture)" : ""}`),
    );
  return { added, unremoved };
}

const options = [{ value: "a", label: "A" }];

const Dropdown = defineComponent(() => () =>
  h(CuiDropdown, null, () => [
    h(CuiDropdownTrigger, null, () => h("button", "Open")),
    h(CuiDropdownMenu, null, () => h(CuiDropdownItem, null, () => "Item")),
  ]),
);

type Open = (w: VueWrapper) => Promise<unknown> | unknown;
const focusInput: Open = (w) => w.find("input").trigger("focus");
const click = (selector: string): Open => (w) => w.find(selector).trigger("click");

// Opened first: these attach their global listeners only while open (#203), so unmounting
// open is the case that can leak.
const openable: Array<[string, Component, Record<string, unknown>, Open]> = [
  ["CuiCombobox", CuiCombobox, { options }, focusInput],
  ["CuiTagInput", CuiTagInput, { modelValue: [], suggestions: ["a"] }, focusInput],
  ["CuiSelect", CuiSelect, { options }, click(".cui-select__trigger")],
  ["CuiDropdown", Dropdown, {}, click("button")],
  ["CuiContextMenu", CuiContextMenu, {}, (w) => w.trigger("contextmenu", { clientX: 10, clientY: 10 })],
];

const cases: Array<[string, Component, Record<string, unknown>, Open?]> = [
  ...openable.map(([name, c, p, open]) => [`${name} (open)`, c, p, open] as [string, Component, Record<string, unknown>, Open]),
  // Mounted open: the shared layer stack's Escape listener exists only while a layer is
  // open (#254, #278).
  ["CuiTooltip (visible)", CuiTooltip, { text: "Hint", visible: true }],
  ["CuiPopover (visible)", CuiPopover, { visible: true }],
  ["CuiModal (visible)", CuiModal, { visible: true, title: "Dialog" }],
];

describe("floating components remove every window/document listener they add", () => {
  // The first mount in a run installs a one-time document-level mouseover/mouseout
  // pair from outside these components — whichever case runs first would carry it.
  // Mount each once beforehand, so only per-mount listeners are measured.
  beforeAll(() => {
    for (const [, component, props] of cases) mount(component, { props }).unmount();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it.each(cases)("%s", async (_name, component, props, open) => {
    const { added, unremoved } = recordListeners();
    const wrapper = mount(component, { props, attachTo: document.body });
    await nextTick(); // a modal opens in onMounted and joins the layer stack a tick later
    await open?.(wrapper);
    await nextTick();
    expect(added().length).toBeGreaterThan(0);

    wrapper.unmount();
    expect(unremoved()).toEqual([]);
  });
});

// #203: each held a document mousedown listener (and a window scroll listener, most a
// resize one too) from mount, open or not — twenty closed selects meant sixty.
describe("closed floating components hold no click-outside or reposition listeners", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it.each(openable)("%s", async (_name, component, props) => {
    const { added } = recordListeners();
    mount(component, { props, attachTo: document.body }).unmount();
    const global = added().map(([type]) => type).filter((t) => ["mousedown", "scroll", "resize"].includes(t));
    expect(global).toEqual([]);
  });
});

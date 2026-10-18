import { describe, it, expect, vi, afterEach, beforeAll } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h, type Component } from "vue";
import CuiCombobox from "../CuiCombobox.vue";
import CuiTagInput from "../CuiTagInput.vue";
import CuiSelect from "../CuiSelect.vue";
import CuiDropdown from "../CuiDropdown.vue";
import CuiDropdownTrigger from "../CuiDropdownTrigger.vue";
import CuiDropdownMenu from "../CuiDropdownMenu.vue";
import CuiDropdownItem from "../CuiDropdownItem.vue";
import CuiContextMenu from "../CuiContextMenu.vue";

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

const cases: Array<[string, Component, Record<string, unknown>]> = [
  ["CuiCombobox", CuiCombobox, { options }],
  ["CuiTagInput", CuiTagInput, { modelValue: [] }],
  ["CuiSelect", CuiSelect, { options }],
  ["CuiDropdown", Dropdown, {}],
  ["CuiContextMenu", CuiContextMenu, {}],
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

  it.each(cases)("%s", (_name, component, props) => {
    const { added, unremoved } = recordListeners();
    const wrapper = mount(component, { props, attachTo: document.body });
    expect(added().length).toBeGreaterThan(0);

    wrapper.unmount();
    expect(unremoved()).toEqual([]);
  });
});

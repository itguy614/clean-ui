import { describe, it, expect, afterEach, vi } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick, ref } from "vue";
import CuiToolbar from "../CuiToolbar.vue";
import CuiToolbarSeparator from "../CuiToolbarSeparator.vue";
import CuiButton from "../CuiButton.vue";
import CuiButtonGroup from "../CuiButtonGroup.vue";
import CuiSelect from "../CuiSelect.vue";
import { __clearWarned } from "../../utils/devWarn";
import { describeRovingFocusContract, press } from "../../composables/__tests__/roving-focus-contract";

/**
 * #190 — a toolbar is one tab stop with arrow keys between its controls, where a button
 * group is a tab stop per button. Its controls are slot content it never renders, so it
 * writes the roving tab stop onto them itself.
 */

const LABELS = ["Bold", "Italic", "Underline", "Strikethrough"];

function buttons(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(".cui-toolbar .cui-button")];
}

/** A toolbar of the four LABELS buttons, attached to the document. */
function mountButtons(props: Record<string, unknown> = {}) {
  return mount(CuiToolbar, {
    props: { label: "Formatting", ...props },
    slots: { default: () => LABELS.map((l) => h(CuiButton, { key: l }, () => l)) },
    attachTo: document.body,
  });
}

describeRovingFocusContract("CuiToolbar", {
  mount: () => mountButtons(),
  items: buttons,
  orientation: "horizontal",
});

describeRovingFocusContract("CuiToolbar (vertical, loop)", {
  mount: () => mountButtons({ orientation: "vertical", loop: true }),
  items: buttons,
  orientation: "vertical",
  wrap: true,
});

describe("CuiToolbar", () => {
  let wrapper: VueWrapper | undefined;
  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    vi.restoreAllMocks();
  });

  it("is a named toolbar with its orientation", () => {
    wrapper = mount(CuiToolbar, { props: { label: "Formatting", orientation: "vertical" } });
    const el = wrapper.element;
    expect(el.getAttribute("role")).toBe("toolbar");
    expect(el.getAttribute("aria-orientation")).toBe("vertical");
    expect(el.getAttribute("aria-label")).toBe("Formatting");
    expect(el.classList).toContain("cui-toolbar");
  });

  it("takes its name from aria-label, or from aria-labelledby over a label", () => {
    wrapper = mount(CuiToolbar, { attrs: { "aria-label": "Text tools" } });
    expect(wrapper.element.getAttribute("aria-label")).toBe("Text tools");
    wrapper.unmount();

    wrapper = mount(CuiToolbar, { props: { label: "Formatting", ariaLabelledby: "heading" } });
    expect(wrapper.element.getAttribute("aria-labelledby")).toBe("heading");
    expect(wrapper.element.hasAttribute("aria-label")).toBe(false);
  });

  it("warns when it has no accessible name, and not when it has one", () => {
    __clearWarned();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    wrapper = mount(CuiToolbar, { props: { label: "Formatting" } });
    expect(warn).not.toHaveBeenCalled();
    wrapper.unmount();

    wrapper = mount(CuiToolbar);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("CuiToolbar: a toolbar needs an accessible name"));
  });

  it("skips a disabled control, and never gives it the tab stop", async () => {
    wrapper = mount(CuiToolbar, {
      props: { label: "Formatting" },
      slots: {
        default: () => [
          h(CuiButton, { disabled: true }, () => "Bold"),
          h(CuiButton, null, () => "Italic"),
          h(CuiButton, { disabled: true }, () => "Underline"),
          h(CuiButton, null, () => "Strikethrough"),
        ],
      },
      attachTo: document.body,
    });
    await nextTick();
    const items = buttons();
    // The first enabled control holds the stop when the first is disabled.
    expect(items.map((b) => b.tabIndex)).toEqual([-1, 0, -1, -1]);
    items[1].focus();
    await press("ArrowRight");
    expect(document.activeElement).toBe(items[3]);
    await press("ArrowLeft");
    expect(document.activeElement).toBe(items[1]);
  });

  it("moves the stop off a control that becomes disabled", async () => {
    const disabled = ref(false);
    wrapper = mount(CuiToolbar, {
      props: { label: "Formatting" },
      slots: {
        default: () => [h(CuiButton, { disabled: disabled.value }, () => "Bold"), h(CuiButton, null, () => "Italic")],
      },
      attachTo: document.body,
    });
    await nextTick();
    expect(buttons().map((b) => b.tabIndex)).toEqual([0, -1]);
    disabled.value = true;
    await nextTick();
    expect(buttons().map((b) => b.tabIndex)).toEqual([-1, 0]);
  });

  it("gives a control added later the roving tabindex, not a tab stop of its own", async () => {
    const count = ref(2);
    wrapper = mount(CuiToolbar, {
      props: { label: "Formatting" },
      slots: { default: () => LABELS.slice(0, count.value).map((l) => h(CuiButton, { key: l }, () => l)) },
      attachTo: document.body,
    });
    await nextTick();
    count.value = 4;
    await nextTick();
    expect(buttons().map((b) => b.tabIndex)).toEqual([0, -1, -1, -1]);
    // In the markup too, where a button's default tabIndex of 0 would otherwise leave it out.
    expect(buttons().map((b) => b.getAttribute("tabindex"))).toEqual(["0", "-1", "-1", "-1"]);
  });

  it("finds a control a child renders on its own, after the toolbar has rendered", async () => {
    // Rendered by a child's own update, which doesn't re-render the toolbar: only the
    // MutationObserver sees it.
    const shown = ref(false);
    const Late = defineComponent(() => () => (shown.value ? h(CuiButton, null, () => "Late") : null));
    wrapper = mount(CuiToolbar, {
      props: { label: "Formatting" },
      slots: { default: () => [h(CuiButton, null, () => "Bold"), h(Late)] },
      attachTo: document.body,
    });
    await nextTick();
    shown.value = true;
    await nextTick();
    await new Promise((r) => setTimeout(r, 0));
    expect(buttons().map((b) => b.tabIndex)).toEqual([0, -1]);
  });

  it("treats the buttons of a CuiButtonGroup as its own controls", async () => {
    wrapper = mount(CuiToolbar, {
      props: { label: "Formatting" },
      slots: {
        default: () => [
          h(CuiButtonGroup, { label: "Style" }, () => [h(CuiButton, null, () => "Bold"), h(CuiButton, null, () => "Italic")]),
          h(CuiToolbarSeparator),
          h(CuiButton, null, () => "Link"),
        ],
      },
      attachTo: document.body,
    });
    await nextTick();
    const items = buttons();
    expect(items.map((b) => b.tabIndex)).toEqual([0, -1, -1]);
    items[0].focus();
    await press("End");
    // The separator is passed over: it is not a control.
    expect(document.activeElement).toBe(items[2]);
  });

  it("leaves a text input its own tab stop and its own arrow keys", async () => {
    wrapper = mount(CuiToolbar, {
      props: { label: "Formatting" },
      slots: { default: () => [h(CuiButton, null, () => "Bold"), h("input", { type: "text", class: "search" }), h(CuiButton, null, () => "Italic")] },
      attachTo: document.body,
    });
    await nextTick();
    const input = wrapper.get<HTMLInputElement>(".search").element;
    expect(input.tabIndex).toBe(0);
    input.focus();
    for (const key of ["ArrowLeft", "ArrowRight", "Home", "End"]) {
      const e = await press(key);
      // Not swallowed, so the caret moves; not handled, so focus stays.
      expect(e.defaultPrevented).toBe(false);
      expect(document.activeElement).toBe(input);
    }
  });

  it("leaves an open CuiSelect its arrow keys, and moves past a closed one", async () => {
    wrapper = mount(CuiToolbar, {
      props: { label: "Formatting" },
      slots: {
        default: () => [
          h(CuiButton, null, () => "Bold"),
          h(CuiSelect, { ariaLabelledby: "font-label", options: ["Sans", "Serif", "Mono"], modelValue: "Sans" }),
          h(CuiButton, null, () => "Italic"),
        ],
      },
      attachTo: document.body,
    });
    await nextTick();
    const trigger = wrapper.get<HTMLElement>(".cui-select__trigger").element;
    // The select's trigger is one of the toolbar's controls.
    expect(trigger.tabIndex).toBe(-1);
    buttons()[0].focus();
    await press("ArrowRight");
    expect(document.activeElement).toBe(trigger);

    // Closed: Left and Right move along the toolbar.
    await press("ArrowRight");
    expect(document.activeElement).toBe(buttons()[1]);
    await press("ArrowLeft");
    expect(document.activeElement).toBe(trigger);

    // Open: they are the select's, and focus stays on its trigger.
    await press("ArrowDown");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    await press("ArrowRight");
    expect(document.activeElement).toBe(trigger);
    await press("ArrowLeft");
    expect(document.activeElement).toBe(trigger);
  });

  it("leaves a key a control has already handled", async () => {
    wrapper = mount(CuiToolbar, {
      props: { label: "Formatting" },
      slots: {
        default: () => [
          h(CuiButton, { onKeydown: (e: KeyboardEvent) => e.preventDefault() }, () => "Bold"),
          h(CuiButton, null, () => "Italic"),
        ],
      },
      attachTo: document.body,
    });
    await nextTick();
    buttons()[0].focus();
    await press("ArrowRight");
    expect(document.activeElement).toBe(buttons()[0]);
  });

  it("takes a custom item selector", async () => {
    wrapper = mount(CuiToolbar, {
      props: { label: "Formatting", itemSelector: ".tool" },
      slots: { default: () => [h("button", { class: "tool" }, "A"), h("button", { class: "tool" }, "B")] },
      attachTo: document.body,
    });
    await nextTick();
    const tools = [...wrapper.element.querySelectorAll<HTMLElement>(".tool")];
    expect(tools.map((b) => b.tabIndex)).toEqual([0, -1]);
  });

  it("wraps in a CuiScrollArea, not a focusable region, when overflow is scroll", () => {
    wrapper = mount(CuiToolbar, {
      props: { label: "Formatting", overflow: "scroll" },
      slots: { default: () => [h(CuiButton, null, () => "Bold")] },
    });
    const area = wrapper.find(".cui-toolbar__scroll");
    expect(area.classes()).toContain("cui-scroll-area");
    expect(area.find(".cui-scroll-area__scroller").attributes("role")).toBeUndefined();
    expect(area.find(".cui-button").exists()).toBe(true);
  });

  it("focus() moves to the control holding the tab stop", async () => {
    wrapper = mountButtons();
    await nextTick();
    buttons()[2].focus();
    (document.activeElement as HTMLElement).blur();
    (wrapper.vm as unknown as { focus: () => void }).focus();
    expect(document.activeElement).toBe(buttons()[2]);
  });
});

describe("CuiToolbarSeparator", () => {
  it("stands across the toolbar's axis", () => {
    for (const [orientation, axis] of [
      ["horizontal", "vertical"],
      ["vertical", "horizontal"],
    ] as const) {
      const wrapper = mount(CuiToolbar, { props: { label: "Tools", orientation }, slots: { default: () => h(CuiToolbarSeparator) } });
      const sep = wrapper.get(".cui-toolbar-separator");
      expect(sep.attributes("role")).toBe("separator");
      expect(sep.attributes("aria-orientation")).toBe(axis);
      wrapper.unmount();
    }
  });

  it("fails clearly outside a CuiToolbar", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => mount(CuiToolbarSeparator)).toThrow(/must be used inside a <CuiToolbar>/);
    vi.restoreAllMocks();
  });
});

import { describe, it, expect, vi, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import CuiColorPicker from "../CuiColorPicker.vue";
import { pointer, recordDocumentListeners } from "../../__tests__/pointer";

/**
 * #246 — each drag surface adds pointermove/pointerup to `document` on pointerdown and
 * removed them only in its own pointerup. Unmounting mid-drag (a picker inside a
 * popover closed with Escape) left both attached to a dead instance; a pointercancel
 * (a touch turning into a scroll) ended the pointer with no pointerup at all. Which pointer
 * a drag follows and what ends it are `usePointerDrag`'s tests (#275); these are the picker's
 * own: every surface uses it, and unmounting or disabling ends the drag.
 */
const surfaces = ["gradient", "hue", "alpha"] as const;

function mountPicker() {
  return mount(CuiColorPicker, { props: { modelValue: "#336699", showAlpha: true }, attachTo: document.body });
}

describe("CuiColorPicker drag listeners", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it.each(surfaces)("unmounting mid-drag on the %s removes the document listeners", async (surface) => {
    const wrapper = mountPicker();
    const unremoved = recordDocumentListeners();
    await wrapper.get(`.cui-color-picker__${surface}`).trigger("pointerdown", { clientX: 5, clientY: 5 });
    expect(unremoved()).toEqual(expect.arrayContaining(["pointermove", "pointerup"]));

    wrapper.unmount();
    expect(unremoved()).toEqual([]);
  });

  // Every surface goes through the shared drag, so each ends on a cancel and follows only
  // its own pointer; what the drag itself does is usePointerDrag's tests.
  it.each(surfaces)("a pointercancel ends a drag on the %s, and other pointers are ignored", async (surface) => {
    const wrapper = mountPicker();
    const unremoved = recordDocumentListeners();
    await wrapper.get(`.cui-color-picker__${surface}`).trigger("pointerdown", { clientX: 5, clientY: 5, pointerId: 1 });
    const before = wrapper.emitted("update:modelValue")?.length ?? 0;
    document.dispatchEvent(pointer("pointermove", 2, { clientX: 50, clientY: 50 }));
    document.dispatchEvent(pointer("pointercancel", 2));
    expect(wrapper.emitted("update:modelValue")?.length ?? 0).toBe(before);

    document.dispatchEvent(pointer("pointercancel", 1));
    await nextTick();
    expect(unremoved()).toEqual([]);
    document.dispatchEvent(pointer("pointermove", 1, { clientX: 50, clientY: 50 }));
    expect(wrapper.emitted("update:modelValue")?.length ?? 0).toBe(before);
    wrapper.unmount();
  });

  it("a right-click starts no drag and changes nothing", async () => {
    const wrapper = mountPicker();
    const unremoved = recordDocumentListeners();
    await wrapper.get(".cui-color-picker__hue").trigger("pointerdown", { clientX: 5, clientY: 5, button: 2 });
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    expect(unremoved()).toEqual([]);
    wrapper.unmount();
  });

  it("disabling mid-drag ends the drag", async () => {
    const wrapper = mountPicker();
    const unremoved = recordDocumentListeners();
    await wrapper.get(".cui-color-picker__gradient").trigger("pointerdown", { clientX: 5, clientY: 5 });
    await wrapper.setProps({ disabled: true });
    expect(unremoved()).toEqual([]);
    wrapper.unmount();
  });
});


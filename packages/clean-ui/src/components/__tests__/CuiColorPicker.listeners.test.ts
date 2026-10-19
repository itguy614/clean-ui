import { describe, it, expect, vi, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import CuiColorPicker from "../CuiColorPicker.vue";

/**
 * #246 — each drag surface adds pointermove/pointerup to `document` on pointerdown and
 * removed them only in its own pointerup. Unmounting mid-drag (a picker inside a
 * popover closed with Escape) left both attached to a dead instance; a pointercancel
 * (a touch turning into a scroll) ended the pointer with no pointerup at all.
 */
const surfaces = ["gradient", "hue", "alpha"] as const;

function recordDocumentListeners() {
  const add = vi.spyOn(document, "addEventListener");
  const remove = vi.spyOn(document, "removeEventListener");
  // A listener is gone if it was removed explicitly, or added with an AbortSignal that
  // has since aborted. Pointer listeners only: the drags are what this guards, and the
  // first mount of a run also installs an unrelated one-time mouseover/mouseout pair.
  const aborted = (options: unknown) => (options as AddEventListenerOptions | undefined)?.signal?.aborted === true;
  return () =>
    add.mock.calls
      .filter(([type]) => String(type).startsWith("pointer"))
      .filter(([type, listener, options]) => !aborted(options) && !remove.mock.calls.some(([t, l]) => t === type && l === listener))
      .map(([type]) => type);
}

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

  it.each(surfaces)("a pointercancel ends a drag on the %s", async (surface) => {
    const wrapper = mountPicker();
    const unremoved = recordDocumentListeners();
    await wrapper.get(`.cui-color-picker__${surface}`).trigger("pointerdown", { clientX: 5, clientY: 5 });

    document.dispatchEvent(new Event("pointercancel"));
    expect(unremoved()).toEqual([]);

    // And the drag is over: a later move no longer changes the colour.
    const before = wrapper.emitted("update:modelValue")?.length ?? 0;
    document.dispatchEvent(new MouseEvent("pointermove", { clientX: 50, clientY: 50 }));
    expect(wrapper.emitted("update:modelValue")?.length ?? 0).toBe(before);
    wrapper.unmount();
  });
});

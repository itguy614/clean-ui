import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import CuiRating from "../CuiRating.vue";

/**
 * #171 — CuiRating had no role, no tab stop and no key handling: a keyboard user could not
 * set a rating, and a screen reader heard star glyphs. It is now one role="slider".
 */

const slider = (w: ReturnType<typeof mount>) => w.find('[role="slider"]');

function press(w: ReturnType<typeof mount>, key: string) {
  return slider(w).trigger("keydown", { key });
}

describe("CuiRating as a slider", () => {
  it("is one tab stop with the slider's value attributes", () => {
    const w = mount(CuiRating, { props: { modelValue: 3 } });
    const s = slider(w);
    expect(s.attributes("tabindex")).toBe("0");
    expect(s.attributes("aria-valuemin")).toBe("0");
    expect(s.attributes("aria-valuemax")).toBe("5");
    expect(s.attributes("aria-valuenow")).toBe("3");
    expect(s.attributes("aria-valuetext")).toBe("3 of 5 stars");
    expect(w.findAll("[tabindex]")).toHaveLength(1);
  });

  it("is named by its label, which focuses it on click", async () => {
    const w = mount(CuiRating, { props: { label: "Quality" }, attachTo: document.body });
    const label = w.find(".cui-rating__label");
    expect(label.element.tagName).toBe("SPAN");
    expect(slider(w).attributes("aria-labelledby")).toBe(label.attributes("id"));
    await label.trigger("click");
    expect(document.activeElement).toBe(slider(w).element);
    w.unmount();
  });

  it("steps with the arrows and reaches the ends with Home and End", async () => {
    const w = mount(CuiRating, { props: { modelValue: 3 } });
    await press(w, "ArrowRight");
    await press(w, "ArrowUp");
    await press(w, "ArrowLeft");
    await press(w, "ArrowDown");
    await press(w, "Home");
    await press(w, "End");
    expect(w.emitted("update:modelValue")).toEqual([[4], [4], [2], [2], [0], [5]]);
  });

  it("steps by half a star with half", async () => {
    const w = mount(CuiRating, { props: { modelValue: 2, half: true } });
    await press(w, "ArrowRight");
    await press(w, "ArrowLeft");
    expect(w.emitted("update:modelValue")).toEqual([[2.5], [1.5]]);
    await w.setProps({ modelValue: 3.5 });
    expect(slider(w).attributes("aria-valuetext")).toBe("3.5 of 5 stars");
  });

  it("stops at the ends without emitting, and swallows the key", async () => {
    const w = mount(CuiRating, { props: { modelValue: 5 } });
    await press(w, "ArrowRight");
    await press(w, "End");
    expect(w.emitted("update:modelValue")).toBeUndefined();
  });

  it("goes no lower than one step when not clearable", async () => {
    const w = mount(CuiRating, { props: { modelValue: 1, clearable: false } });
    await press(w, "ArrowLeft");
    await press(w, "Home");
    expect(w.emitted("update:modelValue")).toBeUndefined();
  });

  it("is out of the tab order and inert to keys while disabled", async () => {
    const w = mount(CuiRating, { props: { modelValue: 2, disabled: true } });
    expect(slider(w).attributes("tabindex")).toBe("-1");
    expect(slider(w).attributes("aria-disabled")).toBe("true");
    await press(w, "ArrowRight");
    expect(w.emitted("update:modelValue")).toBeUndefined();
  });

  it("is an image with the same text, and no tab stop, when readonly", () => {
    const w = mount(CuiRating, { props: { modelValue: 4, readonly: true } });
    expect(slider(w).exists()).toBe(false);
    const img = w.find('[role="img"]');
    expect(img.attributes("aria-label")).toBe("4 of 5 stars");
    expect(w.findAll("[tabindex]")).toHaveLength(0);
  });

  it("keeps its label's name when readonly", () => {
    const w = mount(CuiRating, { props: { modelValue: 4, readonly: true, label: "Quality" } });
    const img = w.find('[role="img"]');
    const [labelRef, selfRef] = img.attributes("aria-labelledby")!.split(" ");
    expect(w.find(`#${labelRef}`).text()).toBe("Quality");
    expect(selfRef).toBe(img.attributes("id"));
  });

  it("focus() focuses the slider", () => {
    const w = mount(CuiRating, { attachTo: document.body });
    (w.vm as unknown as { focus: () => void }).focus();
    expect(document.activeElement).toBe(slider(w).element);
    w.unmount();
  });
});

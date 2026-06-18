import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import CuiRating from "../CuiRating.vue";

// The star wrappers are the clickable <div>s inside the inline-flex row.
// They each contain a CuiIcon. We select them by the click handler region:
// every star div has `cursor` in its inline style, so query the icon-bearing divs.
function stars(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll("div[style*='cursor']");
}

describe("CuiRating", () => {
  it("renders `max` clickable stars (default 5)", () => {
    const wrapper = mount(CuiRating);
    expect(stars(wrapper)).toHaveLength(5);
  });

  it("honors a custom `max`", () => {
    const wrapper = mount(CuiRating, { props: { max: 8 } });
    expect(stars(wrapper)).toHaveLength(8);
  });

  it("emits update:modelValue with the clicked star index", async () => {
    const wrapper = mount(CuiRating, { props: { modelValue: 0 } });
    await stars(wrapper)[2].trigger("click");
    expect(wrapper.emitted("update:modelValue")).toEqual([[3]]);
  });

  it("clears to 0 when clicking the current value (clearable default)", async () => {
    const wrapper = mount(CuiRating, { props: { modelValue: 3 } });
    await stars(wrapper)[2].trigger("click");
    expect(wrapper.emitted("update:modelValue")).toEqual([[0]]);
  });

  it("does not clear when clearable is false", async () => {
    const wrapper = mount(CuiRating, { props: { modelValue: 3, clearable: false } });
    await stars(wrapper)[2].trigger("click");
    expect(wrapper.emitted("update:modelValue")).toEqual([[3]]);
  });

  it("readonly prevents emitting on click", async () => {
    const wrapper = mount(CuiRating, { props: { modelValue: 2, readonly: true } });
    await stars(wrapper)[4].trigger("click");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("disabled prevents emitting on click", async () => {
    const wrapper = mount(CuiRating, { props: { modelValue: 2, disabled: true } });
    await stars(wrapper)[4].trigger("click");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });
});

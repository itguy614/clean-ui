import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import CuiButton from "../CuiButton.vue";

describe("CuiButton", () => {
  it("renders slot content", () => {
    const wrapper = mount(CuiButton, {
      slots: { default: "Click me" },
    });
    expect(wrapper.text()).toBe("Click me");
  });

  it("applies solid variant classes by default", () => {
    const wrapper = mount(CuiButton);
    expect(wrapper.classes()).toContain("bg-primary-500");
  });

  it("applies outline variant classes", () => {
    const wrapper = mount(CuiButton, {
      props: { variant: "outline" },
    });
    expect(wrapper.classes()).toContain("border");
  });

  it("applies size classes", () => {
    const wrapper = mount(CuiButton, {
      props: { size: "lg" },
    });
    expect(wrapper.classes()).toContain("h-12");
  });

  it("sets disabled attribute", () => {
    const wrapper = mount(CuiButton, {
      props: { disabled: true },
    });
    expect(wrapper.attributes("disabled")).toBeDefined();
  });

  it("emits click event", async () => {
    const wrapper = mount(CuiButton);
    await wrapper.trigger("click");
    expect(wrapper.emitted("click")).toHaveLength(1);
  });
});

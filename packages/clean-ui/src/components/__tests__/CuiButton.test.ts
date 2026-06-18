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

  it("renders as a <button> with the cui-button class by default", () => {
    const wrapper = mount(CuiButton);
    expect(wrapper.element.tagName).toBe("BUTTON");
    expect(wrapper.classes()).toContain("cui-button");
  });

  it("renders as an <a> when href is set", () => {
    const wrapper = mount(CuiButton, { props: { href: "/foo" } });
    expect(wrapper.element.tagName).toBe("A");
    expect(wrapper.attributes("href")).toBe("/foo");
  });

  it("applies the size scale to the inline height", () => {
    const lg = mount(CuiButton, { props: { size: "lg" } });
    expect(lg.attributes("style")).toContain("3rem"); // BUTTON_SIZE_SCALE.lg.height
    const sm = mount(CuiButton, { props: { size: "sm" } });
    expect(sm.attributes("style")).toContain("2rem"); // BUTTON_SIZE_SCALE.sm.height
  });

  it("renders distinct styling per variant", () => {
    const solid = mount(CuiButton, { props: { variant: "solid" } });
    const outline = mount(CuiButton, { props: { variant: "outline" } });
    expect(solid.attributes("style")).not.toBe(outline.attributes("style"));
  });

  it("sets disabled attribute and disabled class", () => {
    const wrapper = mount(CuiButton, {
      props: { disabled: true },
    });
    expect(wrapper.attributes("disabled")).toBeDefined();
    expect(wrapper.classes()).toContain("cui-button--disabled");
  });

  it("sets aria-busy when loading", () => {
    const wrapper = mount(CuiButton, { props: { loading: true } });
    expect(wrapper.attributes("aria-busy")).toBe("true");
  });

  it("emits click event", async () => {
    const wrapper = mount(CuiButton);
    await wrapper.trigger("click");
    expect(wrapper.emitted("click")).toHaveLength(1);
  });
});

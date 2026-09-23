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

  /** The element's own inline custom property, not the resolved value — jsdom computes nothing. */
  const token = (wrapper: ReturnType<typeof mount>, prop: string) =>
    (wrapper.element as HTMLElement).style.getPropertyValue(prop);

  it("emits the size scale as a height token, not a bare declaration", () => {
    const lg = mount(CuiButton, { props: { size: "lg" } });
    expect(token(lg, "--_button-height")).toContain("3rem"); // BUTTON_SIZE_SCALE.lg.height
    const sm = mount(CuiButton, { props: { size: "sm" } });
    expect(token(sm, "--_button-height")).toContain("2rem"); // BUTTON_SIZE_SCALE.sm.height
    // The point of #114: nothing themeable may be a bare inline declaration.
    expect(lg.element.style.height).toBe("");
  });

  it("renders distinct styling per variant", () => {
    const solid = mount(CuiButton, { props: { variant: "solid" } });
    const outline = mount(CuiButton, { props: { variant: "outline" } });
    expect(token(solid, "--_button-bg")).not.toBe(token(outline, "--_button-bg"));
    expect(token(solid, "--_button-bg")).not.toBe("");
  });

  it("dash and outline differ only in border style", () => {
    const dash = mount(CuiButton, { props: { variant: "dash" } });
    const outline = mount(CuiButton, { props: { variant: "outline" } });
    expect(token(dash, "--_button-border")).toContain("dashed");
    expect(token(outline, "--_button-border")).toContain("solid");
    expect(token(dash, "--_button-bg")).toBe(token(outline, "--_button-bg"));
  });

  describe("icon", () => {
    it("zeroes the horizontal padding and squares the button", () => {
      const wrapper = mount(CuiButton, { props: { icon: true } });
      expect(wrapper.classes()).toContain("cui-button--icon");
      expect(token(wrapper, "--_button-px")).toBe("0px");
    });

    it("opts out of the target-size floor", () => {
      const wrapper = mount(CuiButton, { props: { icon: true } });
      expect(token(wrapper, "--cui-control-min-target")).toBe("0px");
    });

    it("leaves the floor alone otherwise", () => {
      const wrapper = mount(CuiButton);
      expect(token(wrapper, "--cui-control-min-target")).toBe("");
      expect(token(wrapper, "--_button-px")).not.toBe("0px");
    });
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

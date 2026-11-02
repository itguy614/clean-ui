import { describe, it, expect, vi } from "vitest";
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

  describe("focusableWhenDisabled (#396)", () => {
    it("keeps a disabled button out of native disabled, marked aria-disabled", () => {
      const wrapper = mount(CuiButton, { props: { disabled: true, focusableWhenDisabled: true } });
      expect(wrapper.attributes("disabled")).toBeUndefined();
      expect(wrapper.attributes("aria-disabled")).toBe("true");
      expect(wrapper.classes()).toContain("cui-button--disabled");
    });

    it("does the same while loading", () => {
      const wrapper = mount(CuiButton, { props: { loading: true, focusableWhenDisabled: true } });
      expect(wrapper.attributes("disabled")).toBeUndefined();
      expect(wrapper.attributes("aria-disabled")).toBe("true");
    });

    it("swallows a click, so neither the consumer nor an ancestor sees it", async () => {
      const onParentClick = vi.fn();
      const parent = document.createElement("div");
      parent.addEventListener("click", onParentClick);
      document.body.append(parent);
      const wrapper = mount(CuiButton, { props: { disabled: true, focusableWhenDisabled: true }, attachTo: parent });
      await wrapper.trigger("click");
      expect(wrapper.emitted("click")).toBeUndefined();
      expect(onParentClick).not.toHaveBeenCalled();
      wrapper.unmount();
      parent.remove();
    });

    it("cancels a submit button's form submission", () => {
      const form = document.createElement("form");
      const onSubmit = vi.fn((e: Event) => e.preventDefault());
      form.addEventListener("submit", onSubmit);
      document.body.append(form);
      const wrapper = mount(CuiButton, {
        props: { type: "submit", disabled: true, focusableWhenDisabled: true },
        attachTo: form,
      });
      (wrapper.element as HTMLButtonElement).click();
      expect(onSubmit).not.toHaveBeenCalled();
      wrapper.unmount();
      form.remove();
    });

    it("emits click again once enabled", async () => {
      const wrapper = mount(CuiButton, { props: { disabled: true, focusableWhenDisabled: true } });
      await wrapper.setProps({ disabled: false });
      await wrapper.trigger("click");
      expect(wrapper.emitted("click")).toHaveLength(1);
      expect(wrapper.attributes("aria-disabled")).toBeUndefined();
    });
  });

  describe("pressed (#396)", () => {
    it("renders no aria-pressed when unset — not a toggle", () => {
      const wrapper = mount(CuiButton);
      expect(wrapper.attributes("aria-pressed")).toBeUndefined();
      expect(wrapper.classes()).not.toContain("cui-button--pressed");
    });

    it("leaves a consumer's own aria-pressed alone when unset", () => {
      const wrapper = mount(CuiButton, { attrs: { "aria-pressed": "mixed" } });
      expect(wrapper.attributes("aria-pressed")).toBe("mixed");
    });

    it("follows the prop", async () => {
      const wrapper = mount(CuiButton, { props: { pressed: false } });
      expect(wrapper.attributes("aria-pressed")).toBe("false");
      expect(wrapper.classes()).not.toContain("cui-button--pressed");
      await wrapper.setProps({ pressed: true });
      expect(wrapper.attributes("aria-pressed")).toBe("true");
      expect(wrapper.classes()).toContain("cui-button--pressed");
    });

    it("emits the pressed paint as private tokens, only while pressed", async () => {
      const wrapper = mount(CuiButton, { props: { variant: "ghost", color: "success", pressed: false } });
      expect(token(wrapper, "--_button-pressed-bg")).toBe("");
      await wrapper.setProps({ pressed: true });
      expect(token(wrapper, "--_button-pressed-bg")).toBe("var(--cui-success-bg)");
      expect(token(wrapper, "--_button-pressed-border")).toBe("1px solid var(--cui-success-border)");
    });

    it("counts a pressed ghost button as painted: it draws an edge", async () => {
      const wrapper = mount(CuiButton, { props: { variant: "ghost", pressed: false } });
      expect(wrapper.classes()).toContain("cui-button--ghost");
      await wrapper.setProps({ pressed: true });
      expect(wrapper.classes()).not.toContain("cui-button--ghost");
    });

    it("combines with focusableWhenDisabled", () => {
      const wrapper = mount(CuiButton, { props: { pressed: true, disabled: true, focusableWhenDisabled: true } });
      expect(wrapper.attributes("aria-pressed")).toBe("true");
      expect(wrapper.attributes("aria-disabled")).toBe("true");
      expect(wrapper.attributes("disabled")).toBeUndefined();
    });
  });

  describe("disabled link (#422)", () => {
    it.each([
      ["href", { href: "/foo" }],
      ["to", { to: "/foo" }],
    ])("drops the %s, so the link can't be focused or followed", async (_, target) => {
      const wrapper = mount(CuiButton, { props: { ...target, disabled: true } });
      expect(wrapper.element.tagName).toBe("A");
      expect(wrapper.attributes("href")).toBeUndefined();
      expect(wrapper.attributes("tabindex")).toBeUndefined();
      expect(wrapper.attributes("role")).toBe("button");
      expect(wrapper.attributes("aria-disabled")).toBe("true");
      await wrapper.trigger("click");
      expect(wrapper.emitted("click")).toBeUndefined();
    });

    it("ignores focusableWhenDisabled on a link", () => {
      const wrapper = mount(CuiButton, { props: { href: "/foo", disabled: true, focusableWhenDisabled: true } });
      expect(wrapper.attributes("href")).toBeUndefined();
    });
  });
});

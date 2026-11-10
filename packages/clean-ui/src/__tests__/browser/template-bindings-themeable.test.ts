import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import { h, nextTick, type Component } from "vue";
import main from "../../styles/main.css?inline";
import CuiInput from "../../components/CuiInput.vue";
import CuiTextarea from "../../components/CuiTextarea.vue";
import CuiSelect from "../../components/CuiSelect.vue";
import CuiToggle from "../../components/CuiToggle.vue";
import CuiProgress from "../../components/CuiProgress.vue";
import CuiRadio from "../../components/CuiRadio.vue";
import CuiRadioGroup from "../../components/CuiRadioGroup.vue";
import CuiButton from "../../components/CuiButton.vue";
import CuiCheckbox from "../../components/CuiCheckbox.vue";
import CuiCombobox from "../../components/CuiCombobox.vue";

/**
 * #333 — these properties used to be bare keys in a template `:style` binding, which outranks
 * every stylesheet rule. They are now private tokens read through zero-specificity rules, so
 * a consumer's plain class rule (0,1,0) or a public `--cui-<component>-<slot>` token on a
 * container wins with no `!important`. Real browser: jsdom applies no cascade.
 */
describe("template bindings are themeable (real browser)", () => {
  beforeAll(() => {
    const style = document.createElement("style");
    style.id = "cui-tokens-333";
    style.textContent = main;
    document.head.append(style);
  });
  afterAll(() => document.getElementById("cui-tokens-333")?.remove());

  const wrappers: VueWrapper[] = [];
  const rules: HTMLStyleElement[] = [];
  const hosts: HTMLElement[] = [];
  /** A host div carrying `hostStyle`, so ancestor overrides are testable. */
  function newHost(hostStyle: string) {
    const host = document.createElement("div");
    host.setAttribute("style", hostStyle);
    document.body.append(host);
    hosts.push(host);
    return host;
  }

  afterEach(() => {
    hosts.splice(0).forEach((h) => h.remove());
    wrappers.splice(0).forEach((w) => w.unmount());
    rules.splice(0).forEach((r) => r.remove());
  });

  /** Mount `component` inside a host carrying `hostStyle`, return the element matching `selector`. */
  async function render(component: Component, props: Record<string, unknown>, selector: string, hostStyle = "") {
    const host = newHost(hostStyle);
    const wrapper = mount(component, { props, attachTo: host });
    wrappers.push(wrapper);
    await nextTick();
    const el = host.querySelector<HTMLElement>(selector)!;
    expect(el).toBeTruthy();
    return el;
  }

  function consumerRule(css: string) {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.append(style);
    rules.push(style);
  }

  const px = (el: Element, prop: string) => parseFloat(getComputedStyle(el).getPropertyValue(prop));

  describe.each([
    ["CuiInput", CuiInput, ".cui-input", "--cui-input-radius"],
    ["CuiTextarea", CuiTextarea, ".cui-textarea", "--cui-textarea-radius"],
    ["CuiSelect", CuiSelect, ".cui-select__trigger", "--cui-select-radius"],
  ] as Array<[string, Component, string, string]>)("%s radius", (_name, component, selector, token) => {
    const props = { modelValue: "", options: [] };

    it("is the scale's radius until overridden", async () => {
      expect(px(await render(component, props, selector), "border-top-left-radius")).toBe(6);
      expect(px(await render(component, { ...props, rounded: "lg" }, selector), "border-top-left-radius")).toBe(8);
    });

    it("takes the public token from a container", async () => {
      const el = await render(component, props, selector, `${token}: 11px`);
      expect(px(el, "border-top-left-radius")).toBe(11);
    });

    it("loses to a consumer's plain class rule, with no !important", async () => {
      consumerRule(`${selector} { border-radius: 3px; }`);
      expect(px(await render(component, props, selector), "border-top-left-radius")).toBe(3);
    });
  });

  describe("CuiInput attached buttons follow the field's radius", () => {
    const attached = (props: Record<string, unknown> = {}, hostStyle = "") => {
      const host = newHost(hostStyle);
      const wrapper = mount(
        () => h(CuiInput, { modelValue: "", ...props }, { "prefix-button": () => h(CuiButton, () => "P"), "suffix-button": () => h(CuiButton, () => "S") }),
        { attachTo: host },
      );
      wrappers.push(wrapper);
      return {
        field: host.querySelector<HTMLElement>(".cui-input")!,
        prefix: host.querySelector<HTMLElement>(".cui-input__prefix-button .cui-button")!,
        suffix: host.querySelector<HTMLElement>(".cui-input__suffix-button .cui-button")!,
      };
    };

    it("takes --cui-input-radius from a container", async () => {
      const { field, prefix, suffix } = attached({}, "--cui-input-radius: 12px");
      expect(px(field, "border-top-left-radius")).toBe(12);
      expect(px(prefix, "border-top-left-radius")).toBe(11);
      expect(px(prefix, "border-top-right-radius")).toBe(0);
      expect(px(suffix, "border-top-right-radius")).toBe(11);
      expect(px(suffix, "border-top-left-radius")).toBe(0);
    });

    it("takes --cui-input-radius set on the field itself", async () => {
      consumerRule(".cui-input { --cui-input-radius: 14px; }");
      const { field, prefix, suffix } = attached();
      expect(px(field, "border-top-left-radius")).toBe(14);
      expect(px(prefix, "border-bottom-left-radius")).toBe(13);
      expect(px(suffix, "border-bottom-right-radius")).toBe(13);
    });

    it("follows the rounded prop", async () => {
      const { field, prefix, suffix } = attached({ rounded: "lg" });
      expect(px(field, "border-top-left-radius")).toBe(8);
      expect(px(prefix, "border-top-left-radius")).toBe(7);
      expect(px(suffix, "border-top-right-radius")).toBe(7);
    });
  });

  it("CuiToggle's knob still follows the size preset", async () => {
    const md = await render(CuiToggle, { modelValue: false, size: "md" }, ".cui-toggle__knob");
    const lg = await render(CuiToggle, { modelValue: false, size: "lg" }, ".cui-toggle__knob");
    expect(px(md, "width")).toBeGreaterThan(0);
    expect(px(md, "height")).toBe(px(md, "width"));
    expect(px(lg, "width")).toBeGreaterThan(px(md, "width"));
  });

  it("CuiProgress's bar track takes --cui-progress-height and a plain rule; the circle stays square", async () => {
    expect(px(await render(CuiProgress, { value: 5 }, ".cui-progress-bar__track"), "height")).toBeGreaterThan(0);
    expect(px(await render(CuiProgress, { value: 5 }, ".cui-progress-bar__track", "--cui-progress-height: 21px"), "height")).toBe(21);
    const circle = await render(CuiProgress, { value: 5, variant: "circle" }, ".cui-progress-circle", "--cui-progress-height: 4px");
    expect(px(circle, "width")).toBe(px(circle, "height"));
    expect(px(circle, "height")).toBeGreaterThan(4);
    consumerRule(".cui-progress-bar__track { height: 9px; }");
    expect(px(await render(CuiProgress, { value: 5 }, ".cui-progress-bar__track"), "height")).toBe(9);
  });

  it("a button-variant CuiRadio takes --cui-radio-height / -px and a plain rule", async () => {
    const mountRadio = async (hostStyle = "") => {
      const host = newHost(hostStyle);
      const wrapper = mount(
        () => h(CuiRadioGroup, { variant: "buttons", modelValue: "a" }, () => [h(CuiRadio, { value: "a", label: "a" })]),
        { attachTo: host },
      );
      wrappers.push(wrapper);
      await nextTick();
      return host.querySelector<HTMLElement>(".cui-radio-button")!;
    };
    expect(px(await mountRadio(), "height")).toBeGreaterThan(0);
    const themed = await mountRadio("--cui-radio-height: 60px; --cui-radio-px: 30px");
    expect(px(themed, "height")).toBe(60);
    expect(px(themed, "padding-left")).toBe(30);
    expect(px(themed, "padding-right")).toBe(30);
    consumerRule(".cui-radio-button { height: 44px; padding-left: 5px; }");
    const plain = await mountRadio();
    expect(px(plain, "height")).toBe(44);
    expect(px(plain, "padding-left")).toBe(5);
  });

  /**
   * #454 — the form controls' stylesheets used to read their private `--_<c>-<slot>` tokens
   * directly, so a container's `--cui-<c>-<slot>` or a consumer's plain class rule lost to them.
   * Each row names a part, the property the slot paints, its public token, and the state the
   * rule applies in. Both routes must win, with no `!important`.
   */
  type Slot = {
    name: string;
    component: Component;
    props: Record<string, unknown>;
    /** The part the slot paints. */
    part: string;
    prop: string;
    token: string;
    value: string;
    /** Applied before measuring: hover or focus the element matching `at`. */
    state?: "hover" | "focus";
    at?: string;
    /** The measured value is a longer one (a ring in a box-shadow) that contains `value`. */
    contains?: boolean;
    /** The property a consumer's plain rule sets, when it isn't `prop` (a shorthand, say). */
    plain?: string;
  };
  /** A button-variant group of one, selected unless `modelValue` is another value. */
  const inGroup = (modelValue = "a"): Component => ({
    render: () => h(CuiRadioGroup, { variant: "buttons", modelValue }, () => [h(CuiRadio, { value: "a", label: "a" })]),
  });
  const input = { modelValue: "" };
  const select = { modelValue: "", options: [] };
  const SLOTS: Slot[] = [
    { name: "input height", component: CuiInput, props: input, part: ".cui-input", prop: "height", token: "--cui-input-height", value: "61px" },
    { name: "input border", component: CuiInput, props: input, part: ".cui-input", prop: "border-top-color", token: "--cui-input-border", value: "rgb(1, 2, 3)", plain: "border-color" },
    { name: "input px", component: CuiInput, props: input, part: ".cui-input__inner", prop: "padding-left", token: "--cui-input-px", value: "29px" },
    { name: "input font-size", component: CuiInput, props: input, part: ".cui-input__native", prop: "font-size", token: "--cui-input-font-size", value: "23px" },
    { name: "input focus-border", component: CuiInput, props: input, part: ".cui-input", prop: "border-top-color", token: "--cui-input-focus-border", value: "rgb(4, 5, 6)", state: "focus", at: "input", plain: "border-color" },
    { name: "input focus-ring", component: CuiInput, props: input, part: ".cui-input", prop: "box-shadow", token: "--cui-input-focus-ring", value: "rgb(7, 8, 9)", state: "focus", at: "input", contains: true },
    { name: "textarea border", component: CuiTextarea, props: input, part: ".cui-textarea", prop: "border-top-color", token: "--cui-textarea-border", value: "rgb(1, 2, 3)", plain: "border-color" },
    { name: "textarea px", component: CuiTextarea, props: input, part: ".cui-textarea__native", prop: "padding-left", token: "--cui-textarea-px", value: "29px" },
    { name: "textarea py", component: CuiTextarea, props: input, part: ".cui-textarea__native", prop: "padding-top", token: "--cui-textarea-py", value: "17px" },
    { name: "textarea font-size", component: CuiTextarea, props: input, part: ".cui-textarea__native", prop: "font-size", token: "--cui-textarea-font-size", value: "23px" },
    { name: "textarea focus-border", component: CuiTextarea, props: input, part: ".cui-textarea", prop: "border-top-color", token: "--cui-textarea-focus-border", value: "rgb(4, 5, 6)", state: "focus", at: "textarea", plain: "border-color" },
    { name: "textarea focus-ring", component: CuiTextarea, props: input, part: ".cui-textarea", prop: "box-shadow", token: "--cui-textarea-focus-ring", value: "rgb(7, 8, 9)", state: "focus", at: "textarea", contains: true },
    { name: "select min-height", component: CuiSelect, props: select, part: ".cui-select__trigger", prop: "min-height", token: "--cui-select-min-height", value: "71px" },
    { name: "select px", component: CuiSelect, props: select, part: ".cui-select__trigger", prop: "padding-left", token: "--cui-select-px", value: "29px" },
    { name: "select border", component: CuiSelect, props: select, part: ".cui-select__trigger", prop: "border-top-color", token: "--cui-select-border", value: "rgb(1, 2, 3)", plain: "border-color" },
    { name: "select font-size", component: CuiSelect, props: select, part: ".cui-select__trigger", prop: "font-size", token: "--cui-select-font-size", value: "23px" },
    { name: "select focus-ring", component: CuiSelect, props: select, part: ".cui-select__trigger", prop: "box-shadow", token: "--cui-select-focus-ring", value: "rgb(7, 8, 9)", state: "focus", at: ".cui-select__trigger", contains: true },
    { name: "checkbox border", component: CuiCheckbox, props: { modelValue: false }, part: ".cui-checkbox__indicator", prop: "border-top-color", token: "--cui-checkbox-border", value: "rgb(1, 2, 3)", plain: "border-color" },
    { name: "checkbox bg", component: CuiCheckbox, props: { modelValue: true }, part: ".cui-checkbox__indicator", prop: "background-color", token: "--cui-checkbox-bg", value: "rgb(2, 3, 4)", plain: "background" },
    { name: "checkbox hover-border", component: CuiCheckbox, props: { modelValue: false }, part: ".cui-checkbox__indicator", prop: "border-top-color", token: "--cui-checkbox-hover-border", value: "rgb(5, 6, 7)", state: "hover", at: ".cui-checkbox", plain: "border-color" },
    { name: "checkbox focus-ring", component: CuiCheckbox, props: { modelValue: false }, part: ".cui-checkbox", prop: "outline-color", token: "--cui-checkbox-focus-ring", value: "rgb(7, 8, 9)", state: "focus", at: ".cui-checkbox" },
    { name: "radio border", component: CuiRadio, props: { modelValue: "b", value: "a" }, part: ".cui-radio__indicator", prop: "border-top-color", token: "--cui-radio-border", value: "rgb(1, 2, 3)", plain: "border-color" },
    { name: "radio bg", component: CuiRadio, props: { modelValue: "a", value: "a" }, part: ".cui-radio__indicator", prop: "background-color", token: "--cui-radio-bg", value: "rgb(2, 3, 4)", plain: "background" },
    { name: "radio color (dot)", component: CuiRadio, props: { modelValue: "a", value: "a" }, part: ".cui-radio__dot", prop: "background-color", token: "--cui-radio-color", value: "rgb(5, 6, 7)", plain: "background" },
    { name: "radio hover-border", component: CuiRadio, props: { modelValue: "b", value: "a" }, part: ".cui-radio__indicator", prop: "border-top-color", token: "--cui-radio-hover-border", value: "rgb(5, 6, 7)", state: "hover", at: ".cui-radio", plain: "border-color" },
    { name: "radio focus-ring", component: CuiRadio, props: { modelValue: "a", value: "a" }, part: ".cui-radio", prop: "outline-color", token: "--cui-radio-focus-ring", value: "rgb(7, 8, 9)", state: "focus", at: ".cui-radio" },
    { name: "radio button color", component: inGroup(), props: {}, part: ".cui-radio-button", prop: "color", token: "--cui-radio-color", value: "rgb(5, 6, 7)" },
    { name: "radio button bg", component: inGroup(), props: {}, part: ".cui-radio-button", prop: "background-color", token: "--cui-radio-bg", value: "rgb(2, 3, 4)", plain: "background" },
    { name: "radio button hover-bg", component: inGroup(), props: {}, part: ".cui-radio-button", prop: "background-color", token: "--cui-radio-hover-bg", value: "rgb(9, 8, 7)", state: "hover", at: ".cui-radio-button", plain: "background" },
    { name: "radio button hover-color", component: inGroup(), props: {}, part: ".cui-radio-button", prop: "color", token: "--cui-radio-hover-color", value: "rgb(6, 5, 4)", state: "hover", at: ".cui-radio-button" },
    { name: "radio button hover-border", component: inGroup("b"), props: {}, part: ".cui-radio-button", prop: "border-top-color", token: "--cui-radio-hover-border", value: "rgb(5, 6, 7)", state: "hover", at: ".cui-radio-button", plain: "border-color" },
    { name: "radio button focus-ring", component: inGroup(), props: {}, part: ".cui-radio-button", prop: "outline-color", token: "--cui-radio-focus-ring", value: "rgb(7, 8, 9)", state: "focus", at: ".cui-radio-button" },
    { name: "toggle bg (on)", component: CuiToggle, props: { modelValue: true }, part: ".cui-toggle__track", prop: "background-color", token: "--cui-toggle-bg", value: "rgb(2, 3, 4)", plain: "background" },
    { name: "toggle color (on border)", component: CuiToggle, props: { modelValue: true }, part: ".cui-toggle__track", prop: "border-top-color", token: "--cui-toggle-color", value: "rgb(5, 6, 7)", plain: "border-color" },
    { name: "toggle color (knob)", component: CuiToggle, props: { modelValue: false }, part: ".cui-toggle__knob", prop: "background-color", token: "--cui-toggle-color", value: "rgb(5, 6, 7)", plain: "background" },
    { name: "toggle hover-border (on)", component: CuiToggle, props: { modelValue: true }, part: ".cui-toggle__track", prop: "border-top-color", token: "--cui-toggle-hover-border", value: "rgb(8, 9, 1)", state: "hover", at: ".cui-toggle", plain: "border-color" },
    { name: "toggle hover-border (off)", component: CuiToggle, props: { modelValue: false }, part: ".cui-toggle__track", prop: "border-top-color", token: "--cui-toggle-hover-border", value: "rgb(8, 9, 1)", state: "hover", at: ".cui-toggle", plain: "border-color" },
    { name: "toggle focus-ring", component: CuiToggle, props: { modelValue: true }, part: ".cui-toggle", prop: "outline-color", token: "--cui-toggle-focus-ring", value: "rgb(7, 8, 9)", state: "focus", at: ".cui-toggle" },
    { name: "combobox border", component: CuiCombobox, props: { options: [] }, part: ".cui-combobox__control", prop: "border-top-color", token: "--cui-combobox-border", value: "rgb(1, 2, 3)", plain: "border-color" },
    { name: "combobox focus-border", component: CuiCombobox, props: { options: [] }, part: ".cui-combobox__control", prop: "border-top-color", token: "--cui-combobox-focus-border", value: "rgb(4, 5, 6)", state: "focus", at: "input", plain: "border-color" },
    { name: "combobox focus-ring", component: CuiCombobox, props: { options: [] }, part: ".cui-combobox__control", prop: "box-shadow", token: "--cui-combobox-focus-ring", value: "rgb(7, 8, 9)", state: "focus", at: "input", contains: true },
    { name: "progress bg (bar track)", component: CuiProgress, props: { value: 5 }, part: ".cui-progress-bar__track", prop: "background-color", token: "--cui-progress-bg", value: "rgb(2, 3, 4)", plain: "background" },
    { name: "progress color (bar fill)", component: CuiProgress, props: { value: 5 }, part: ".cui-progress-bar__fill", prop: "background-color", token: "--cui-progress-color", value: "rgb(5, 6, 7)", plain: "background" },
    { name: "progress bg (circle track)", component: CuiProgress, props: { value: 5, variant: "circle" }, part: ".cui-progress-circle__track", prop: "stroke", token: "--cui-progress-bg", value: "rgb(2, 3, 4)" },
    { name: "progress color (circle fill)", component: CuiProgress, props: { value: 5, variant: "circle" }, part: ".cui-progress-circle__fill", prop: "stroke", token: "--cui-progress-color", value: "rgb(5, 6, 7)" },
  ];

  it("an invalid field keeps its error colours under a border token (#454)", async () => {
    const host = "--cui-input-border: rgb(1, 2, 3); --cui-combobox-border: rgb(1, 2, 3); --cui-combobox-focus-border: rgb(1, 2, 3)";
    const error = getComputedStyle(await render(CuiInput, { modelValue: "", error: true }, ".cui-input", host)).borderTopColor;
    expect(error).not.toBe("rgb(1, 2, 3)");
    // The attached-button separators follow the outer border.
    const withButtons = mount(
      { render: () => h(CuiInput, { modelValue: "", error: true }, { "suffix-button": () => h(CuiButton, null, () => "Go") }) },
      { attachTo: newHost(host) },
    );
    wrappers.push(withButtons);
    await nextTick();
    const separator = withButtons.element.parentElement!.querySelector<HTMLElement>(".cui-input__suffix-button")!;
    expect(getComputedStyle(separator).borderLeftColor).toBe(error);
    const combo = await render(CuiCombobox, { options: [], error: true }, ".cui-combobox__control", host);
    expect(getComputedStyle(combo).borderTopColor).toBe(error);
    (combo.querySelector("input") as HTMLElement).focus();
    await nextTick();
    settle();
    expect(getComputedStyle(combo).borderTopColor).toBe(error);
    expect(getComputedStyle(combo).boxShadow).not.toContain("rgb(1, 2, 3)");
  });

  it("an invalid focused Input and Textarea show the error ring, which a themed focus ring does not hide (#454)", async () => {
    const host = "--cui-input-focus-ring: rgb(1, 2, 3); --cui-textarea-focus-ring: rgb(1, 2, 3); --cui-error-focus-ring: rgb(9, 8, 7)";
    for (const [component, part, native] of [[CuiInput, ".cui-input", "input"], [CuiTextarea, ".cui-textarea", "textarea"]] as const) {
      const normal = await render(component, { modelValue: "" }, part, host);
      (normal.querySelector(native) as HTMLElement).focus();
      await nextTick();
      settle();
      expect(getComputedStyle(normal).boxShadow).toContain("rgb(1, 2, 3)");
      const invalid = await render(component, { modelValue: "", error: true }, part, host);
      (invalid.querySelector(native) as HTMLElement).focus();
      await nextTick();
      settle();
      expect(getComputedStyle(invalid).boxShadow).toContain("rgb(9, 8, 7)");
      expect(getComputedStyle(invalid).boxShadow).not.toContain("rgb(1, 2, 3)");
    }
  });

  /** Finite transitions finish at once, so a colour is read at its target. */
  const settle = () =>
    document.documentElement.getAnimations({ subtree: true }).forEach((a) => a.effect?.getComputedTiming().iterations !== Infinity && a.finish());

  describe.each(SLOTS)("form control slots (#454): $name", (slot) => {
    async function measure(hostStyle = "") {
      const host = newHost(hostStyle);
      wrappers.push(mount(slot.component, { props: slot.props, attachTo: host }));
      await nextTick();
      if (slot.state) {
        const at = host.querySelector<HTMLElement>(slot.at!)!;
        if (slot.state === "hover") await userEvent.hover(at);
        else at.focus();
        await nextTick();
      }
      settle();
      const value = getComputedStyle(host.querySelector(slot.part)!).getPropertyValue(slot.prop);
      return { value, ok: slot.contains ? value.includes(slot.value) : value === slot.value };
    }

    it("is not the override until one is set", async () => {
      expect((await measure()).ok).toBe(false);
    });

    it("takes the public token from a container", async () => {
      const result = await measure(`${slot.token}: ${slot.value}`);
      expect(result.ok, result.value).toBe(true);
    });

    it("loses to a consumer's plain class rule, with no !important", async () => {
      // Written on the state, as a consumer would, so the rule is at least as specific as the
      // component's own state rule would be were it not zero-specificity.
      const on = `${slot.part}${slot.state === "hover" ? ":hover" : slot.state === "focus" ? ":focus-within" : ""}`;
      consumerRule(slot.contains ? `${on} { box-shadow: 0 0 0 2px ${slot.value}; }` : `${on} { ${slot.plain ?? slot.prop}: ${slot.value}; }`);
      const result = await measure();
      expect(result.ok, result.value).toBe(true);
    });
  });
});

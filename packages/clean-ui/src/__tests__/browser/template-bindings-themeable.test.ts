import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
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
});

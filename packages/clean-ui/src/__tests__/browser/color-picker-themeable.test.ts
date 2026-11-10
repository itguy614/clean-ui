import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import main from "../../styles/main.css?inline";
import CuiColorPicker from "../../components/CuiColorPicker.vue";

/**
 * #467 — CuiColorPicker's paint used to be inline style objects, which outrank every
 * stylesheet rule. It is a stylesheet now: a consumer's plain class rule (0,1,0) or a public
 * `--cui-color-picker-<slot>` token on a container wins with no `!important`. Real browser:
 * jsdom applies no cascade.
 */
describe("CuiColorPicker is themeable (real browser)", () => {
  beforeAll(() => {
    const style = document.createElement("style");
    style.id = "cui-tokens-467-themeable";
    style.textContent = `${main}
      :root { --color-surface-500: oklch(0.7 0.01 270); --color-surface-600: oklch(0.6 0.012 270);
        --color-primary-500: oklch(0.5 0.2 270); --cui-text-body: #1f2937; }`;
    document.head.append(style);
  });
  afterAll(() => document.getElementById("cui-tokens-467-themeable")?.remove());

  const wrappers: VueWrapper[] = [];
  const rules: HTMLStyleElement[] = [];
  const hosts: HTMLElement[] = [];
  afterEach(() => {
    wrappers.splice(0).forEach((w) => w.unmount());
    rules.splice(0).forEach((r) => r.remove());
    hosts.splice(0).forEach((h) => h.remove());
  });

  async function render(hostStyle = "", props: Record<string, unknown> = {}) {
    const host = document.createElement("div");
    host.setAttribute("style", hostStyle);
    document.body.append(host);
    hosts.push(host);
    wrappers.push(mount(CuiColorPicker, { props: { modelValue: "#ff0000", showAlpha: true, presetPalette: "basic", ...props }, attachTo: host }));
    await nextTick();
    return (selector: string) => host.querySelector<HTMLElement>(selector)!;
  }

  function consumerRule(css: string) {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.append(style);
    rules.push(style);
  }

  const px = (el: Element, prop: string) => parseFloat(getComputedStyle(el).getPropertyValue(prop));
  const css = (el: Element, prop: string) => getComputedStyle(el).getPropertyValue(prop);

  it("keeps the size's dimensions until overridden", async () => {
    const q = await render();
    expect(px(q(".cui-color-picker"), "width")).toBe(280);
    expect(px(q(".cui-color-picker__gradient"), "height")).toBe(160);
    expect(px(q(".cui-color-picker__input"), "font-size")).toBe(13);
    expect(px(q(".cui-color-picker"), "border-top-left-radius")).toBe(8);
  });

  it("takes its public tokens from a container", async () => {
    const q = await render(
      "--cui-color-picker-width: 301px; --cui-color-picker-height: 111px; --cui-color-picker-radius: 12px; " +
        "--cui-color-picker-font-size: 17px; --cui-color-picker-bg: rgb(1, 2, 3); --cui-color-picker-border: 3px solid rgb(4, 5, 6)",
    );
    const root = q(".cui-color-picker");
    expect(px(root, "width")).toBe(301);
    expect(px(root, "border-top-left-radius")).toBe(12);
    expect(px(root, "border-top-width")).toBe(3);
    expect(css(root, "border-top-color")).toBe("rgb(4, 5, 6)");
    expect(css(root, "background-color")).toBe("rgb(1, 2, 3)");
    const gradient = q(".cui-color-picker__gradient");
    expect(px(gradient, "height")).toBe(111);
    // The gradient's top corners follow the frame's, less its border.
    expect(px(gradient, "border-top-left-radius")).toBe(11);
    expect(px(q(".cui-color-picker__input"), "font-size")).toBe(17);
    expect(px(q(".cui-color-picker__format"), "font-size")).toBe(17);
  });

  it("loses to a consumer's plain class rule, with no !important", async () => {
    consumerRule(`
      .cui-color-picker { width: 333px; border-radius: 3px; background: rgb(7, 8, 9); border: 2px dashed rgb(1, 1, 1); }
      .cui-color-picker__gradient { height: 99px; }
      .cui-color-picker__body { padding: 5px; }
      .cui-color-picker__input { font-size: 9px; padding-left: 2px; border-radius: 1px; background: rgb(9, 9, 9); }
      .cui-color-picker__swatch { width: 15px; border-radius: 2px; }
      .cui-color-picker__swatch[aria-checked="true"] { border-width: 4px; }
      .cui-color-picker__thumb--hue { width: 21px; }
      .cui-color-picker__hue { height: 6px; }
    `);
    const q = await render();
    const root = q(".cui-color-picker");
    expect(px(root, "width")).toBe(333);
    expect(px(root, "border-top-left-radius")).toBe(3);
    expect(css(root, "background-color")).toBe("rgb(7, 8, 9)");
    expect(css(root, "border-top-style")).toBe("dashed");
    expect(px(q(".cui-color-picker__gradient"), "height")).toBe(99);
    expect(px(q(".cui-color-picker__body"), "padding-top")).toBe(5);
    const input = q(".cui-color-picker__input");
    expect(px(input, "font-size")).toBe(9);
    expect(px(input, "padding-left")).toBe(2);
    expect(px(input, "border-top-left-radius")).toBe(1);
    expect(css(input, "background-color")).toBe("rgb(9, 9, 9)");
    expect(px(q(".cui-color-picker__swatch"), "width")).toBe(15);
    expect(px(q(".cui-color-picker__swatch"), "border-top-left-radius")).toBe(2);
    expect(px(q(".cui-color-picker__swatch[aria-checked=true]"), "border-top-width")).toBe(4);
    expect(px(q(".cui-color-picker__thumb--hue"), "width")).toBe(21);
    expect(px(q(".cui-color-picker__hue"), "height")).toBe(6);
  });

  it("leaves what is not a themeable property alone: the disabled state still wins", async () => {
    consumerRule(".cui-color-picker { width: 250px; }");
    const q = await render("", { disabled: true });
    expect(css(q(".cui-color-picker"), "opacity")).toBe("0.5");
    expect(css(q(".cui-color-picker"), "pointer-events")).toBe("none");
  });

  it("paints the picked colour through private properties on the element that uses it", async () => {
    const q = await render("", { modelValue: "#336699" });
    expect(css(q(".cui-color-picker__preview-fill"), "background-color")).toBe("rgb(51, 102, 153)");
    expect(q(".cui-color-picker__preview-fill").style.getPropertyValue("--_color-picker-value")).toBe("#336699");
    // Not on the root, where it would restyle every descendant for each frame of a drag.
    expect(q(".cui-color-picker").style.getPropertyValue("--_color-picker-value")).toBe("");
  });
});

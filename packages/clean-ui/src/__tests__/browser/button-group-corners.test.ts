import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { h, nextTick } from "vue";
import CuiButtonGroup from "../../components/CuiButtonGroup.vue";
import CuiButton from "../../components/CuiButton.vue";

/**
 * Found reviewing #417 — a toolbar's text-style toggles are a button group of ghost buttons,
 * with the pressed ones outlined. The group squared every inner corner by position, so a lone
 * pressed Bold lost its right corners against a ghost Italic that draws no edge. Now corners
 * merge only where two painted buttons meet. Real browser: `:has()` and the cascade.
 *
 * A pressed ghost toggle (`pressed`, #396) draws an edge, so it counts as painted.
 */
describe("CuiButtonGroup corners (real browser)", () => {
  let wrapper: VueWrapper | undefined;
  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  /** `pressed` is a ghost button with `pressed` set: a toolbar toggle that is on (#396). */
  type Variant = "outline" | "ghost" | "pressed";

  const buttonProps = (variant: Variant, key: number) =>
    variant === "pressed" ? { key, variant: "ghost" as const, pressed: true } : { key, variant };

  async function group(variants: Variant[], orientation: "horizontal" | "vertical" = "horizontal") {
    wrapper = mount(
      () => h(CuiButtonGroup, { label: "Text style", orientation }, () => variants.map((variant, i) => h(CuiButton, buttonProps(variant, i), () => `B${i}`))),
      { attachTo: document.body },
    );
    await nextTick();
    return [...wrapper.element.querySelectorAll<HTMLElement>(".cui-button")];
  }

  /** [top-left, top-right, bottom-right, bottom-left], each rounded (true) or square (false). */
  const rounded = (el: HTMLElement) =>
    ["border-top-left-radius", "border-top-right-radius", "border-bottom-right-radius", "border-bottom-left-radius"].map(
      (p) => parseFloat(getComputedStyle(el).getPropertyValue(p)) > 0,
    );

  const ALL = [true, true, true, true];
  const START = [true, false, false, true];
  const END = [false, true, true, false];
  const NONE = [false, false, false, false];

  it("keeps every corner of a lone painted button among ghost ones", async () => {
    const [bold] = await group(["outline", "ghost", "ghost", "ghost"]);
    expect(rounded(bold)).toEqual(ALL);
  });

  it("merges a run of painted buttons into one shape, rounded at its ends", async () => {
    const [bold, italic, underline] = await group(["outline", "outline", "ghost", "outline"]);
    expect(rounded(bold)).toEqual(START);
    expect(rounded(italic)).toEqual(END);
    expect(rounded(underline)).toEqual(ALL);
  });

  it("still merges a group of painted buttons by position", async () => {
    const [first, middle, last] = await group(["outline", "outline", "outline"]);
    expect(rounded(first)).toEqual(START);
    expect(rounded(middle)).toEqual(NONE);
    expect(rounded(last)).toEqual(END);
  });

  it("applies the same rule vertically", async () => {
    const [top, bottom, , lone] = await group(["outline", "outline", "ghost", "outline"], "vertical");
    expect(rounded(top)).toEqual([true, true, false, false]);
    expect(rounded(bottom)).toEqual([false, false, true, true]);
    expect(rounded(lone)).toEqual(ALL);
  });

  describe("pressed ghost toggles (#396)", () => {
    it("keeps every corner of a lone pressed toggle", async () => {
      const [bold] = await group(["pressed", "ghost", "ghost", "ghost"]);
      expect(rounded(bold)).toEqual(ALL);
    });

    it("merges a run of pressed toggles into one shape, rounded at its outer ends", async () => {
      const [bold, italic, underline, strike] = await group(["pressed", "pressed", "pressed", "ghost"]);
      expect(rounded(bold)).toEqual(START);
      expect(rounded(italic)).toEqual(NONE);
      expect(rounded(underline)).toEqual(END);
      expect(rounded(strike)).toEqual(ALL);
    });
  });
});

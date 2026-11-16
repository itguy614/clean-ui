import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import CuiPanel from "../../components/CuiPanel.vue";
import main from "../../styles/main.css?inline";
import { installTokens } from "../../../../../config/test/browser-helpers";

/**
 * #406 — a custom property cannot fall back by itself (`var()` is only checked when the
 * declaration is used), so the oklch gradient takes over through `@supports`. jsdom does no
 * cascade, so only a real browser shows which declaration actually paints.
 */
describe("CuiPanel gradient (real browser)", () => {
  let removeTokens: () => void;
  let wrapper: VueWrapper | undefined;
  beforeAll(() => {
    removeTokens = installTokens(main);
  });
  afterAll(() => removeTokens());
  afterEach(() => wrapper?.unmount());

  const paint = (props: Record<string, unknown>) => {
    wrapper = mount(CuiPanel, { props, attachTo: document.body });
    return getComputedStyle(wrapper.element).backgroundImage;
  };

  it("paints the oklch gradient where the browser supports it", () => {
    expect(CSS.supports("background", "linear-gradient(in oklch shorter hue, red, blue)")).toBe(true);
    expect(paint({ from: "#ff0000", to: "#0000ff" })).toContain("oklch");
  });

  it("paints a gradient layer above the grain, and a flat color has none", () => {
    expect(paint({ from: "#ff0000", to: "#0000ff", smooth: true })).toMatch(/^url\(.*\), linear-gradient\(/);
    wrapper?.unmount();
    expect(paint({ color: "#336699" })).toBe("none");
  });

  it("lets a public token replace the whole background", () => {
    wrapper = mount(CuiPanel, {
      props: { from: "#ff0000", to: "#0000ff" },
      attachTo: document.body,
      attrs: { style: "--cui-panel-bg: rgb(1, 2, 3)" },
    });
    expect(getComputedStyle(wrapper.element).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(wrapper.element).backgroundImage).toBe("none");
  });
});

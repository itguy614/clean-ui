import { describe, it, expect, afterEach } from "vitest";
import { mount, enableAutoUnmount } from "@vue/test-utils";
import CuiPanel from "../CuiPanel.vue";
import CuiBackdrop from "../CuiBackdrop.vue";
import { GRAIN_LAYER } from "../../utils/gradient";

/** The panel's private paint: a raw `style` read keeps jsdom's CSS parser out of the way. */
const prop = (w: ReturnType<typeof mount>, name: string) =>
  (w.element as HTMLElement).style.getPropertyValue(name);

describe("CuiPanel (#406)", () => {
  enableAutoUnmount(afterEach);

  it("renders a div by default and `as` swaps the element, always with the static class", () => {
    expect(mount(CuiPanel).element.tagName).toBe("DIV");
    const w = mount(CuiPanel, { props: { as: "section" }, slots: { default: "hi" } });
    expect(w.element.tagName).toBe("SECTION");
    expect(w.classes()).toContain("cui-panel");
    expect(w.text()).toBe("hi");
  });

  it("paints only the surface color by default", () => {
    const w = mount(CuiPanel);
    expect(prop(w, "--_panel-bg")).toBe("var(--cui-surface-base)");
    expect(prop(w, "--_panel-bg-modern")).toBe("");
    expect(prop(w, "--_panel-radius")).toBe("0");
  });

  it("maps a role color to its token and passes CSS through", () => {
    expect(prop(mount(CuiPanel, { props: { color: "primary" } }), "--_panel-bg")).toBe("var(--cui-primary)");
    expect(prop(mount(CuiPanel, { props: { color: "#123456" } }), "--_panel-bg")).toBe("#123456");
  });

  it("stacks the layers top to bottom: grain, gradient, image, color", () => {
    const w = mount(CuiPanel, {
      props: { from: "primary", to: "info", smooth: true, image: "/hero.png", color: "success" },
    });
    const fallback = prop(w, "--_panel-bg");
    const order = [
      fallback.indexOf("data:image/svg+xml"),
      fallback.indexOf("linear-gradient("),
      fallback.indexOf('url("/hero.png")'),
      fallback.lastIndexOf("var(--cui-success)"),
    ];
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(fallback.endsWith("var(--cui-success)")).toBe(true);
    expect(fallback).not.toContain("oklch");

    const modern = prop(w, "--_panel-bg-modern");
    expect(modern.startsWith(GRAIN_LAYER)).toBe(true);
    expect(modern).toContain("linear-gradient(in oklch shorter hue 180deg, var(--cui-primary), var(--cui-info))");
    expect(modern.endsWith("var(--cui-success)")).toBe(true);
  });

  it("an image alone sits above the color; a gradient alone sits above the default color", () => {
    expect(prop(mount(CuiPanel, { props: { image: "/a.png" } }), "--_panel-bg")).toBe(
      'url("/a.png") center / cover no-repeat, var(--cui-surface-base)',
    );
    expect(prop(mount(CuiPanel, { props: { from: "info", to: "success" } }), "--_panel-bg")).toBe(
      "linear-gradient(180deg, var(--cui-info), var(--cui-success)), var(--cui-surface-base)",
    );
  });

  it("grain only appears with a gradient", () => {
    expect(prop(mount(CuiPanel, { props: { smooth: true } }), "--_panel-bg")).not.toContain("data:image");
    expect(prop(mount(CuiPanel, { props: { smooth: true, from: "info", to: "success" } }), "--_panel-bg")).toContain("data:image");
  });

  it("supports three stops, an angle and the raw `gradient` escape hatch", () => {
    const three = mount(CuiPanel, { props: { from: "primary", via: "success", to: "info", angle: 45 } });
    expect(prop(three, "--_panel-bg")).toContain("linear-gradient(45deg, var(--cui-primary), var(--cui-success), var(--cui-info))");
    const raw = mount(CuiPanel, { props: { gradient: "radial-gradient(red, blue)", from: "primary", to: "info" } });
    expect(prop(raw, "--_panel-bg")).toContain("radial-gradient(red, blue)");
    expect(prop(raw, "--_panel-bg")).not.toContain("--cui-primary");
  });

  it("escapes quotes in the image URL", () => {
    const w = mount(CuiPanel, { props: { image: 'a"b.png' } });
    expect(prop(w, "--_panel-bg")).toContain('url("a\\"b.png")');
  });

  it("takes its radius from the scale", () => {
    expect(prop(mount(CuiPanel, { props: { rounded: "lg" } }), "--_panel-radius")).toBe("var(--cui-radius-lg, 0.5rem)");
    expect(prop(mount(CuiPanel, { props: { rounded: "full" } }), "--_panel-radius")).toBe("9999px");
  });

  it("hides with v-show", () => {
    expect(mount(CuiPanel, { props: { hidden: true } }).isVisible()).toBe(false);
  });

  it("writes no bare paint inline: only private custom properties", () => {
    const w = mount(CuiPanel, { props: { from: "info", to: "success", rounded: "md" } });
    const style = (w.element as HTMLElement).getAttribute("style") ?? "";
    for (const decl of style.split(";").map((d) => d.trim()).filter(Boolean)) {
      expect(decl.startsWith("--_panel-")).toBe(true);
    }
  });
});

describe("CuiBackdrop gradient props (#406)", () => {
  it("adopts from/via/to/angle with an sRGB fallback and an oklch form", () => {
    const w = mount(CuiBackdrop, { props: { from: "primary", via: "success", to: "info", angle: 90 } });
    expect(prop(w, "--_backdrop-bg")).toBe(
      "linear-gradient(90deg, var(--cui-primary), var(--cui-success), var(--cui-info)), black",
    );
    expect(prop(w, "--_backdrop-bg-modern")).toBe(
      "linear-gradient(in oklch shorter hue 90deg, var(--cui-primary), var(--cui-success), var(--cui-info)), black",
    );
  });

  it("keeps the raw `gradient` string working, and it wins", () => {
    const w = mount(CuiBackdrop, { props: { gradient: "linear-gradient(red, blue)", from: "primary", to: "info" } });
    expect(prop(w, "--_backdrop-bg")).toBe("linear-gradient(red, blue), black");
  });

  it("without a gradient, emits no oklch token", () => {
    expect(prop(mount(CuiBackdrop), "--_backdrop-bg-modern")).toBe("");
  });
});

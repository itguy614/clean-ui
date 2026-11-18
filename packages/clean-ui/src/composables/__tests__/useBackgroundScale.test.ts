import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { effectScope } from "vue";
import { useBackgroundScale } from "../useBackgroundScale";
import { __clearWarned } from "../../utils/devWarn";

/**
 * #534 — the page behind a sheet: what is written on the wrapper, what is handed back, who
 * owns the scale when sheets nest, and when nothing is touched. jsdom has no layout or
 * animations, so the timing and the real frames are in the browser test.
 */
function setup(opts: { enabled?: boolean; selector?: string } = {}) {
  const scope = effectScope();
  const bg = scope.run(() => useBackgroundScale({ enabled: () => opts.enabled ?? true, selector: () => opts.selector ?? "[data-cui-drawer-wrapper]" }))!;
  return { bg, scope };
}

function wrapper(style = "") {
  const el = document.createElement("div");
  el.setAttribute("data-cui-drawer-wrapper", "");
  if (style) el.setAttribute("style", style);
  document.body.append(el);
  return el;
}

describe("useBackgroundScale", () => {
  beforeEach(() => {
    __clearWarned();
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("scales the wrapper to 95% with rounded corners on open, and changes nothing else", () => {
    const el = wrapper();
    const { bg } = setup();
    bg.show();
    expect(el.style.transform).toContain("scale(0.95)");
    expect(el.style.borderRadius).toContain("var(--cui-radius-lg");
    expect(el.style.transition).toContain("var(--cui-ease-drawer)");
    expect(el.style.transition).not.toMatch(/ease-in[^-]|all/);
    expect(el.style.overflow).toBe("hidden");
  });

  it("does nothing when disabled, without even looking the wrapper up", () => {
    const el = wrapper();
    const find = vi.spyOn(document, "querySelector");
    const { bg } = setup({ enabled: false });
    bg.show();
    expect(el.getAttribute("style")).toBeNull();
    expect(find).not.toHaveBeenCalled();
  });

  it("warns once in development when nothing matches, and writes nothing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { bg } = setup({ selector: "#nope" });
    bg.show();
    bg.hide();
    bg.show();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]![0]).toContain("#nope");
  });

  it("treats an invalid selector as no match instead of throwing", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { bg } = setup({ selector: "[[" });
    expect(() => bg.show()).not.toThrow();
  });

  it("is off under reduced motion: a scale is movement", () => {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduce"), media: q, addEventListener() {}, removeEventListener() {} }));
    const el = wrapper();
    const { bg } = setup();
    bg.show();
    expect(el.getAttribute("style")).toBeNull();
  });

  it("hands back the wrapper's own inline styles after the exit, not before", () => {
    const el = wrapper("transform: rotate(1deg); border-radius: 3px; overflow: auto; transition: color 1s;");
    const { bg } = setup();
    bg.show();
    bg.hide();
    // Heading back to its size, still with the exit's timing and no leftover scale target.
    expect(el.style.transform).toContain("scale(1)");
    expect(el.style.overflow).toBe("hidden");
    bg.finish();
    expect(el.style.transform).toBe("rotate(1deg)");
    expect(el.style.borderRadius).toBe("3px");
    expect(el.style.overflow).toBe("auto");
    expect(el.style.transition).toBe("color 1s");
    expect(el.style.transformOrigin).toBe("");
  });

  it("restores at once if it unmounts while open, mid-drag included", () => {
    const el = wrapper("opacity: 0.9");
    const { bg, scope } = setup();
    bg.show();
    bg.drag(0.5);
    scope.stop();
    expect(el.getAttribute("style")).toBe("opacity: 0.9;");
  });

  it("follows the drag: 1 at rest, unscaled when gone, with no transition while held", () => {
    const el = wrapper();
    const { bg } = setup();
    bg.show();
    bg.drag(0);
    expect(el.style.transform).toContain("scale(0.95)");
    expect(el.style.transition).toBe("none");
    bg.drag(0.5);
    expect(el.style.transform).toContain("scale(0.975)");
    bg.drag(1);
    expect(el.style.transform).toContain("scale(1)");
  });

  it("a spring-back returns to scaled on its transition; a dismissal stays put for the exit", () => {
    const el = wrapper();
    const { bg } = setup();
    bg.show();
    bg.drag(0.5);
    bg.dragEnd(true);
    expect(el.style.transform).toContain("scale(0.975)");
    expect(el.style.transition).toContain("var(--cui-duration-fast)");

    bg.drag(0.5);
    bg.dragEnd(false);
    expect(el.style.transform).toContain("scale(0.95)");
    expect(el.style.transition).toContain("calc(var(--cui-duration-slow) * 2)");
  });

  it("nested sheets share one scale: the wrapper stays scaled until the last one closes, and only a sole sheet drives it", () => {
    const el = wrapper("opacity: 0.9");
    const a = setup().bg;
    const b = setup().bg;
    a.show();
    b.show();
    b.drag(0.8);
    expect(el.style.transform).toContain("scale(0.95)");
    b.hide();
    b.finish();
    expect(el.style.transform).toContain("scale(0.95)");
    expect(el.style.opacity).toBe("0.9");
    a.drag(0.5);
    expect(el.style.transform).toContain("scale(0.975)");
    a.hide();
    a.finish();
    expect(el.getAttribute("style")).toBe("opacity: 0.9;");
  });

  it("reopening mid-exit scales again rather than restoring", () => {
    const el = wrapper();
    const { bg } = setup();
    bg.show();
    bg.hide();
    bg.show();
    bg.finish();
    expect(el.style.transform).toContain("scale(0.95)");
  });

  it("puts the origin at the top of what is on screen when the page is scrolled", () => {
    const el = wrapper();
    el.getBoundingClientRect = () => ({ top: -300, height: 2000, bottom: 1700, left: 0, right: 0, width: 0, x: 0, y: -300, toJSON() {} });
    const { bg } = setup();
    bg.show();
    expect(el.style.transformOrigin).toBe("50% 300px");
  });

  it("keeps the safe-area inset clear in the top offset", () => {
    const el = wrapper();
    const { bg } = setup();
    bg.show();
    expect(el.style.transform).toContain("env(safe-area-inset-top");
  });
});

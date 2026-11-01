import { describe, it, expect, afterEach } from "vitest";
import { scrollShadowRightStyle, scrollShadowTopStyle, scrollShadowBottomStyle } from "../../composables/useScrollShadows";

/**
 * #125 — the overflow fades are painted rectangles sitting flush inside their scroller, so
 * on a rounded container they square off the corner they cover. The markdown editor's
 * toolbar fade was erasing the control's top-right corner whenever the toolbar overflowed:
 * the border ran along the top, stopped, and picked up again below, leaving a notch.
 *
 * Real browser: `border-radius: inherit` resolving against a parent, and the resulting
 * painted geometry, are things jsdom does not compute.
 */
describe("scroll shadows keep their scroller's corners (real browser)", () => {
  const hosts: HTMLElement[] = [];
  afterEach(() => hosts.splice(0).forEach((h) => h.remove()));

  /** A rounded scroller with one fade inside it, as every consumer arranges them. */
  function scroller(style: Record<string, string>, parentRadius: string) {
    const host = document.createElement("div");
    host.style.cssText = `position: relative; width: 120px; height: 60px; border-radius: ${parentRadius};`;
    const fade = document.createElement("div");
    Object.assign(fade.style, style);
    host.append(fade);
    document.body.append(host);
    hosts.push(host);
    return fade;
  }

  const corners = (el: HTMLElement) => {
    const c = getComputedStyle(el);
    return [c.borderTopLeftRadius, c.borderTopRightRadius, c.borderBottomRightRadius, c.borderBottomLeftRadius];
  };

  it.each([
    ["right", scrollShadowRightStyle],
    ["top", scrollShadowTopStyle],
    ["bottom", scrollShadowBottomStyle],
  ])("the %s fade takes its scroller's radius", (_edge, style) => {
    expect(corners(scroller(style as never, "8px"))).toEqual(["8px", "8px", "8px", "8px"]);
  });

  it("costs nothing where the scroller is square", () => {
    // CuiTable and CuiModalBody share these styles and have no radius of their own.
    expect(corners(scroller(scrollShadowRightStyle as never, "0"))).toEqual(["0px", "0px", "0px", "0px"]);
  });

  it("follows a per-corner radius rather than flattening it", () => {
    // The editor's toolbar rounds only its top corners — it sits at the top of the
    // control, so rounding the bottom pair would notch the fade mid-control.
    const fade = scroller(scrollShadowRightStyle as never, "8px 8px 0 0");
    expect(corners(fade)).toEqual(["8px", "8px", "0px", "0px"]);
  });
});

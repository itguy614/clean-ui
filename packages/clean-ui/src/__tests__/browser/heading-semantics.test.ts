import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import main from "../../styles/main.css?inline";
import { installTokens, mountHosts } from "./helpers";
import CuiCardHeader from "../../components/CuiCardHeader.vue";

/**
 * #129 — `CuiCardHeader` rendered its title as a `<div>`, so a card title was invisible to
 * heading navigation and absent from the document outline. It renders a real heading now.
 *
 * Real browser because the load-bearing half is a cascade question: component title rules
 * are zero-specificity, and `.cui-typography h1–h6` is (0,1,1), so a real heading would
 * take the prose size and margin unless the typography layer skips `cui-*` elements — the
 * same exclusion the prose link rule needed when a solid link button drew its label in its
 * own background colour (#114).
 *
 * The tag-level assertions (default, chosen level, `div` opt-out) need no layout engine and
 * live in `components/__tests__/headingSemantics.test.ts`. Everything here measures.
 */
describe("card titles are headings without being restyled (real browser)", () => {
  let removeTokens: () => void;
  beforeAll(() => {
    removeTokens = installTokens(main);
  });
  afterAll(() => removeTokens());

  const dom = mountHosts();
  afterEach(() => dom.cleanup());

  /** Mount inside a `.cui-typography` scope, which is where the conflict lives. */
  function header(props: Record<string, unknown> = {}, prose = true) {
    const host = dom.host();
    if (prose) host.className = "cui-typography";
    const w = dom.track(
      mount(CuiCardHeader, { props: { title: "Recent activity", ...props }, attachTo: host }),
    );
    return (w.element as HTMLElement).querySelector<HTMLElement>(".cui-card-header__title")!;
  }

  it("is not restyled by the prose heading rules", () => {
    // The whole reason this needed a browser: inside `.cui-typography` an unexcluded h3
    // would take the prose font size and a bottom margin, visibly resizing every card
    // title in the library.
    const inProse = getComputedStyle(header());
    const outside = getComputedStyle(header({}, false));

    expect(inProse.fontSize).toBe(outside.fontSize);
    expect(inProse.marginBottom).toBe(outside.marginBottom);
  });

  it("looks identical whether it is a heading or a div", () => {
    // The change is to the document outline, not to the rendering. A `div` is never
    // matched by the prose rule, so this also catches the UA stylesheet's own h3 margin.
    const heading = getComputedStyle(header());
    const div = getComputedStyle(header({ titleAs: "div" }));

    for (const prop of ["fontSize", "fontWeight", "color", "lineHeight", "marginBottom"] as const) {
      expect(heading[prop], prop).toBe(div[prop]);
    }
  });

  it("leaves ordinary prose headings alone", () => {
    const host = dom.host();
    host.className = "cui-typography";
    host.innerHTML = '<h3 id="prose">Section</h3>';

    const prose = getComputedStyle(host.querySelector("#prose")!);
    expect(parseFloat(prose.marginBottom)).toBeGreaterThan(0);
    expect(prose.fontSize).not.toBe(getComputedStyle(header()).fontSize);
  });
});

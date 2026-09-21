import { describe, it, expect, beforeAll, afterEach } from "vitest";
import preflight from "../../styles/preflight.css?inline";

// #72 — the library used to ship Tailwind's preflight, a page-wide reset, in
// `dist/clean-ui.css`. `styles/preflight.css` replaces it with the same rules
// scoped to `cui-*` subtrees.
//
// The consumer this protects is the one with no safety net: an app that does
// NOT use Tailwind. The docs site can't catch a regression here because it
// imports `tailwindcss` itself, so it has preflight either way — and jsdom has
// no cascade to speak of. So this runs in real Chromium (see vitest.config.ts)
// against a document that has no reset of its own, and asserts both halves:
// the host page keeps its UA defaults, and the library's own subtree still gets
// everything its components assume.
describe("scoped preflight (real browser, no host reset)", () => {
  beforeAll(() => {
    const style = document.createElement("style");
    // Mirror how the stylesheet actually ships: the reset lives in `@layer base`,
    // under the same layer order main.css declares. Injecting it unlayered would
    // make the tests pass while the shipped file behaves differently — an
    // unlayered rule outranks every layered one, so an unlayered reset silently
    // beats a consumer's `@layer utilities`.
    style.textContent = `@layer theme, base, components, utilities;\n@layer base {\n${preflight}\n}`;
    document.head.append(style);
    // A font the UA would never pick for a form control on its own, so
    // `font: inherit` is unambiguous when we look for it below.
    document.body.style.fontFamily = '"Courier New"';
  });

  afterEach(() => {
    document.getElementById("fixture")?.remove();
  });

  function render(html: string): HTMLElement {
    const fixture = document.createElement("div");
    fixture.id = "fixture";
    fixture.innerHTML = html;
    document.body.append(fixture);
    return fixture;
  }

  const styleOf = (el: Element) => getComputedStyle(el);

  it("leaves the host page's elements alone", () => {
    const host = render(`
      <h1 id="heading">Host heading</h1>
      <p id="para">Host paragraph</p>
      <ul id="list"><li>Host item</li></ul>
      <div id="box"></div>
    `);

    // All four are things Tailwind's preflight would have reset out from under
    // a consumer who never asked for it.
    expect(styleOf(host.querySelector("#heading")!).marginBlockStart).not.toBe("0px");
    expect(styleOf(host.querySelector("#para")!).marginBlockStart).not.toBe("0px");
    expect(styleOf(host.querySelector("#list")!).listStyleType).toBe("disc");
    expect(styleOf(host.querySelector("#box")!).boxSizing).toBe("content-box");
  });

  it("applies the reset inside a cui-* subtree", () => {
    const scope = render(`
      <div class="cui-card">
        <h1 id="heading">Scoped heading</h1>
        <ul id="list"><li>Scoped item</li></ul>
        <button id="button">Scoped button</button>
        <div id="box"></div>
      </div>
    `);

    // The component padding/width math assumes border-box everywhere; no
    // component sets it itself.
    expect(styleOf(scope.querySelector(".cui-card")!).boxSizing).toBe("border-box");
    expect(styleOf(scope.querySelector("#box")!).boxSizing).toBe("border-box");

    expect(styleOf(scope.querySelector("#heading")!).marginBlockStart).toBe("0px");
    expect(styleOf(scope.querySelector("#list")!).listStyleType).toBe("none");

    // `font: inherit` on form controls — without it a `.cui-button` renders in
    // the UA's button font instead of the page font.
    expect(styleOf(scope.querySelector("#button")!).fontFamily).toBe('"Courier New"');
  });

  it("loses to a consumer's @layer utilities", () => {
    // The docs site's own left nav caught this: `<nav class="cui-scrollbar">`
    // with `px-3 py-2` links inside it. Layered or not is the whole question —
    // specificity can't save a utility from an unlayered reset.
    const utilities = document.createElement("style");
    utilities.textContent = "@layer utilities { .px-3 { padding-left: 12px; padding-right: 12px; } }";
    document.head.append(utilities);

    const scope = render(`<div class="cui-scrollbar"><a id="link" class="px-3">Nav item</a></div>`);
    expect(styleOf(scope.querySelector("#link")!).paddingLeft).toBe("12px");

    utilities.remove();
  });

  it("keeps specificity at zero so a consumer can still override it", () => {
    const override = document.createElement("style");
    override.textContent = "ul { list-style-type: square; }";
    document.head.append(override);

    const scope = render(`<div class="cui-card"><ul id="list"><li>item</li></ul></div>`);
    expect(styleOf(scope.querySelector("#list")!).listStyleType).toBe("square");

    override.remove();
  });
});

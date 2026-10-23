import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import main from "../../styles/main.css?inline";
import themeCss from "../../styles/theme.css?raw";

/**
 * #329 — a theme class re-themes a subtree, not just the page. The semantic slots
 * (`--cui-primary`, `--cui-surface-bg`, `--cui-text-*`, …) were declared on `:root` only, and
 * a custom property's `var()` resolves where it is declared — so inside
 * `<div class="cui-theme-forest">` the scale changed but every slot kept the page theme's
 * colour, and effectively no component followed the scoped theme.
 *
 * Real browser: a cascade and computed-value question. Each check paints a probe with the
 * slot and another with the scale step it should come from, and compares what they render.
 */
describe("a scoped theme re-themes the semantic slots (real browser)", () => {
  beforeAll(() => {
    const style = document.createElement("style");
    style.id = "cui-tokens";
    style.textContent = main;
    document.head.append(style);
  });
  afterAll(() => document.getElementById("cui-tokens")?.remove());
  afterEach(() => {
    document.getElementById("fixture")?.remove();
    document.getElementById("consumer")?.remove();
    document.documentElement.classList.remove("dark");
  });

  /** The colour a probe paints with `background: <value>`, inside `className`. */
  function paint(value: string, className: string): string {
    const host = document.createElement("div");
    host.id = "fixture";
    host.className = className;
    const probe = document.createElement("div");
    probe.style.background = value;
    host.append(probe);
    document.body.append(host);
    const out = getComputedStyle(probe).backgroundColor;
    host.remove();
    return out;
  }

  it("takes the scoped theme's colours, light mode", () => {
    expect(paint("var(--cui-primary)", "cui-theme-forest")).toBe(paint("var(--color-primary-500)", "cui-theme-forest"));
    expect(paint("var(--cui-surface-bg)", "cui-theme-forest")).toBe(paint("var(--color-surface-100)", "cui-theme-forest"));
    // And it really is a different colour from the page's.
    expect(paint("var(--cui-primary)", "cui-theme-forest")).not.toBe(paint("var(--cui-primary)", ""));
  });

  it("takes the scoped theme's dark colours inside a dark page", () => {
    document.documentElement.classList.add("dark");
    // Dark --cui-surface-bg is surface-800, and primary-text reads the theme too.
    expect(paint("var(--cui-surface-bg)", "cui-theme-forest")).toBe(paint("var(--color-surface-800)", "cui-theme-forest"));
    // Dark --cui-primary is primary-200: the theme's own step, not the page's.
    expect(paint("var(--cui-primary)", "cui-theme-forest")).toBe(paint("var(--color-primary-200)", "cui-theme-forest"));
    expect(paint("var(--cui-primary)", "cui-theme-forest")).not.toBe(paint("var(--cui-primary)", ""));
  });

  it("takes the dark colours on a theme element that is itself dark", () => {
    expect(paint("var(--cui-surface-bg)", "cui-theme-forest dark")).toBe(paint("var(--color-surface-800)", "cui-theme-forest dark"));
  });

  it("re-themes the text colours too", () => {
    expect(paint("var(--cui-text-body)", "cui-theme-forest")).toBe(paint("var(--color-surface-900)", "cui-theme-forest"));
  });

  it("still lets a consumer override a slot on the themed element itself, in either mode", () => {
    const style = document.createElement("style");
    style.id = "consumer";
    style.textContent = ".my-box { --cui-primary: rgb(1, 2, 3); }";
    // Removed in afterEach, so a failing assertion can't leak it into the next test.
    document.head.append(style);
    expect(paint("var(--cui-primary)", "my-box cui-theme-forest")).toBe("rgb(1, 2, 3)");
    document.documentElement.classList.add("dark");
    expect(paint("var(--cui-primary)", "my-box cui-theme-forest")).toBe("rgb(1, 2, 3)");
  });

  it("doesn't reset a slot that doesn't read the scale", () => {
    // A container's own value for a constant slot reaches through a theme scope.
    const style = document.createElement("style");
    style.id = "consumer";
    style.textContent = ".panel { --cui-error-focus-ring: rgb(4, 5, 6); }";
    document.head.append(style);
    const host = document.createElement("div");
    host.id = "fixture";
    host.className = "panel";
    host.innerHTML = '<div class="cui-theme-forest"><div id="p" style="background: var(--cui-error-focus-ring)"></div></div>';
    document.body.append(host);
    expect(getComputedStyle(document.getElementById("p")!).backgroundColor).toBe("rgb(4, 5, 6)");
  });

  it("gives a dark element inside a light themed subtree the theme's dark colours", () => {
    const host = document.createElement("div");
    host.id = "fixture";
    host.className = "cui-theme-forest";
    host.innerHTML = '<div class="dark"><div id="slot" style="background: var(--cui-surface-bg)"></div><div id="scale" style="background: var(--color-surface-800)"></div></div>';
    document.body.append(host);
    const bg = (id: string) => getComputedStyle(document.getElementById(id)!).backgroundColor;
    expect(bg("slot")).toBe(bg("scale"));
    expect(bg("slot")).not.toBe(paint("var(--cui-surface-bg)", "dark")); // forest's, not navy's
  });

  it("leaves a subtree without a theme class on the page's", () => {
    expect(paint("var(--cui-primary)", "some-container")).toBe(paint("var(--cui-primary)", ""));
  });

  // #330 — three slots still kept Navy inside a scoped theme, and nothing could switch a
  // subtree back to Navy.
  /** The colour a probe paints inside `inner`, inside `outer`. */
  function paintNested(value: string, outer: string, inner: string): string {
    const host = document.createElement("div");
    host.id = "fixture";
    host.className = outer;
    const scope = document.createElement("div");
    scope.className = inner;
    const probe = document.createElement("div");
    probe.style.background = value;
    scope.append(probe);
    host.append(scope);
    document.body.append(host);
    const out = getComputedStyle(probe).backgroundColor;
    host.remove();
    return out;
  }

  /** Navy's own step, as theme.css's `@theme` declares it. */
  const navyStep = (role: string, step: number) => paint(new RegExp(`--color-${role}-${step}:\\s*([^;]+);`).exec(themeCss)![1], "");

  it.each(["cui-theme-default", "cui-theme-navy"])("switches a subtree back to Navy with %s", (navy) => {
    expect(paintNested("var(--cui-primary)", "cui-theme-forest", navy)).toBe(navyStep("primary", 500));
    expect(paintNested("var(--cui-surface-bg)", "cui-theme-forest", navy)).toBe(navyStep("surface", 100));
    expect(paintNested("var(--cui-primary)", "cui-theme-forest", navy)).not.toBe(paint("var(--cui-primary)", "cui-theme-forest"));
  });

  it("tints tertiary text with the scoped theme's own surface", () => {
    expect(paint("var(--cui-text-tertiary)", "cui-theme-forest")).not.toBe(paint("var(--cui-text-tertiary)", ""));
    expect(paint("var(--cui-text-tertiary)", "cui-theme-forest")).toBe(
      paint("color-mix(in oklab, var(--color-surface-600) 42%, var(--color-surface-700))", "cui-theme-forest"),
    );
  });
});

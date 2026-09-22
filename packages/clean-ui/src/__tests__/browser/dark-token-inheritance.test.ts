import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import main from "../../styles/main.css?inline";

/**
 * #121 — dark-mode tokens must be declared on the element carrying `dark`, not
 * on every element below it. See the "Color System" notes in CLAUDE.md for the
 * full rationale.
 *
 * Real browser: this is entirely about the cascade and about what
 * `getComputedStyle` resolves, neither of which jsdom models.
 *
 * `main.css?inline`, whose `@import`s Vite has already inlined, so this brings
 * `themes.css` with it. Source stylesheets, not the built one — these are plain
 * CSS, so the test needs no prior build.
 */
describe("dark-mode tokens inherit (real browser)", () => {
  beforeAll(() => {
    const style = document.createElement("style");
    style.id = "cui-tokens";
    style.textContent = main;
    document.head.append(style);
  });

  afterAll(() => document.getElementById("cui-tokens")?.remove());
  afterEach(() => document.getElementById("fixture")?.remove());

  /** A three-level fixture; `innerClass` goes on the middle node. */
  function tree(className: string, innerClass = "") {
    const host = document.createElement("div");
    host.id = "fixture";
    host.className = className;
    const child = document.createElement("div");
    child.className = innerClass;
    const grandchild = document.createElement("div");
    child.append(grandchild);
    host.append(child);
    document.body.append(host);
    return { host, child, grandchild };
  }

  const token = (el: Element, prop: string) =>
    getComputedStyle(el).getPropertyValue(prop).trim();

  /** Read a token under `className`, then tear the fixture down again. */
  function tokenFor(prop: string, className: string, innerClass = "") {
    const { host, grandchild } = tree(className, innerClass);
    const value = token(grandchild, prop);
    host.remove();
    return value;
  }

  it("lets a subtree re-declare a text token, and it inherits", () => {
    const { child, grandchild } = tree("dark");
    child.style.setProperty("--cui-text-body", "rgb(1, 2, 3)");

    // The reported bug: the library re-declared the token on the grandchild too,
    // so the override stopped at exactly one level.
    expect(token(grandchild, "--cui-text-body")).toBe("rgb(1, 2, 3)");
  });

  it("still applies dark values when nothing overrides them", () => {
    // The guard on the fix: scoping to the root must not stop dark mode working.
    const dark = tokenFor("--cui-text-body", "dark");

    expect(dark).not.toBe("");
    expect(dark).not.toBe(tokenFor("--cui-text-body", ""));
  });

  describe("a theme class and the dark class on the same element", () => {
    // `useTheme` puts the theme class on document.documentElement, which is
    // where `dark` normally goes too — so this is the ordinary arrangement, not
    // an edge case. Neither old selector matched it: one wanted the theme nested
    // inside dark, the other wanted dark nested inside the theme.
    it("gives the themed element the same surface values as its descendants", () => {
      const { host, child, grandchild } = tree("dark cui-theme-forest");
      const hostValue = token(host, "--color-surface-50");

      expect(hostValue).not.toBe("");
      expect(token(child, "--color-surface-50")).toBe(hostValue);
      expect(token(grandchild, "--color-surface-50")).toBe(hostValue);
    });

    it("gives it the dark values, not the light ones", () => {
      expect(tokenFor("--color-surface-50", "dark cui-theme-forest")).not.toBe(
        tokenFor("--color-surface-50", "cui-theme-forest"),
      );
    });
  });

  describe("the dark class on the document root", () => {
    // Where `dark` actually lands in an app: `useTheme` and every dark-mode
    // toggle put it on <html>. That is also the element `:root` selects, and
    // the LIGHT tokens are declared on `:root` — so a zero-specificity
    // `:where(.dark)` loses the tie and the page renders light. The blanket
    // `.dark *` form hid this, because it matched <body> and below, where
    // `:root` cannot reach. Every other fixture here hangs off a <div>, so
    // none of them can see it.
    afterEach(() => document.documentElement.classList.remove("dark", "cui-theme-forest"));

    // `--cui-success-muted` because both its light and its dark value are
    // literal colors. The tokens defined as `var(--color-*)` resolve to the
    // empty string here: this test injects the raw stylesheets, so the Tailwind
    // `@theme` block that would define the scale is never processed.
    const MUTED = "--cui-success-muted";

    it("beats the light tokens declared on :root", () => {
      const { host } = tree("");
      const lightValue = token(host, MUTED);

      document.documentElement.classList.add("dark");
      const darkValue = token(host, MUTED);

      expect(lightValue).not.toBe("");
      expect(darkValue).not.toBe(lightValue);
      expect(token(document.documentElement, MUTED)).toBe(darkValue);
    });

    it("lets a theme class on that same root win over the default dark values", () => {
      document.documentElement.classList.add("dark");
      const { host } = tree("");
      const defaultDark = token(host, "--color-surface-50");

      document.documentElement.classList.add("cui-theme-forest");
      const themedDark = token(host, "--color-surface-50");

      expect(themedDark).not.toBe("");
      expect(themedDark).not.toBe(defaultDark);
    });
  });

  it.each([
    ["dark outside the theme", "dark", "cui-theme-forest"],
    ["the theme outside dark", "cui-theme-forest", "dark"],
  ])("applies themed dark values with %s", (_label, outer, inner) => {
    const themed = tokenFor("--color-surface-50", outer, inner);

    expect(themed).not.toBe("");
    expect(themed, "the forest tint should differ from the default theme").not.toBe(
      tokenFor("--color-surface-50", "dark"),
    );
  });
});

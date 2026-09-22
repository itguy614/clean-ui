import { describe, it, expect, beforeAll, afterEach } from "vitest";
import themes from "../../styles/themes.css?inline";
import main from "../../styles/main.css?inline";

/**
 * #121 — the dark-mode token blocks were declared under
 * `:where(.dark, .dark *)`, i.e. on *every element* in the subtree rather than
 * on the scoping root. Custom properties inherit, so an ancestor re-declaring a
 * token should retheme everything below it — but the library re-declared each
 * token on every descendant, overriding the ancestor on each one. A light
 * surface inside a dark panel could only be themed by mirroring the library's
 * own blanket selector.
 *
 * Real browser: this is entirely about the cascade and about what
 * `getComputedStyle` resolves, neither of which jsdom models.
 *
 * Source stylesheets, not the built one — these files are plain CSS, so the
 * test needs no prior build.
 */
describe("dark-mode tokens inherit (real browser)", () => {
  beforeAll(() => {
    const style = document.createElement("style");
    style.id = "cui-tokens";
    style.textContent = `${main}\n${themes}`;
    document.head.append(style);
  });

  afterEach(() => document.getElementById("fixture")?.remove());

  function tree(className: string) {
    const host = document.createElement("div");
    host.id = "fixture";
    host.className = className;
    const child = document.createElement("div");
    const grandchild = document.createElement("div");
    child.append(grandchild);
    host.append(child);
    document.body.append(host);
    return { host, child, grandchild };
  }

  const token = (el: Element, prop: string) =>
    getComputedStyle(el).getPropertyValue(prop).trim();

  it("lets a subtree re-declare a text token, and it inherits", () => {
    const { child, grandchild } = tree("dark");
    child.style.setProperty("--cui-text-body", "rgb(1, 2, 3)");

    expect(token(child, "--cui-text-body")).toBe("rgb(1, 2, 3)");
    // The reported bug: the library re-declared the token on the grandchild too,
    // so the override stopped at exactly one level.
    expect(token(grandchild, "--cui-text-body")).toBe("rgb(1, 2, 3)");
  });

  it("still applies dark values when nothing overrides them", () => {
    // The guard on the fix: scoping to the root must not stop dark mode working.
    const dark = tree("dark");
    const darkValue = token(dark.grandchild, "--cui-text-body");
    dark.host.remove();

    const light = tree("");
    expect(darkValue).not.toBe("");
    expect(darkValue).not.toBe(token(light.grandchild, "--cui-text-body"));
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
      const dark = tree("dark cui-theme-forest");
      const darkValue = token(dark.host, "--color-surface-50");
      dark.host.remove();

      const light = tree("cui-theme-forest");
      expect(darkValue).not.toBe(token(light.host, "--color-surface-50"));
    });
  });

  describe("the dark class on the document root", () => {
    // Where `dark` actually lands in an app: `useTheme` and every dark-mode
    // toggle put it on <html>. That is also the element `:root` selects, and
    // the LIGHT tokens are declared on `:root` — so a zero-specificity
    // `:where(.dark)` loses the tie and the page renders light. The blanket
    // `.dark *` form hid this, because it matched <body> and below, which
    // `:root` cannot reach. Every other fixture here hangs off a <div>, so
    // none of them can see it.
    afterEach(() => document.documentElement.classList.remove("dark"));

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
      document.documentElement.classList.remove("cui-theme-forest");

      expect(themedDark).not.toBe("");
      expect(themedDark).not.toBe(defaultDark);
    });
  });

  it.each([
    ["dark outside the theme", "dark", "cui-theme-forest"],
    ["the theme outside dark", "cui-theme-forest", "dark"],
  ])("applies themed dark values with %s", (_label, outer, inner) => {
    const host = document.createElement("div");
    host.id = "fixture";
    host.className = outer;
    const nested = document.createElement("div");
    nested.className = inner;
    const leaf = document.createElement("div");
    nested.append(leaf);
    host.append(nested);
    document.body.append(host);

    const themed = token(leaf, "--color-surface-50");
    host.remove();

    const plainDark = tree("dark");
    expect(themed).not.toBe("");
    expect(themed, "the forest tint should differ from the default theme").not.toBe(
      token(plainDark.grandchild, "--color-surface-50"),
    );
  });
});

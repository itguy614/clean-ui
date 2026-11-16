import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * #513 — the frosted bar's solid fallbacks live in conditional at-rules a unit test can't
 * trigger (no `prefers-reduced-transparency` or `forced-colors` emulation, and every browser
 * under test supports `backdrop-filter`), so they are asserted on the stylesheet: each one
 * restores the solid background, and the two preference queries also drop the blur.
 */
const source = readFileSync(resolve(__dirname, "../../components/CuiNavbar.vue"), "utf8");
const style = source.slice(source.indexOf("<style"));

/** The body of the at-rule that opens with `header`. */
function block(header: string): string {
  const at = style.indexOf(header);
  expect(at, `${header} missing`).toBeGreaterThan(-1);
  const open = style.indexOf("{", at);
  let depth = 0;
  for (let i = open; i < style.length; i++) {
    if (style[i] === "{") depth++;
    if (style[i] === "}" && --depth === 0) return style.slice(open + 1, i);
  }
  throw new Error("unbalanced");
}

describe("CuiNavbar translucent fallbacks", () => {
  it("mixes the background with transparent, not an alpha channel on a var()", () => {
    expect(style).toMatch(/color-mix\(in srgb, var\(--cui-navbar-bg, var\(--cui-surface-base\)\) 80%, transparent\)/);
    expect(style).not.toMatch(/oklch\([^)]*var\(/);
  });

  it("reads the blur from the public token over a private default of 8px", () => {
    expect(style).toContain("--_navbar-blur: 8px");
    expect(style).toContain("blur(var(--cui-navbar-blur, var(--_navbar-blur)))");
  });

  it("goes solid where backdrop-filter is unsupported", () => {
    expect(style).toContain("@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))");
    const rule = block("@supports not");
    expect(rule).toMatch(/background:\s*var\(--cui-navbar-bg, var\(--cui-surface-base\)\)/);
  });

  it("goes solid, with no blur, under prefers-reduced-transparency and in forced-colors mode", () => {
    const at = style.indexOf("@media (prefers-reduced-transparency: reduce)");
    expect(at).toBeGreaterThan(-1);
    expect(style.slice(at, style.indexOf("{", at))).toContain("(forced-colors: active)");
    const rule = block("@media (prefers-reduced-transparency: reduce)");
    expect(rule).toMatch(/background:\s*var\(--cui-navbar-bg, var\(--cui-surface-base\)\)/);
    expect(rule).toMatch(/backdrop-filter:\s*none/);
  });

  it("adds no motion for it", () => {
    expect(style).not.toMatch(/transition:[^;]*(backdrop|background)/);
  });
});

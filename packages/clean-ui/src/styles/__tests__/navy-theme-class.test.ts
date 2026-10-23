import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * #330 — `.cui-theme-default` / `.cui-theme-navy` restate the default scale as a class, so a
 * subtree inside another theme can switch back. The default itself is single-sourced in
 * theme.css (`@theme`) and themes.css's `:root.dark` block; this holds the class's copy to it.
 */
const styles = resolve(__dirname, "..");
const theme = readFileSync(resolve(styles, "theme.css"), "utf8");
const themes = readFileSync(resolve(styles, "themes.css"), "utf8");

const steps = (css: string, role: string) =>
  Object.fromEntries([...css.matchAll(new RegExp(`--color-${role}-(\\d+):\\s*([^;]+);`, "g"))].map((m) => [m[1], m[2].trim()]));
const block = (selector: string) => {
  const start = themes.indexOf(selector);
  expect(start, `${selector} in themes.css`).toBeGreaterThan(-1);
  return themes.slice(start, themes.indexOf("}", start));
};

describe("the Navy theme class", () => {
  it("carries theme.css's default primary and surface scales", () => {
    const navy = block(".cui-theme-default,\n.cui-theme-navy {");
    expect(steps(navy, "primary")).toEqual(steps(theme, "primary"));
    expect(steps(navy, "surface")).toEqual(steps(theme, "surface"));
  });

  it("carries the default dark surfaces", () => {
    const navyDark = block(".dark .cui-theme-default,");
    const rootDark = block(":root.dark,\n.dark {");
    expect(steps(navyDark, "surface")).toEqual(steps(rootDark, "surface"));
  });
});

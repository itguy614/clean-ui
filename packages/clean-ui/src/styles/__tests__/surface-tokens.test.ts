import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return entry === "__tests__" ? [] : walk(path);
    return [path];
  });
}

/**
 * #210 — a component reaching for a raw surface step (`var(--color-surface-100)`) instead
 * of the semantic slot has to restate it for dark mode as well, as a second `.dark` rule;
 * sixteen rules across twelve components and the editor's stylesheet did, for neutral hover and active fills `--cui-surface-bg` / `--cui-surface-dark-bg`
 * already provide. The slots resolve per mode and per theme scope (#329), so a component
 * that uses them needs no dark rule at all.
 *
 * A component may still read the raw scale where no slot has the values it needs — each one
 * listed below, with why. The list is checked both ways.
 */
const EXEMPT: Record<string, string> = {
  "clean-ui/src/components/CuiCodeBlock.vue": "a deliberately always-dark surface, the same in both modes",
  "clean-ui/src/components/CuiTooltip.vue": "an inverted surface (dark in light mode) that no neutral slot describes",
  "clean-ui/src/components/CuiTable.vue": "the stripe and row-hover fills: 50 / 800 at half strength, 100 / 700 at half strength — no slot pair",
  "clean-ui/src/components/CuiPagination.vue": "the hover border, 300 / 600 — no slot pair",
};

const PACKAGES = resolve(__dirname, "../../../..");
const files = ["clean-ui", "clean-ui-editor"]
  .flatMap((pkg) => walk(resolve(PACKAGES, pkg, "src")))
  .filter((f) => /\.(vue|css)$/.test(f));
const where = (f: string) => relative(PACKAGES, f).split(sep).join("/");
const readsRawSurface = (f: string) => /var\(--color-surface-\d+/.test(readFileSync(f, "utf-8"));

describe("components use the neutral slots, not the raw surface scale (#210)", () => {
  it("reads the surface scale only where an exemption says why", () => {
    // The library's own stylesheets define the scale and the slots, so they read it by design.
    const offenders = files
      .filter((f) => !where(f).startsWith("clean-ui/src/styles/"))
      .filter(readsRawSurface)
      .map(where)
      .filter((f) => !(f in EXEMPT));
    expect(offenders).toEqual([]);
  });

  it("keeps the exemption list honest", () => {
    const stale = Object.keys(EXEMPT).filter((path) => !files.some((f) => where(f) === path && readsRawSurface(f)));
    expect(stale).toEqual([]);
  });
});

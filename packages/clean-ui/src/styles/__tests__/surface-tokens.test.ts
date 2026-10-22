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
/** File → how many raw surface steps it may hold, and why. A count, so a new one in an exempt file still fails. */
const EXEMPT: Record<string, { count: number; why: string }> = {
  "clean-ui/src/components/CuiCodeBlock.vue": { count: 6, why: "a deliberately always-dark surface, the same in both modes" },
  "clean-ui/src/components/CuiTooltip.vue": { count: 3, why: "an inverted surface (dark in light mode) that no neutral slot describes" },
};

const PACKAGES = resolve(__dirname, "../../../..");
// Every workspace package, so a new satellite is covered without anyone listing it.
const files = readdirSync(PACKAGES)
  .filter((pkg) => statSync(join(PACKAGES, pkg, "src"), { throwIfNoEntry: false })?.isDirectory())
  .flatMap((pkg) => walk(join(PACKAGES, pkg, "src")))
  .filter((f) => /\.(vue|css|ts)$/.test(f) && !/\.test(-d)?\.ts$/.test(f));
const where = (f: string) => relative(PACKAGES, f).split(sep).join("/");
const rawSurfaceCount = (f: string) => (readFileSync(f, "utf-8").match(/var\(--color-surface-\d+/g) ?? []).length;

describe("components use the neutral slots, not the raw surface scale (#210)", () => {
  it("reads the surface scale only where an exemption says why", () => {
    // The library's own stylesheets define the scale and the slots, so they read it by design.
    const offenders = files
      .filter((f) => !where(f).startsWith("clean-ui/src/styles/"))
      .map((f) => ({ path: where(f), count: rawSurfaceCount(f) }))
      .filter(({ path, count }) => count > (EXEMPT[path]?.count ?? 0))
      .map(({ path, count }) => `${path}: ${count}`);
    expect(offenders).toEqual([]);
  });

  it("keeps the exemption list honest", () => {
    const stale = Object.entries(EXEMPT)
      .filter(([path, { count }]) => !files.some((f) => where(f) === path && rawSurfaceCount(f) === count))
      .map(([path]) => path);
    expect(stale).toEqual([]);
  });
});

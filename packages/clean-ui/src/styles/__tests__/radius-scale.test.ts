import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { sourceFiles, where } from "./css-helpers";

// #201: CLAUDE.md called it "the shared radiusMap", but there was no shared definition —
// twelve components each declared the same literal. RADIUS_SCALE in utils/sizing.ts is
// the one copy; this keeps new components from growing a thirteenth. Every package's
// components, the editor's included (#228).
describe("rounded scale", () => {
  // Reasons, per preflight.test.ts. A stale exemption fails too.
  const EXEMPT: Record<string, string> = {
    "CuiSkeleton.vue": "its own scale: fixed md/lg values, a SkeletonRounded type",
  };

  // A map by its usual names, or — whatever it is called — the scale's `md` value, which
  // only a copied map writes out in script.
  const LOCAL_MAP = /const\s+radiusMap\b|Record<\s*CuiRounded\s*,|var\(\s*--cui-button-radius\s*,\s*var\(\s*--cui-radius-md\s*,\s*0\.375rem\s*\)\s*\)/;

  it("no component declares its own radius map", () => {
    const offenders = sourceFiles(/\.vue$/)
      .filter((f) => LOCAL_MAP.test(readFileSync(f, "utf8").split("</script>")[0]))
      .map((f) => basename(f));
    expect(offenders.filter((f) => !(f in EXEMPT))).toEqual([]);
    expect(Object.keys(EXEMPT).filter((f) => !offenders.includes(f))).toEqual([]);
  });

  // #228 — the editor's control fell back to `var(--cui-button-radius, 0.375rem)` while its
  // toolbar, inside it, used the scale's full `md` form. A consumer who set only
  // `--cui-radius-md` rounded the toolbar's corners and not the control's: a notch where they
  // meet (#125's shape). Every read of the token falls back the same way — through
  // `--cui-radius-md` — or through a component's own private token, which does.
  it("every --cui-button-radius fallback goes through --cui-radius-md", () => {
    const offenders = sourceFiles(/\.(vue|css|ts)$/).flatMap((f) =>
      buttonRadiusReads(readFileSync(f, "utf8"))
        .filter((read) => !/^var\(\s*--cui-button-radius\s*,\s*var\(\s*(--cui-radius-md\s*,|--_)/.test(read))
        .map((read) => `${where(f)}: ${read}`),
    );
    expect(offenders).toEqual([]);
  });
});

/** Each `var(--cui-button-radius…)` expression in `source`, whole — to its own closing paren. */
function buttonRadiusReads(source: string): string[] {
  return [...source.matchAll(/var\(\s*--cui-button-radius\b/g)].map((m) => {
    let depth = 0;
    for (let i = m.index!; i < source.length; i++) {
      if (source[i] === "(") depth++;
      else if (source[i] === ")" && --depth === 0) return source.slice(m.index, i + 1);
    }
    return source.slice(m.index);
  });
}

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// #201: CLAUDE.md called it "the shared radiusMap", but there was no shared definition —
// twelve components each declared the same literal. RADIUS_SCALE in utils/sizing.ts is
// the one copy; this keeps new components from growing a thirteenth.
describe("rounded scale", () => {
  // Reasons, per preflight.test.ts. A stale exemption fails too.
  const EXEMPT: Record<string, string> = {
    "CuiSkeleton.vue": "its own scale: fixed md/lg values, a SkeletonRounded type",
  };

  // A map by its usual names, or — whatever it is called — the scale's `md` value, which
  // only a copied map writes out in script.
  const LOCAL_MAP = /const\s+radiusMap\b|Record<\s*CuiRounded\s*,|var\(--cui-button-radius, var\(--cui-radius-md, 0\.375rem\)\)/;

  it("no component declares its own radius map", () => {
    const dir = join(dirname(fileURLToPath(import.meta.url)), "../../components");
    const offenders = readdirSync(dir).filter(
      (f) => f.endsWith(".vue") && LOCAL_MAP.test(readFileSync(join(dir, f), "utf8").split("</script>")[0]),
    );
    expect(offenders.filter((f) => !(f in EXEMPT))).toEqual([]);
    expect(Object.keys(EXEMPT).filter((f) => !offenders.includes(f))).toEqual([]);
  });
});

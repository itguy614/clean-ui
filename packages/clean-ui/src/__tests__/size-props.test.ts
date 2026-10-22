import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { script } from "../styles/__tests__/css-helpers";

// #217: five components typed `size` as `"sm" | "md" | "lg"`, so a size-forwarding wrapper
// could not pass them `xs` or `xl`. A `size` is the flat `CuiSize` — from `SizeableProps`,
// narrowed inside with `clampSize()` — unless it means something else entirely.
describe("size props", () => {
  // Reasons, per preflight.test.ts. A stale exemption fails too.
  const EXEMPT: Record<string, string> = {
    "CuiIcon.vue": "IconSize: a CuiSize or any CSS length",
    "CuiModal.vue": "a width preset, or any CSS width",
    "CuiSlideover.vue": "a width preset, or any CSS width",
    "CuiSkeleton.vue": "a raw CSS dimension",
    "CuiSpacer.vue": "a spacing-scale step",
  };

  it("every component's size prop is CuiSize", () => {
    const dir = join(dirname(fileURLToPath(import.meta.url)), "../components");
    const offenders = readdirSync(dir).filter((f) => {
      if (!f.endsWith(".vue")) return false;
      const src = script(readFileSync(join(dir, f), "utf8"));
      return [...src.matchAll(/^\s+size\?:\s*([^;]+);/gm)].some(([, type]) => type.trim() !== "CuiSize");
    });
    expect(offenders.filter((f) => !(f in EXEMPT))).toEqual([]);
    expect(Object.keys(EXEMPT).filter((f) => !offenders.includes(f))).toEqual([]);
  });
});

import { describe, it, expect } from "vitest";
import { INPUT_SIZE_SCALE, BUTTON_SIZE_SCALE, SIZE_ORDER, nestedSize, scaleControlHeight } from "../sizing";

/**
 * The shared scales are a deliberate set of numbers that every form control inherits, so
 * changing one is a library-wide visual change. The alignment tests in
 * `__tests__/browser/form-control-alignment.test.ts` only compare controls to each other —
 * they all read from here, so moving a value moves them together and nothing fails. These
 * pin the values themselves.
 */
describe("INPUT_SIZE_SCALE", () => {
  /**
   * Rebalanced in #123/#124: `md` was 1rem (16px), equal to its own font size, which read
   * as a lot of dead space beside a short value. The whole curve moved rather than `md`
   * alone, which would have made `md` identical to `sm`.
   */
  it("has a monotonic horizontal padding curve", () => {
    // Pinning the exact strings IS the assertion — the alignment tests compare controls to
    // each other, so an absolute move of the whole scale passes every one of them.
    expect(SIZE_ORDER.map((s) => INPUT_SIZE_SCALE[s].px)).toEqual([
      "calc(0.5rem * var(--cui-density-scale, 1))",
      "calc(0.625rem * var(--cui-density-scale, 1))",
      "calc(0.75rem * var(--cui-density-scale, 1))",
      "calc(0.875rem * var(--cui-density-scale, 1))",
      "calc(1rem * var(--cui-density-scale, 1))",
    ]);
  });

  it("floors every height at the shared minimum target", () => {
    for (const size of SIZE_ORDER) {
      expect(INPUT_SIZE_SCALE[size].height).toContain("--cui-control-min-target");
    }
  });

  it("covers the full size range, so a form control never has to clamp", () => {
    expect(Object.keys(INPUT_SIZE_SCALE).sort()).toEqual([...SIZE_ORDER].sort());
  });
});

describe("nestedSize", () => {
  it("steps down one size", () => {
    expect(nestedSize("xl")).toBe("lg");
    expect(nestedSize("lg")).toBe("md");
    expect(nestedSize("md")).toBe("sm");
    expect(nestedSize("sm")).toBe("xs");
  });

  it("bottoms out at xs rather than running off the scale", () => {
    expect(nestedSize("xs")).toBe("xs");
  });
});

describe("scaleControlHeight", () => {
  it("is overridable and defaults to the WCAG 2.5.8 minimum", () => {
    expect(scaleControlHeight("2.5rem")).toBe(
      "max(var(--cui-control-min-target, 24px), calc(2.5rem * var(--cui-density-scale, 1)))",
    );
  });
});

describe("BUTTON_SIZE_SCALE", () => {
  // Buttons were not rebalanced: their padding is around a label, not an indent before a
  // value, so the two scales legitimately differ. Pinned so that stays a decision.
  it("keeps its own horizontal padding, unchanged by the input rebalance", () => {
    expect(BUTTON_SIZE_SCALE.md.px).toBe("calc(1rem * var(--cui-density-scale, 1))");
  });
});

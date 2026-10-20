import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { computeDropdownPosition, OVERLAY_Z_INDEX } from "../position";

/** An anchor at the given viewport rect; the viewport is 1000×800. */
function anchorAt(rect: { top: number; left: number; width: number; height: number }) {
  const el = document.createElement("button");
  el.getBoundingClientRect = () =>
    ({ ...rect, bottom: rect.top + rect.height, right: rect.left + rect.width, x: rect.left, y: rect.top, toJSON: () => ({}) }) as DOMRect;
  return el;
}

describe("computeDropdownPosition", () => {
  const { innerWidth, innerHeight } = window;
  afterAll(() => Object.assign(window, { innerWidth, innerHeight }));
  beforeEach(() => {
    window.innerWidth = 1000;
    window.innerHeight = 800;
  });

  it("opens below with the gap, and bounds the height by the room there", () => {
    const { styles, side } = computeDropdownPosition(anchorAt({ top: 100, left: 50, width: 200, height: 30 }));
    expect(side).toBe("bottom");
    expect(styles).toMatchObject({ position: "fixed", zIndex: OVERLAY_Z_INDEX, top: "134px", left: "50px", maxHeight: "400px" });
  });

  it("flips up when below is short and above is roomier, and reports the side", () => {
    const { styles, side } = computeDropdownPosition(anchorAt({ top: 700, left: 50, width: 200, height: 30 }), "bottom", { maxHeight: 300 });
    expect(side).toBe("top");
    expect(styles.bottom).toBe("104px");
    expect(styles.top).toBeUndefined();
    expect(styles.maxHeight).toBe("300px");
  });

  it("matchWidth takes the anchor's width and left edge, even near the right edge", () => {
    const { styles } = computeDropdownPosition(anchorAt({ top: 100, left: 900, width: 90, height: 30 }), "bottom", { matchWidth: true });
    expect(styles).toMatchObject({ left: "900px", width: "90px" });
    expect(styles.right).toBeUndefined();
  });

  it("without matchWidth, aligns right edges near the right of the viewport", () => {
    const { styles } = computeDropdownPosition(anchorAt({ top: 100, left: 900, width: 90, height: 30 }));
    expect(styles.right).toBe("10px");
    expect(styles.left).toBeUndefined();
  });

  // CuiSelect's own copy had no clamp, so a field with no room emitted a negative max-height (#204).
  it("clamps max-height at 0 for an anchor with no room on either side", () => {
    window.innerHeight = 20;
    const { styles } = computeDropdownPosition(anchorAt({ top: 0, left: 0, width: 100, height: 20 }), "bottom", { matchWidth: true });
    expect(styles.maxHeight).toBe("0px");
  });

  it("places side panels beside the anchor and flips them at the edge", () => {
    const right = computeDropdownPosition(anchorAt({ top: 100, left: 100, width: 100, height: 30 }), "right");
    expect(right.side).toBe("right");
    expect(right.styles).toMatchObject({ top: "100px", left: "204px" });

    const flipped = computeDropdownPosition(anchorAt({ top: 100, left: 850, width: 100, height: 30 }), "right");
    expect(flipped.side).toBe("left");
    expect(flipped.styles.right).toBe("154px");
  });
});

// The overlay z-index scale derives from one token; a bare literal drifts (9990 alone was in
// seven places) and doesn't move when a consumer re-layers the library.
describe("overlay z-index", () => {
  it("is never a bare 99xx outside utils/position.ts — inline or in a stylesheet", () => {
    const src = join(dirname(fileURLToPath(import.meta.url)), "../..");
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== "__tests__") walk(path);
        } else if (/\.(vue|ts|css)$/.test(entry.name) && !path.endsWith(join("utils", "position.ts"))) {
          // A bare literal, not the token's own fallback inside var(--cui-z-overlay, 9990).
          if (/z-?index\s*:\s*["'`]?99\d\d/i.test(readFileSync(path, "utf8"))) offenders.push(path.slice(src.length + 1));
        }
      }
    };
    walk(src);
    // The layout debug overlays stack their labels by nesting depth (9999 - depth): a
    // developer aid, not part of the overlay scale.
    const exempt = ["components/CuiGrid.vue", "components/CuiFlex.vue"];
    expect(offenders.filter((f) => !exempt.includes(f))).toEqual([]);
  });
});

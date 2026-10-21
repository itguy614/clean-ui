import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

/**
 * #224 — a drop shadow is `--cui-shadow-sm` / `-md` / `-lg` (main.css), which carry their
 * own stronger dark values. Menus, the modal and the editor hardcoded a black shadow and
 * restated it in a second `.dark` rule; they read the tokens now.
 *
 * Black literals left where no level fits, by file, with a count — so a new shadow in one of
 * these files still fails — and why. Each is light-mode only and shaped for its component;
 * moving one onto a level would change how it looks, which is a design call of its own.
 */
const EXEMPT: Record<string, { count: number; why: string }> = {
  "clean-ui-editor/src/styles/editor.css": { count: 2, why: "fallbacks for a clean-ui before 1.4, which has no --cui-shadow-*" },
  "clean-ui/src/styles/main.css": { count: 8, why: "the six token values, and the two table edge fades (inset)" },
  "clean-ui/src/components/CuiCard.vue": { count: 2, why: "the elevated card's faint two-layer shadow" },
  "clean-ui/src/components/CuiListboxPanel.vue": { count: 2, why: "the floating panel's layered shadow, shared with CuiPopover" },
  "clean-ui/src/components/CuiPopover.vue": { count: 2, why: "the floating panel's layered shadow, shared with CuiListboxPanel" },
  "clean-ui/src/components/CuiToast.vue": { count: 1, why: "the toast's own drop shadow" },
  "clean-ui/src/components/CuiSlideover.vue": { count: 1, why: "the slideover's edge shadow" },
  "clean-ui/src/components/CuiDataGridBulkBar.vue": { count: 1, why: "an upward shadow under a sticky bottom bar" },
  "clean-ui/src/components/CuiDataGridTable.vue": { count: 1, why: "the pinned column's edge shadow" },
  "clean-ui/src/components/CuiTabs.vue": { count: 1, why: "the segmented tab's raised pill — a control affordance, not elevation" },
  "clean-ui/src/components/CuiToggle.vue": { count: 1, why: "the toggle knob — a control affordance" },
  "clean-ui/src/components/CuiSlider.vue": { count: 2, why: "the slider thumb, resting and dragging — a control affordance" },
  "clean-ui/src/components/CuiColorPicker.vue": { count: 3, why: "the picker's handles — control affordances" },
};

const BLACK = /rgba?\(\s*0[\s,]+0[\s,]+0\b/g;
const PACKAGES = resolve(__dirname, "../../../..");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return entry === "__tests__" ? [] : walk(path);
    return [path];
  });
}

const where = (f: string) => relative(PACKAGES, f).split(sep).join("/");
const files = readdirSync(PACKAGES)
  .filter((pkg) => statSync(join(PACKAGES, pkg, "src"), { throwIfNoEntry: false })?.isDirectory())
  .flatMap((pkg) => walk(join(PACKAGES, pkg, "src")))
  .filter((f) => /\.(vue|css|ts)$/.test(f) && !/\.test(-d)?\.ts$/.test(f));
// Counted once, for both checks.
const counts = new Map(files.map((f) => [where(f), (readFileSync(f, "utf-8").match(BLACK) ?? []).length]));

describe("shadows come from the elevation tokens (#224)", () => {
  it("hardcodes a black shadow only where an exemption says why", () => {
    const offenders = [...counts]
      .filter(([path, count]) => count > (EXEMPT[path]?.count ?? 0))
      .map(([path, count]) => `${path}: ${count}`);
    expect(offenders).toEqual([]);
  });

  it("keeps the exemption list honest", () => {
    const stale = Object.entries(EXEMPT)
      .filter(([path, { count }]) => counts.get(path) !== count)
      .map(([path]) => path);
    expect(stale).toEqual([]);
  });
});

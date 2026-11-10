import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { sourceFiles, where } from "./css-helpers";

/**
 * #224, #335 — a drop shadow is `--cui-shadow-xs` / `-sm` / `-md` / `-lg` / `-up` (main.css),
 * which carry their own stronger dark values. Menus, the modal, the editor, and then the
 * card, popover, listbox panel, toast, slideover and bulk bar hardcoded a black shadow that
 * stayed as faint on a dark surface; they read the tokens now.
 *
 * The guard keys on any colour literal in a shadow declaration (hex, `black`, `rgb()`,
 * `hsl()`, `oklch()`, ...), counted by file, so a new shadow in one of these files still
 * fails, with why. What is left is the tokens themselves, a fallback for an older clean-ui,
 * inset edge fades and control affordances: light-mode only and shaped for their control.
 */
const EXEMPT: Record<string, { count: number; why: string }> = {
  "clean-ui-editor/src/styles/editor.css": { count: 1, why: "a fallback for a clean-ui before 1.4, which has no --cui-shadow-*" },
  "clean-ui-editor/src/theme/editor-theme.ts": { count: 1, why: "the slash menu's fallback for a clean-ui before 1.4, which has no --cui-shadow-*" },
  "clean-ui/src/styles/main.css": { count: 14, why: "the five token values in light and in dark (xs has two layers), and the two table edge fades (inset)" },
  "clean-ui/src/components/CuiDataGridTable.vue": { count: 1, why: "the pinned column's edge shadow" },
  "clean-ui/src/components/CuiTabs.vue": { count: 1, why: "the segmented tab's raised pill — a control affordance, not elevation" },
  "clean-ui/src/components/CuiToggle.vue": { count: 1, why: "the toggle knob — a control affordance" },
  "clean-ui/src/components/CuiSlider.vue": { count: 2, why: "the slider thumb, resting and dragging — a control affordance" },
  "clean-ui/src/components/CuiColorPicker.vue": { count: 3, why: "the picker's handles — control affordances" },
};

// A shadow declaration: `box-shadow:`, a style binding's `boxShadow:`, a shadow custom
// property (`--cui-shadow-md`, `"--_listbox-panel-shadow"`) or a constant holding one
// (`PINNED_EDGE_SHADOW = "..."`): the rest of its line, and the next
// while a line ends in a comma and the next starts a layer (a length or `inset`), so layers split over several lines count.
const SHADOW = /[\w-]*shadow[\w-]*["']?\s*[:=]([^;\n]*(?:(?<=,[ \t]*)\n(?=\s*(?:-?[\d.]|inset\b))[^;\n]*)*)/gi;
// A colour written out in it, whatever its notation — `color-mix()` of black has its black.
// A `var(--…)` colour isn't one: it resolves through the theme.
const LITERAL = /#[0-9a-f]{3,8}\b|\bblack\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/gi;
const literals = (source: string) =>
  [...source.matchAll(SHADOW)].reduce((n, [, value]) => n + (value.match(LITERAL) ?? []).length, 0);

const files = sourceFiles(/\.(vue|css|ts)$/);
// Counted once, for both checks.
const counts = new Map(files.map((f) => [where(f), literals(readFileSync(f, "utf-8"))]));

describe("shadows come from the elevation tokens (#224)", () => {
  it("hardcodes a black shadow only where an exemption says why", () => {
    const offenders = [...counts]
      .filter(([path, count]) => count > (EXEMPT[path]?.count ?? 0))
      .map(([path, count]) => `${path}: ${count}`);
    expect(offenders).toEqual([]);
  });

  it("sees every notation of a shadow colour", () => {
    const sample = [
      "box-shadow: 0 1px #000;",
      "box-shadow: 0 1px black;",
      "box-shadow: 0 1px rgb(0 0 0 / 0.1);",
      "box-shadow: 0 1px rgba(0, 0, 0, 0.1);",
      "box-shadow: 0 1px hsl(0 0% 0% / 0.1);",
      "box-shadow: 0 1px oklch(0 0 0 / 0.1);",
      "box-shadow: 0 1px color-mix(in srgb, black 10%, transparent);",
      '  boxShadow: "0 1px rgba(0, 0, 0, 0.1)",',
      '"--_listbox-panel-shadow": token("panel-shadow", "0 1px #00000014"),',
      "--cui-shadow-md: 0 4px 16px rgb(0 0 0 / 0.1);",
      "box-shadow: 0 1px 2px var(--x),\n    0 4px 8px black;",
      'const PINNED_EDGE_SHADOW = "2px 0 4px -1px rgba(0,0,0,0.08)";',
    ];
    for (const line of sample) expect(literals(line), line).toBe(1);
    expect(literals("box-shadow: var(--cui-shadow-md);")).toBe(0);
    expect(literals("box-shadow: 0 0 12px 2px var(--_toast-focus-ring);")).toBe(0);
  });

  it("keeps the exemption list honest", () => {
    const stale = Object.entries(EXEMPT)
      .filter(([path, { count }]) => counts.get(path) !== count)
      .map(([path]) => path);
    expect(stale).toEqual([]);
  });
});

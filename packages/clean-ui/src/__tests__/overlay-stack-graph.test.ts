import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

/**
 * #41 — the stack and the child-panel cascade must cost nothing where they are not used. A modal
 * (and the editor built on it) reaches `useOverlay`, so neither it nor anything it imports may
 * reach the stack layer: the join lives in `useOverlayJoin`, imported by CuiSlideover and
 * CuiDrawer alone. This follows the static imports of a file, so a stray import fails here
 * rather than in the editor's bundle budget.
 */
const SRC = resolve(__dirname, "..");
const STACK_LAYER = [
  "composables/useOverlayJoin.ts",
  "composables/overlay-stack-context.ts",
  "composables/useOverlayStack.ts",
  "composables/useSlideoverStackLayout.ts",
  "utils/stackLayout.ts",
  "components/CuiSlideoverStack.vue",
];

function resolveImport(from: string, spec: string): string | null {
  if (!spec.startsWith(".")) return null;
  const base = resolve(dirname(from), spec);
  for (const candidate of [base, `${base}.ts`, `${base}.vue`, `${base}/index.ts`]) {
    if (existsSync(candidate) && /\.(ts|vue)$/.test(candidate)) return candidate;
  }
  return null;
}

/** Every file reachable from `entry` through static imports, `import type` excluded. */
function graph(entry: string): Set<string> {
  const seen = new Set<string>();
  const walk = (file: string) => {
    if (seen.has(file)) return;
    seen.add(file);
    const source = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/[^\n]*/g, "$1");
    for (const m of source.matchAll(/^\s*(?:import|export)\s+(type\s+)?(?:[^;]*?from\s+)?["']([^"']+)["']/gm)) {
      if (m[1]) continue;
      const target = resolveImport(file, m[2]);
      if (target) walk(target);
    }
  };
  walk(entry);
  return new Set([...seen].map((f) => f.slice(SRC.length + 1)));
}

describe("the stack layer stays out of a modal's module graph (#41)", () => {
  for (const entry of ["composables/useOverlay.ts", "composables/useLayerStack.ts", "components/CuiModal.vue", "components/CuiConfirmDialog.vue"]) {
    it(`${entry} does not import it`, () => {
      const reached = graph(resolve(SRC, entry));
      expect([...reached].filter((f) => STACK_LAYER.includes(f))).toEqual([]);
    });
  }

  it("the scan sees imports at all: a slideover reaches the join, and the stack reaches the layout", () => {
    expect(graph(resolve(SRC, "components/CuiSlideover.vue")).has("composables/useOverlayJoin.ts")).toBe(true);
    expect(graph(resolve(SRC, "components/CuiDrawer.vue")).has("composables/useOverlayJoin.ts")).toBe(true);
    expect(graph(resolve(SRC, "components/CuiSlideoverStack.vue")).has("composables/useSlideoverStackLayout.ts")).toBe(true);
  });

  it("a slideover alone does not pull in the stack's layout or provider", () => {
    const reached = graph(resolve(SRC, "components/CuiSlideover.vue"));
    expect(reached.has("composables/useSlideoverStackLayout.ts")).toBe(false);
    expect(reached.has("composables/useOverlayStack.ts")).toBe(false);
    expect(reached.has("utils/stackLayout.ts")).toBe(false);
  });
});

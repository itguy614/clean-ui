import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "node:path";

// Deliberately no resolve.alias for @itguy614/clean-ui (or any other packed
// package) in the default path — this app must resolve them from its own
// node_modules, exactly like a real external consumer, not from workspace
// source. The one exception: scripts/check-bundle-budget.mjs sets
// CUI_BUNDLE_BASELINE to the name of the package it is measuring, to swap that
// package for a stub with the same exports, so it can measure "this app without
// it" from the *same* source, for a true gzip delta rather than the package's
// own (unrelated) dist size. Every other package stays real.
const BASELINE_ALIASES: Record<string, Record<string, string>> = {
  "@itguy614/clean-ui": {
    "@itguy614/clean-ui/styles": resolve(__dirname, "baseline-stub.css"),
    "@itguy614/clean-ui": resolve(__dirname, "baseline-stub.ts"),
  },
  "@itguy614/clean-ui-editor": {
    "@itguy614/clean-ui-editor/styles": resolve(__dirname, "baseline-stub.css"),
    "@itguy614/clean-ui-editor/render": resolve(__dirname, "baseline-stub-editor.ts"),
    "@itguy614/clean-ui-editor": resolve(__dirname, "baseline-stub-editor.ts"),
  },
};
const baselinePackage = process.env.CUI_BUNDLE_BASELINE;
const baseline = baselinePackage ? BASELINE_ALIASES[baselinePackage] : undefined;
if (baselinePackage && !baseline) {
  throw new Error(
    `CUI_BUNDLE_BASELINE="${baselinePackage}" has no stub; known: ${Object.keys(BASELINE_ALIASES).join(", ")}.`,
  );
}
// The page to build and where, set by scripts/check-bundle-budget.mjs for its scenarios
// (#377): its SCENARIOS table is the one place they're named. Unset, the basic page to dist/.
const outDir = process.env.CUI_BUNDLE_OUTDIR || (baseline ? "dist-baseline" : "dist");
const input = process.env.CUI_BUNDLE_INPUT;

export default defineConfig({
  plugins: [vue()],
  resolve: baseline ? { alias: baseline } : undefined,
  build: {
    outDir,
    ...(input ? { rollupOptions: { input: resolve(__dirname, input) } } : {}),
  },
});

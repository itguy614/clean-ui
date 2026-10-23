import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "node:path";

// Deliberately no resolve.alias for @itguy614/clean-ui (or any other packed
// package) in the default path — this app must resolve them from its own
// node_modules, exactly like a real external consumer, not from workspace
// source. The one exception: scripts/check-bundle-budget.mjs sets
// CUI_BUNDLE_BASELINE=1 to swap in a stub with the same exports, so it can
// measure "this app without clean-ui" from the *same* source, for a true
// gzip delta rather than clean-ui's own (unrelated) dist size.
const baseline = process.env.CUI_BUNDLE_BASELINE === "1";
// Which page to build: "basic" (index.html, App.vue) or "grid" (grid.html, GridApp.vue), the
// size budget's second scenario (#377). Each has its own output directory.
const scenario = process.env.CUI_BUNDLE_SCENARIO === "grid" ? "grid" : "basic";
const outDir = [scenario === "grid" ? "dist-grid" : "dist", baseline ? "-baseline" : ""].join("");

export default defineConfig({
  plugins: [vue()],
  resolve: baseline
    ? {
        alias: {
          "@itguy614/clean-ui/styles": resolve(__dirname, "baseline-stub.css"),
          "@itguy614/clean-ui": resolve(__dirname, "baseline-stub.ts"),
        },
      }
    : undefined,
  build: {
    outDir,
    ...(scenario === "grid" ? { rollupOptions: { input: resolve(__dirname, "grid.html") } } : {}),
  },
});

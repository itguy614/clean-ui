#!/usr/bin/env node
/**
 * FR36/FR38/task 6.1.1's AC: "Nothing in the core entry imports the adapter
 * implementation" and "Importing `/render` adds the parser to a consumer
 * bundle; importing the barrel does not." Checked mechanically against the
 * actual built output rather than trusted from source-file layout, since
 * that's the guarantee a real consumer's bundler sees. Run after `vite
 * build` (chained in package.json's `build` script) — mirrors the pattern
 * in clean-ui's own scripts/check-fixture-guarantees.mjs.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = resolve(PACKAGE_ROOT, "dist");
const BARREL = resolve(DIST, "index.js");
const RENDER_ENTRY = resolve(DIST, "render.js");

const RENDER_IMPLEMENTATION_MARKERS = [
  "./render/serialize.js",
  "./render/supplied-adapter.js",
  "./render/CuiMarkdownViewer.vue.js",
];

if (!existsSync(BARREL) || !existsSync(RENDER_ENTRY)) {
  console.error(`\n✗ check-render-subpath-isolation: dist/index.js and dist/render.js must exist — run "vite build" first.\n`);
  process.exit(1);
}

const barrel = readFileSync(BARREL, "utf-8");
const renderEntry = readFileSync(RENDER_ENTRY, "utf-8");

let failed = 0;

const leaked = RENDER_IMPLEMENTATION_MARKERS.filter((marker) => barrel.includes(marker));
if (leaked.length > 0) {
  failed++;
  console.error(`✗ dist/index.js (the core barrel) imports render implementation module(s): ${leaked.join(", ")}`);
} else {
  console.log("✓ dist/index.js imports no render implementation module (serialize/supplied-adapter/viewer)");
}

const missing = RENDER_IMPLEMENTATION_MARKERS.filter((marker) => !renderEntry.includes(marker));
if (missing.length > 0) {
  failed++;
  console.error(`✗ dist/render.js is missing expected module(s): ${missing.join(", ")}`);
} else {
  console.log("✓ dist/render.js imports the serializer, supplied adapter, and viewer");
}

if (!barrel.includes("./render/contract.js")) {
  failed++;
  console.error("✗ dist/index.js does not export the render contract (markAsTrustedHtml/TrustedHtml/MarkdownRenderAdapter)");
} else {
  console.log("✓ dist/index.js exports the plain render contract (no renderer attached)");
}

if (failed > 0) {
  console.error(`\n${failed} render-subpath-isolation guarantee(s) broken.\n`);
  process.exit(1);
}

console.log("\nAll render-subpath-isolation guarantees held.");

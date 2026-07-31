#!/usr/bin/env node
/**
 * Postbuild — prints a bundle size report for the current package's `dist`.
 * Run from that package's own directory (its `build` script does this via
 * `node ../../scripts/report-bundle-size.mjs`) — shared across every
 * publishable package rather than copy-pasted per package.
 */
import { readdirSync, statSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const dist = resolve(process.cwd(), "dist");

function formatSize(bytes) {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} kB`;
}

function walk(dir) {
  let total = 0;
  const entries = [];
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, item.name);
    if (item.isDirectory()) {
      const [subTotal, subEntries] = walk(full);
      total += subTotal;
      entries.push(...subEntries);
    } else if (item.name.endsWith(".js")) {
      const size = statSync(full).size;
      total += size;
      entries.push({ path: full.replace(dist + "/", ""), size });
    }
  }
  return [total, entries];
}

const [, entries] = walk(dist);
const jsEntries = entries.filter((e) => e.path.endsWith(".js"));
const cssFiles = existsSync(dist) ? readdirSync(dist).filter((f) => f.endsWith(".css")) : [];
const cssSize = cssFiles.reduce((sum, file) => sum + statSync(resolve(dist, file)).size, 0);

const sorted = [...jsEntries].sort((a, b) => b.size - a.size);
const jsSize = jsEntries.reduce((sum, entry) => sum + entry.size, 0);

console.log(`\n--- Bundle Size Report ---`);
console.log(`  Total JS:  ${formatSize(jsSize)} (${jsEntries.length} files)`);
console.log(`  Total CSS: ${formatSize(cssSize)}`);
console.log(`  SVG icons: ${existsSync(resolve(dist, "icons")) ? "external" : "bundled with components"}`);
console.log(``);
console.log(`  Top 10 largest JS:`);
for (const entry of sorted.slice(0, 10)) {
  console.log(`    ${formatSize(entry.size).padStart(8)}  ${entry.path}`);
}
console.log(``);

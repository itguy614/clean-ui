/**
 * Postbuild — prints bundle size report.
 */

import { readdirSync, statSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = resolve(__dirname, "..", "dist");

function formatSize(bytes) {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} kB`;
}

function walk(dir) {
  let total = 0;
  const entries = [];
  const items = readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
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

const [totalSize, entries] = walk(dist);
const jsEntries = entries.filter((e) => e.path.endsWith(".js"));
const cssSize = existsSync(resolve(dist, "clean-ui.css"))
  ? statSync(resolve(dist, "clean-ui.css")).size
  : 0;

const sorted = [...jsEntries].sort((a, b) => b.size - a.size);
const jsSize = jsEntries.reduce((s, e) => s + e.size, 0);

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

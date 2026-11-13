#!/usr/bin/env node
/**
 * Rewrites package.json's `./themes/<id>.css` export entries from the theme list (#220).
 * `exports` can't be generated at release time, so it is committed and kept honest by this and by
 * `check-theme-css.mjs`, which fails with this command's name when they disagree. Idempotent.
 * Run from `packages/clean-ui`: `pnpm --filter @itguy614/clean-ui sync:themes`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadThemes, syncExports } from "./themes-list.mjs";

const file = resolve(process.cwd(), "package.json");
const pkg = JSON.parse(readFileSync(file, "utf8"));
const next = JSON.stringify({ ...pkg, exports: syncExports(pkg.exports, loadThemes()) }, null, 2) + "\n";
if (next === readFileSync(file, "utf8")) console.log("sync-theme-exports: package.json already matches the theme list.");
else {
  writeFileSync(file, next);
  console.log("sync-theme-exports: rewrote the ./themes/* entries in package.json.");
}

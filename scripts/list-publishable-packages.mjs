import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGES_DIR = resolve(ROOT, "packages");

/**
 * Every packages/* directory with a package.json and no "private": true.
 * The single source of truth for "which packages does this repo publish" —
 * used by the publish workflow's matrix discovery and by
 * scripts/verify-fixture.mjs, so the two can never independently drift.
 */
export function listPublishablePackages() {
  return readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => resolve(PACKAGES_DIR, entry.name))
    .filter((dir) => existsSync(join(dir, "package.json")))
    .map((dir) => ({ dir, pkg: JSON.parse(readFileSync(join(dir, "package.json"), "utf-8")) }))
    .filter(({ pkg }) => !pkg.private);
}

// CLI entry point: prints a JSON array of workspace-relative directories
// (e.g. ["packages/clean-ui"]) — consumed directly by the publish workflow
// to build its matrix without duplicating this discovery logic in YAML/bash.
if (import.meta.url === `file://${process.argv[1]}`) {
  const packages = listPublishablePackages().map(({ dir }) => dir.slice(ROOT.length + 1));
  console.log(JSON.stringify(packages));
}

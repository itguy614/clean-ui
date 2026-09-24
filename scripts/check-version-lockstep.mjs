import { readFileSync } from "node:fs";
import { resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { listPublishablePackages } from "./list-publishable-packages.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * The release version is asserted in three places that nothing reconciles, and the publish
 * workflow reads them from *different* sources:
 *
 *   - `package.json.version` drives the "already on npm?" check and `npm publish`
 *   - `VERSION` drives the previous-tag lookup, the git tag, and which CHANGELOG section
 *     becomes the GitHub release notes
 *   - the docs site header renders `VERSION` too
 *
 * So drift is silent *and green* in both directions. Bump the manifests but not `VERSION`
 * and npm gets the new version while the release job tags the old one, finds that release
 * already exists, and exits 0 — no GitHub release, no failure. Bump `VERSION` but not the
 * manifests and npm skips the publish as a no-op re-run while a tag and release are created
 * for a version that was never published.
 *
 * Nothing about that fails a build or a test, which is why it is checked here instead.
 */
const version = readFileSync(resolve(ROOT, "VERSION"), "utf-8").trim();
const problems = [];

if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version)) {
  problems.push(`VERSION is "${version}", which is not a semver version`);
}

for (const { dir, pkg } of listPublishablePackages()) {
  const where = `${relative(ROOT, dir)}/package.json`;
  if (pkg.version !== version) {
    problems.push(`${where} is ${pkg.version}, but VERSION says ${version} — these move in lockstep`);
  }
}

// The release job extracts its notes with `awk` between this heading and the next `## [`,
// and falls back to "See CHANGELOG.md for details." when it finds nothing — a release that
// ships with no notes and no error.
const changelog = readFileSync(resolve(ROOT, "CHANGELOG.md"), "utf-8");
if (!changelog.includes(`## [${version}]`)) {
  problems.push(`CHANGELOG.md has no "## [${version}]" heading, so the release notes would be empty`);
}

if (problems.length) {
  console.error("✗ Version is not in lockstep:\n");
  for (const p of problems) console.error(`  - ${p}`);
  console.error("\nUpdate VERSION, every publishable package.json, and the CHANGELOG heading together.");
  process.exit(1);
}

console.log(`✓ Version ${version} is consistent across VERSION, every publishable package, and CHANGELOG.md.`);

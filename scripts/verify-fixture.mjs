#!/usr/bin/env node
/**
 * Packs every publishable package with `pnpm pack`, installs the tarballs
 * into fixtures/consumer-app with **npm** (not the pnpm workspace), and
 * builds it. This is the only place the exports map, peer resolution and
 * published file list get exercised at all — apps/docs aliases clean-ui to
 * workspace source, so nothing else in this repo's CI ever sees what a real
 * `npm install @itguy614/clean-ui` actually resolves to.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { listPublishablePackages } from "./list-publishable-packages.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURE_DIR = resolve(ROOT, "fixtures/consumer-app");

function log(message) {
  console.log(`[verify-fixture] ${message}`);
}

function fail(message) {
  console.error(`\n✗ verify-fixture: ${message}\n`);
  process.exit(1);
}

function run(command, args, opts = {}) {
  log(`$ ${command} ${args.join(" ")}${opts.cwd ? `  (in ${relativeToRoot(opts.cwd)})` : ""}`);
  return execFileSync(command, args, { stdio: "inherit", ...opts });
}

function relativeToRoot(path) {
  return path.startsWith(ROOT) ? path.slice(ROOT.length + 1) || "." : path;
}

// 1. Discover publishable packages.
const publishable = listPublishablePackages();

if (publishable.length === 0) fail("No publishable packages found under packages/*.");
log(`Publishable packages: ${publishable.map(({ pkg }) => pkg.name).join(", ")}`);

// 2. Build, then pack each into a scratch directory.
const packDir = mkdtempSync(join(tmpdir(), "clean-ui-fixture-"));
const tarballs = [];

for (const { dir, pkg } of publishable) {
  try {
    run("pnpm", ["--filter", pkg.name, "build"], { cwd: ROOT });
  } catch {
    fail(`${pkg.name}: build failed. Fix the package build before the fixture can verify it.`);
  }

  let output;
  try {
    // --json avoids parsing pnpm's human-readable file-listing output — it
    // reports the tarball's absolute path directly under "filename".
    output = execFileSync("pnpm", ["pack", "--pack-destination", packDir, "--json"], {
      cwd: dir,
      encoding: "utf-8",
    });
  } catch {
    fail(`${pkg.name}: "pnpm pack" failed.`);
  }

  const tarballPath = JSON.parse(output).filename;
  if (!tarballPath || !existsSync(tarballPath)) {
    fail(`${pkg.name}: expected a packed tarball but none was found (pnpm pack output: ${output}).`);
  }

  tarballs.push({ name: pkg.name, path: tarballPath });
  log(`${pkg.name} packed -> ${relativeToRoot(tarballPath)}`);
}

// 3. Install into the fixture app with npm — real consumers install this way,
// and pnpm's workspace linking is exactly what this fixture must NOT exercise.
// --no-save keeps the committed package.json clean across repeated runs;
// package-lock.json / node_modules here are already gitignored.
rmSync(join(FIXTURE_DIR, "node_modules"), { recursive: true, force: true });
rmSync(join(FIXTURE_DIR, "package-lock.json"), { force: true });
rmSync(join(FIXTURE_DIR, "dist"), { recursive: true, force: true });

try {
  run("npm", ["install", "--no-save", ...tarballs.map(({ path }) => path)], { cwd: FIXTURE_DIR });
} catch {
  fail(
    `npm install of the packed tarball(s) into fixtures/consumer-app failed. This usually means ` +
      `the exports map or peer dependency range doesn't resolve the way a real consumer's install would.`,
  );
}

// 4. Build the fixture app against the installed tarballs.
try {
  run("npm", ["run", "build"], { cwd: FIXTURE_DIR });
} catch {
  fail(
    `fixtures/consumer-app failed to build against the packed tarball(s) — see the vue-tsc/vite ` +
      `output above for which assertion (type error or bundling failure) broke.`,
  );
}

log(`fixtures/consumer-app built successfully from ${tarballs.length} packed package(s).`);

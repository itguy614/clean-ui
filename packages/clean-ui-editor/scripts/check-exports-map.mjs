/**
 * Asserts the package's `exports` map is explicit (#229): every public entry is listed by
 * name, there is no wildcard, and the built `dist` honours the map, from the consumer's side.
 *
 * The map used to end in `"./*": "./dist/*"`, which made every file under `dist` a public
 * module (`@itguy614/clean-ui-editor/messages.js`, `/plugins/registry.js`, ...), so renaming
 * an internal file was a breaking change. This fails if a wildcard comes back, if an entry
 * points at a file the build did not emit, if a declared entry does not import, and if an
 * undeclared path resolves.
 *
 * Imports go through the package's own name (self-reference), so Node applies the real
 * `exports` map: the same resolution a consumer gets.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(resolve(packageDir, "package.json"), "utf-8"));
const failures = [];

/** Every file path a condition tree points at. */
function targets(value) {
  if (typeof value === "string") return [value];
  return Object.values(value ?? {}).flatMap(targets);
}

const entries = Object.entries(pkg.exports ?? {});
const declared = new Set(entries.map(([key]) => key));

for (const [key, value] of entries) {
  if (key.includes("*")) failures.push(`exports["${key}"] is a pattern: list each public entry by name`);
  for (const file of targets(value)) {
    if (file.includes("*")) failures.push(`exports["${key}"] targets "${file}", a pattern`);
    else if (!existsSync(resolve(packageDir, file))) failures.push(`exports["${key}"] targets "${file}", which the build did not emit`);
  }
}

// A declared entry must actually load. JS entries are imported; the stylesheet only has to exist
// (checked above), since Node cannot import CSS.
for (const [key, value] of entries) {
  const loadable = typeof value === "object" && value !== null && "import" in value;
  if (!loadable) continue;
  const specifier = key === "." ? pkg.name : `${pkg.name}/${key.slice(2)}`;
  try {
    await import(specifier);
  } catch (error) {
    failures.push(`"${specifier}" is declared but does not import: ${error instanceof Error ? error.message : error}`);
  }
}

// Every other file the build emitted must be refused: that is what the old wildcard exposed.
// Walks `dist`, so a new internal module is covered without anyone listing it.
const published = new Set(entries.flatMap(([, value]) => targets(value)).map((file) => resolve(packageDir, file)));
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = resolve(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}
for (const file of walk(resolve(packageDir, "dist"))) {
  if (published.has(file) || !file.endsWith(".js")) continue;
  const path = relative(resolve(packageDir, "dist"), file).split(sep).join("/");
  if (declared.has(`./${path}`)) continue;
  try {
    await import(`${pkg.name}/${path}`);
    failures.push(`"${pkg.name}/${path}" resolves, but the exports map does not declare it`);
  } catch (error) {
    if (error?.code !== "ERR_PACKAGE_PATH_NOT_EXPORTED") {
      failures.push(`"${pkg.name}/${path}" should fail with ERR_PACKAGE_PATH_NOT_EXPORTED, got ${error?.code ?? error}`);
    }
  }
}

if (failures.length > 0) {
  console.error(`✗ ${pkg.name}: ${failures.length} exports-map problem(s):\n`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
console.log(`✓ exports map is explicit — ${entries.length} entries (${[...declared].join(", ")}), each resolves, and undeclared paths are refused.`);

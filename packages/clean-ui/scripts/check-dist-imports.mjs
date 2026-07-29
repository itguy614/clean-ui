/**
 * Asserts every bare import specifier in this package's built `dist` is
 * either relative or declared in its own `package.json` (dependencies or
 * peerDependencies). Closes the whole class of "forgot to externalize a new
 * dependency" bug (#42, #62 were both this) rather than the cases someone
 * remembered to list.
 *
 * A real parser (es-module-lexer), not a regex — a regex over the raw source
 * false-positives on strings that merely *look* like import statements (this
 * package's own dev-warning messages and doc comments do exactly that).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { init, parse } from "es-module-lexer";

const packageDir = process.argv[2] ? resolve(process.argv[2]) : resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(packageDir, "dist");
const pkg = JSON.parse(readFileSync(resolve(packageDir, "package.json"), "utf-8"));

const declared = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.peerDependencies ?? {})];

function isDeclared(specifier) {
  return declared.some((name) => specifier === name || specifier.startsWith(`${name}/`));
}

function isRelative(specifier) {
  return specifier.startsWith(".") || specifier.startsWith("/");
}

function walkJsFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkJsFiles(full));
    else if (entry.name.endsWith(".js")) out.push(full);
  }
  return out;
}

await init;

const files = walkJsFiles(distDir);
const violations = [];

for (const file of files) {
  const source = readFileSync(file, "utf-8");
  const [imports] = parse(source, relative(distDir, file));
  for (const { n: specifier } of imports) {
    // Dynamic import() of a computed expression (template literal, variable)
    // has no static specifier — es-module-lexer reports `n: undefined`.
    if (!specifier || isRelative(specifier) || isDeclared(specifier)) continue;
    violations.push({ file: relative(distDir, file), specifier });
  }
}

if (violations.length > 0) {
  console.error(`✗ ${violations.length} undeclared import(s) in ${relative(packageDir, distDir)}:\n`);
  for (const { file, specifier } of violations) {
    console.error(`  ${file}: imports "${specifier}", which is not relative and not in ` + `${pkg.name}'s dependencies or peerDependencies`);
  }
  console.error(`\nDeclared: ${declared.join(", ") || "(none)"}`);
  process.exit(1);
}

console.log(`✓ ${files.length} dist file(s) checked — every bare import is declared (${declared.join(", ") || "none"}).`);

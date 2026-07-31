import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Alias entries mapping every publishable package to its workspace source,
 * for any docs app or test setup in this repo that wants to develop against
 * source rather than a built `dist`. One shared module, so a second docs app
 * cannot independently drift and load a second copy of a package alongside
 * the first — exactly the module-scope-singleton failure mode
 * `duplicate-guard.ts` warns about at runtime, but here at config time.
 *
 * Array form, longest/most-specific find first: an object alias prefix-matches,
 * so a bare package-name entry would also swallow one of its own subpaths if
 * it came first. clean-ui-editor entries are skipped if that package doesn't
 * exist yet (`packages/clean-ui-editor` is created by a later plan) so this
 * function stays safe to call before it lands.
 */
export function workspaceAliases() {
  const aliases = [
    {
      find: "@itguy614/clean-ui/icons/lazy",
      replacement: resolve(REPO_ROOT, "packages/clean-ui/src/icons/lazy.ts"),
    },
    {
      find: /^@itguy614\/clean-ui$/,
      replacement: resolve(REPO_ROOT, "packages/clean-ui/src/index.ts"),
    },
  ];

  if (existsSync(resolve(REPO_ROOT, "packages/clean-ui-editor/package.json"))) {
    aliases.push(
      {
        find: "@itguy614/clean-ui-editor/render",
        replacement: resolve(REPO_ROOT, "packages/clean-ui-editor/src/render.ts"),
      },
      {
        find: "@itguy614/clean-ui-editor/codemirror",
        replacement: resolve(REPO_ROOT, "packages/clean-ui-editor/src/codemirror.ts"),
      },
      {
        find: /^@itguy614\/clean-ui-editor$/,
        replacement: resolve(REPO_ROOT, "packages/clean-ui-editor/src/index.ts"),
      },
    );
  }

  return aliases;
}

function versionDefineFor(packageDir, globalName) {
  const pkgJsonPath = resolve(REPO_ROOT, packageDir, "package.json");
  if (!existsSync(pkgJsonPath)) return {};
  const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));
  return { [globalName]: JSON.stringify(pkg.version) };
}

/**
 * The Vite `define`s an app aliasing a package to source (via
 * `workspaceAliases` above) must also apply. `src/version.ts` in each such
 * package reads a `__CUI_*_VERSION__` global, replaced at build time by that
 * package's OWN vite.config.ts/vitest.config.ts — but aliasing to source
 * means the file gets bundled through the *consuming* app's Vite config
 * instead, which never defined it, so the identifier is left bare and throws
 * `ReferenceError: ... is not defined` the moment anything imports the
 * barrel. Spread this into any app using `workspaceAliases()`.
 */
export function workspaceVersionDefines() {
  return {
    ...versionDefineFor("packages/clean-ui", "__CUI_VERSION__"),
    ...versionDefineFor("packages/clean-ui-editor", "__CUI_EDITOR_VERSION__"),
  };
}

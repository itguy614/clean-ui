import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Alias entries mapping every publishable package to its workspace source,
 * for any docs app or test setup in this repo that wants to develop against
 * source rather than a built `dist`. One shared module, so a second docs app
 * cannot independently drift and load a second copy of clean-ui alongside
 * the first — exactly the module-scope-singleton failure mode
 * `duplicate-guard.ts` warns about at runtime, but here at config time.
 *
 * Array form, longest/most-specific find first: an object alias prefix-matches,
 * so the bare package-name entry would also swallow the "/icons/lazy" subpath
 * if it came first.
 */
export function workspaceAliases() {
  return [
    {
      find: "@itguy614/clean-ui/icons/lazy",
      replacement: resolve(REPO_ROOT, "packages/clean-ui/src/icons/lazy.ts"),
    },
    {
      find: /^@itguy614\/clean-ui$/,
      replacement: resolve(REPO_ROOT, "packages/clean-ui/src/index.ts"),
    },
  ];
}

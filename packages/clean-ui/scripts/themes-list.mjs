/**
 * Shared loader for the one theme list, `src/styles/themes/themes.json` (#220), for the plain
 * `.mjs` scripts (build, sync, checks) and for tests. `useTheme.ts` imports the same JSON.
 */
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

export const SYNC_COMMAND = "pnpm --filter @itguy614/clean-ui sync:themes";

/** `packages/clean-ui`-relative path of the list. */
export const THEMES_JSON = "src/styles/themes/themes.json";

export function loadThemes(root = process.cwd()) {
  return JSON.parse(readFileSync(resolve(root, THEMES_JSON), "utf8")).themes;
}

/** The opt-in themes: everything but the default, in list order. */
export const optIn = (themes) => themes.filter((t) => !t.default);

/** The opt-in themes in the all-in-one stylesheet's order. */
export const cascadeOrder = (themes) => [...optIn(themes)].sort((a, b) => a.cascade - b.cascade);

/** The `.css` basenames in `src/styles/themes`. */
export const themeFilesOnDisk = (root = process.cwd()) =>
  readdirSync(resolve(root, "src/styles/themes"))
    .filter((f) => f.endsWith(".css"))
    .map((f) => f.slice(0, -4))
    .sort();

/** The `./themes/<id>.css` export entries the list implies. */
export const themeExportEntries = (themes) =>
  Object.fromEntries(optIn(themes).map((t) => [`./themes/${t.id}.css`, `./dist/themes/${t.id}.css`]));

/** `exports` with its `./themes/*.css` entries replaced by the list's, placed after `./styles/all.css`. */
export function syncExports(exportsMap, themes) {
  const out = {};
  for (const [key, value] of Object.entries(exportsMap)) {
    if (key.startsWith("./themes/")) continue;
    out[key] = value;
    if (key === "./styles/all.css") Object.assign(out, themeExportEntries(themes));
  }
  return out;
}

/**
 * Where the sources disagree with the list: `themes` (the list), `files` (the css basenames on
 * disk) and `exports` (package.json's). Pure, so a test can hand it a list with a fake theme.
 */
export function sourceProblems({ themes, files, exports }) {
  const problems = [];
  const ids = optIn(themes).map((t) => t.id);
  if (new Set(themes.map((t) => t.id)).size !== themes.length) problems.push("themes.json has a duplicate id");
  if (themes.filter((t) => t.default).length !== 1) problems.push("themes.json must mark exactly one theme as the default");
  const cascades = optIn(themes).map((t) => t.cascade);
  if (cascades.some((c) => !Number.isInteger(c)) || new Set(cascades).size !== cascades.length) {
    problems.push("every opt-in theme in themes.json needs its own integer `cascade`");
  }
  for (const id of ids) if (!files.includes(id)) problems.push(`themes.json lists "${id}" but src/styles/themes/${id}.css does not exist`);
  for (const f of files) if (!ids.includes(f)) problems.push(`src/styles/themes/${f}.css exists but themes.json does not list "${f}"`);
  const have = Object.keys(exports).filter((k) => k.startsWith("./themes/"));
  const want = themeExportEntries(themes);
  if (have.join() !== Object.keys(want).join() || have.some((k) => exports[k] !== want[k])) {
    problems.push(`package.json "exports" ./themes/* entries do not match themes.json: run \`${SYNC_COMMAND}\``);
  }
  return problems;
}

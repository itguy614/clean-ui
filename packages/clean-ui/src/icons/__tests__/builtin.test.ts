import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { BUILTIN_ICONS } from "../builtin";
import { COLOR_ICON_MAP } from "../../utils/colorIconMap";

const SRC = resolve(__dirname, "../..");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return entry === "__tests__" ? [] : walk(path);
    return [path];
  });
}

/**
 * Every icon the library can render must be in BUILTIN_ICONS — otherwise it
 * silently falls back to importing all of @phosphor-icons/vue at runtime, which
 * is the bug this map exists to prevent (#42). This test is the guard against
 * that drifting back as components change.
 */
function staticIconUsages(): { name: string; where: string }[] {
  const found: { name: string; where: string }[] = [];

  for (const file of walk(SRC).filter((f) => f.endsWith(".vue"))) {
    const src = readFileSync(file, "utf8");
    const where = file.replace(SRC + "/", "");

    for (const tag of src.match(/<CuiIcon\b[\s\S]*?\/?>/g) ?? []) {
      // literal name="…" (not the :name binding)
      const literal = tag.match(/(?<![:\w-])name="([a-z0-9-]+)"/);
      if (literal) {
        found.push({ name: literal[1], where });
        continue;
      }
      // string literals inside a :name expression are reachable too,
      // e.g. :name="copied ? 'check' : 'copy'"
      const dynamic = tag.match(/:name="([^"]+)"/);
      for (const quoted of dynamic?.[1].match(/'([a-z0-9-]+)'/g) ?? []) {
        found.push({ name: quoted.slice(1, -1), where: `${where} (:name literal)` });
      }
    }
  }
  return found;
}

describe("built-in icon map", () => {
  it("covers every icon name used statically in a component template", () => {
    const usages = staticIconUsages();
    // sanity-check the scanner itself still finds the usages
    expect(usages.length).toBeGreaterThan(20);

    const missing = usages
      .filter((u) => !(u.name in BUILTIN_ICONS))
      .map((u) => `"${u.name}" in ${u.where}`);

    expect(missing, `add these to BUILTIN_ICONS as static imports:\n  ${missing.join("\n  ")}`)
      .toEqual([]);
  });

  it("covers every COLOR_ICON_MAP value (CuiAlert / CuiToast / CuiBanner auto-icons)", () => {
    const missing = Object.entries(COLOR_ICON_MAP)
      .filter(([, icon]) => !(icon in BUILTIN_ICONS))
      .map(([role, icon]) => `"${icon}" (role: ${role})`);

    expect(missing).toEqual([]);
  });

  it.each([
    // CuiFileUpload's fileIcon()
    ["file", "file-pdf", "file-zip", "file-xls", "file-doc", "file-text", "image", "video-camera", "music-note"],
    // CuiDataGrid's getSortIcon()
    ["caret-up", "caret-down", "caret-up-down"],
    // CuiRating icon / halfIcon defaults
    ["star", "star-half"],
    // CuiConfirmDialog's per-color cfg.icon
    ["warning", "warning-circle", "info"],
    // CuiIcon's own unknown-name fallback
    ["question"],
  ])("covers the dynamic helper set %#", (...names) => {
    const missing = names.filter((n) => !(n in BUILTIN_ICONS));
    expect(missing).toEqual([]);
  });

  it("maps every name to a real component", () => {
    const broken = Object.entries(BUILTIN_ICONS)
      .filter(([, component]) => !component)
      .map(([name]) => name);

    expect(broken).toEqual([]);
  });

  it("uses kebab-case keys, matching what the name prop takes", () => {
    const wrong = Object.keys(BUILTIN_ICONS).filter((k) => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(k));
    expect(wrong).toEqual([]);
  });
});

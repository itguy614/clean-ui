import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { sourceFiles, where } from "./css-helpers";
import { RADIUS_SCALE } from "../../utils/sizing";

// #201: CLAUDE.md called it "the shared radiusMap", but there was no shared definition —
// twelve components each declared the same literal. RADIUS_SCALE in utils/sizing.ts is
// the one copy; this keeps new components from growing a thirteenth. Every package's
// components, the editor's included (#228).
//
// #294: `md` no longer follows `--cui-button-radius`, and no stylesheet or template writes a
// radius by hand any more. A corner is one of: a scale step (`RADIUS_SCALE` in script, the
// fixed `var(--cui-radius-<step>, <default>)` snippet in CSS), the component's own
// `--cui-<component>-radius` in front of one, a private `--_<component>-radius`, or a shape
// that is no step of the scale at all (a circle, a pill, a hairline, a detail radius of a
// quarter rem or less).
describe("rounded scale", () => {
  // Reasons, per preflight.test.ts. A stale exemption fails too.
  const EXEMPT: Record<string, string> = {
    "CuiSkeleton.vue": "its own scale: fixed md/lg values, a SkeletonRounded type",
  };

  // A map by its usual names, or — whatever it is called — the scale's `md` value as a script
  // string, which only a copied map writes out.
  const LOCAL_MAP = /const\s+radiusMap\b|Record<\s*CuiRounded\s*,|["'`]var\(\s*--cui-radius-md\s*,\s*0\.375rem\s*\)["'`]/;

  it("no component declares its own radius map", () => {
    const offenders = sourceFiles(/\.vue$/)
      .filter((f) => LOCAL_MAP.test(readFileSync(f, "utf8").split("</script>")[0]))
      .map((f) => basename(f));
    expect(offenders.filter((f) => !(f in EXEMPT))).toEqual([]);
    expect(Object.keys(EXEMPT).filter((f) => !offenders.includes(f))).toEqual([]);
  });

  it("the scale's defaults are the ones main.css declares on :root", () => {
    const css = readFileSync(sourceFiles(/styles[\\/]main\.css$/).find((f) => /clean-ui[\\/]src/.test(f))!, "utf8");
    for (const step of ["sm", "md", "lg"] as const) {
      const declared = new RegExp(`--cui-radius-${step}:\\s*([\\d.]+rem)`).exec(css)?.[1];
      expect(declared, `--cui-radius-${step} on :root`).toBeDefined();
      expect(RADIUS_SCALE[step]).toBe(`var(--cui-radius-${step}, ${declared})`);
    }
  });

  // #294 — `--cui-button-radius` is CuiButton's own token. A card, a modal or an alert that
  // reads it ties its corners to the buttons around it (#141 found the same with the card
  // token), and `rounded="md"` followed it for every component until 2.0. A reader other than
  // the button itself needs a reason here, and counts.
  const BUTTON_TOKEN: Record<string, { count: number; reason: string }> = {
    "CuiButton.vue": { count: 1, reason: "the token's own reader: ahead of the `rounded` scale value" },
    "CuiTimePicker.vue": { count: 1, reason: "SETS it, on the AM/PM buttons it renders: restyling buttons is what it is for" },
  };

  it("--cui-button-radius is read only by CuiButton (and set only on buttons)", () => {
    const found: Record<string, number> = {};
    for (const f of sourceFiles(/\.(vue|css|ts)$/)) {
      const n = (code(readFileSync(f, "utf8")).match(/--cui-button-radius\b/g) ?? []).length;
      if (n) found[basename(f)] = n;
    }
    const unexpected = Object.entries(found).filter(([f, n]) => BUTTON_TOKEN[f]?.count !== n);
    const stale = Object.keys(BUTTON_TOKEN).filter((f) => !(f in found));
    expect({ unexpected, stale }).toEqual({ unexpected: [], stale: [] });
  });

  // Findings the shape check below cannot clear, each counted: the value is not a step of the
  // scale, so it keeps an explicit own token (with that value as its default) rather than
  // moving a step and changing how the component looks.
  const LITERAL: Record<string, { count: number; reason: string }> = {
    "CuiConfirmDialog.vue": { count: 1, reason: "the icon tile's 0.625rem sits between md and lg: its own --cui-confirm-dialog-icon-radius" },
    "CuiFileUpload.vue": { count: 1, reason: "the drop zone's 0.625rem sits between md and lg: its own --cui-file-upload-radius" },
    "main.css": { count: 2, reason: "the .cui-typography prose layer styles consumer HTML (pre blocks, 0.5rem), not a component: its own fixed values, with no token to hang them on" },
  };

  it("every corner radius is a scale step, an own token, or a shape — not a hand-written length", () => {
    const found: Record<string, string[]> = {};
    for (const f of sourceFiles(/\.(vue|css|ts)$/)) {
      const bad = radiusDeclarations(code(readFileSync(f, "utf8"))).filter((v) => !isAllowedRadius(v));
      if (bad.length) found[`${basename(f)}`] = bad.map((v) => `${where(f)}: ${v}`);
    }
    const unexpected = Object.entries(found)
      .filter(([f, list]) => LITERAL[f]?.count !== list.length)
      .map(([f, list]) => `${f}: expected ${LITERAL[f]?.count ?? 0}, found ${list.length}\n  ${list.join("\n  ")}`);
    const stale = Object.keys(LITERAL).filter((f) => !(f in found));
    expect({ unexpected, stale }).toEqual({ unexpected: [], stale: [] });
  });

  it("the checker itself rejects the hand-written forms it exists for", () => {
    const bad = [
      "0.375rem",
      "8px",
      "var(--cui-button-radius, 0.375rem)",
      "var(--cui-card-radius, 0.375rem)",
      "var(--cui-radius-md, 0.5rem)",
      "var(--cui-radius-lg, 0.375rem)",
      "calc(0.5rem - 1px)",
    ];
    const good = [
      "0",
      "50%",
      "9999px",
      "inherit",
      "0.25rem",
      "2px",
      "var(--cui-radius-md, 0.375rem)",
      "var(--cui-card-radius, var(--cui-radius-lg, 0.5rem))",
      "var(--cui-card-radius, var(--_card-radius))",
      "calc(var(--cui-input-radius, var(--_input-radius, var(--cui-radius-md, 0.375rem))) - 1px)",
      "var(--cui-radius-md, 0.375rem) 0 0 var(--cui-radius-md, 0.375rem)",
    ];
    expect(bad.filter(isAllowedRadius)).toEqual([]);
    expect(good.filter((v) => !isAllowedRadius(v))).toEqual([]);
  });

  it("finds a radius wherever one is written: a style block, a template binding, a script object", () => {
    const css = ".a { border-radius: 0.375rem; border-top-left-radius: 8px }";
    const template = `<div :style="{ borderRadius: '0.5rem' }" style="border-radius: 12px">`;
    const script = 'const s = { borderRadius: "0.625rem" }; x.borderRadius = "1rem"; { "--_a-radius": "0.4rem" }';
    expect(radiusDeclarations(css)).toEqual(["0.375rem", "8px"]);
    expect(radiusDeclarations(template)).toEqual(["0.5rem", "12px"]);
    expect(radiusDeclarations(script)).toEqual(["0.625rem", "1rem", "0.4rem"]);
  });
});

/** Source with comments removed, so a note about a value is not read as the value. */
function code(source: string): string {
  return source
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:"'`(])\/\/[^\n]*/g, "$1");
}

/**
 * The value of every corner-radius declaration in `source`, wherever it is written: a CSS
 * declaration (a `<style>` block or an inline `style="…"` attribute), a `borderRadius` key or
 * assignment in a template binding or a script, or a private `--_<component>-radius` property
 * emitted from script.
 */
function radiusDeclarations(source: string): string[] {
  const out: Array<{ at: number; value: string }> = [];
  // Whichever capture group matched: a literal may be written in any of three quote styles.
  const add = (re: RegExp) => {
    for (const m of source.matchAll(re)) out.push({ at: m.index!, value: m.slice(1).find((g) => g !== undefined)!.trim() });
  };
  // CSS: `border-radius`, `border-top-left-radius`, `border-start-start-radius`, up to `;`, `}` or `"`.
  add(/(?<![\w-])border(?:-[a-z]+){0,2}-radius\s*:\s*([^;}"\n]+)/g);
  // JS: a key or an assignment, with a string literal value.
  add(/\bborderRadius\s*[:=]\s*(?:"([^"]*)"|'([^']*)'|`([^`]*)`)/g);
  // A private token written from script: `"--_a-radius": "…"` or `token("panel-radius", "…")`.
  add(/["']--_[a-z-]*radius[a-z-]*["']\s*:\s*(?:"([^"]*)"|'([^']*)')/g);
  add(/token\(\s*["'][a-z-]*radius[a-z-]*["']\s*,\s*"([^"]*)"\s*\)/g);
  return out.sort((a, b) => a.at - b.at).map((o) => o.value);
}

/** A hairline or detail radius: at most a quarter rem, which is the scale's `sm`. */
const DETAIL = /^(0|0?\.\d+|\d+)(px|rem)$/;
function isDetail(len: string): boolean {
  if (len === "0") return true;
  if (!DETAIL.test(len)) return false;
  const n = parseFloat(len);
  return len.endsWith("rem") ? n <= 0.25 : n <= 3;
}

const STEP_DEFAULT: Record<string, string> = { sm: "0.25rem", md: "0.375rem", lg: "0.5rem" };

/**
 * Whether a radius value is made only of allowed parts. A scale read is
 * `var(--cui-radius-<step>, <that step's default>)`; an own token is
 * `var(--cui-<component>-radius, <anything allowed>)`; a private one is `var(--_<c>-radius…)`.
 * Everything else must be a shape: a percentage, a pill, `inherit`, or a detail length.
 */
function isAllowedRadius(value: string): boolean {
  let v = value.trim();
  // A scale read, with the step's own default and no other.
  v = v.replace(/var\(\s*--cui-radius-(sm|md|lg)\s*,\s*([\d.]+rem)\s*\)/g, (whole, step: string, d: string) => (STEP_DEFAULT[step] === d ? "R" : whole));
  // An own or private token, innermost first, with an allowed fallback (a read, or a detail length) or none.
  const TOKEN = "--(?:cui-[a-z-]*radius[a-z-]*|_[a-z-]*(?:radius|corner)[a-z-]*)";
  const TOKEN_READ = new RegExp(`var\\(\\s*${TOKEN}(?:\\s*,\\s*([^,()]+?))?\\s*\\)`, "g");
  for (let i = 0; i < 6; i++) {
    const next = v.replace(TOKEN_READ, (whole, fallback: string | undefined) => (fallback === undefined || fallback === "R" || isDetail(fallback) ? "R" : whole));
    if (next === v) break;
    v = next;
  }
  // What is left: placeholders, calc() glue, and plain lengths.
  v = v.replace(/calc\(|\)|[+*/-]|\bR\b/g, " ");
  const parts = v.split(/\s+/).filter(Boolean);
  return parts.every((p) => /^(inherit|initial|unset|none)$/.test(p) || /^\d*\.?\d+%$/.test(p) || p === "9999px" || p === "0" || isDetail(p));
}

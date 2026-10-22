import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { expectExemptions, splitSelectorList, stripComments, walk, type Exemption } from "./css-helpers";

/**
 * #267 — the mechanical half of CLAUDE.md's "Motion" section. Without a written rule and a
 * guard the library drifted to 19 durations, plain `ease` everywhere and four hand-rolled
 * close timers (#261). Each rule is a function over source text, checked against a
 * deliberate violation below, so a rule that stops matching can't pass vacuously; then
 * over both packages. The scans read kebab-case declarations, in stylesheets and in inline
 * style strings; a camelCase binding (`transitionDuration: …`) isn't seen.
 */
const PACKAGES = resolve(__dirname, "../../../..");

/** Comments and `prefers-reduced-motion` blocks out: the reduced rule clamps to literal 1ms on purpose. */
function motionSource(src: string): string {
  let out = stripComments(src).replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1");
  for (;;) {
    const at = out.search(/@media[^{]*prefers-reduced-motion[^{]*\{/);
    if (at === -1) return out;
    let depth = 0;
    let i = out.indexOf("{", at);
    for (; i < out.length; i++) {
      if (out[i] === "{") depth++;
      else if (out[i] === "}" && --depth === 0) break;
    }
    out = out.slice(0, at) + out.slice(i + 1);
  }
}

const sources = ["clean-ui", "clean-ui-editor"]
  .flatMap((pkg) => walk(resolve(PACKAGES, pkg, "src")))
  .filter((f) => /\.(vue|css|ts)$/.test(f))
  .map((f) => ({ name: relative(PACKAGES, f), motion: motionSource(readFileSync(f, "utf8")) }));

/** `transition` / `animation` declarations, one per match. */
const declarations = (src: string) =>
  [...src.matchAll(/\b(transition|animation)(-[a-z-]+)?\s*:\s*([^;\n]+)/g)].map((m) => m[0]);

/** Each rule takes motion source (see motionSource) and returns its findings. */
const rules = {
  /** `transition: all` animates whatever changes, layout included. Name the properties. */
  transitionAll: (src: string) => declarations(src).filter((d) => /^transition(-property)?\s*:\s*['"`]?\s*all\b/.test(d)),
  /** `ease-in` starts slowly, so UI feels late. (`ease-in-out` is fine.) */
  easeIn: (src: string) => declarations(src).filter((d) => /\bease-in\b(?!-)/.test(d)),
  /** An entrance from `scale(0)` appears from nowhere: start near 0.95 with opacity. */
  keyframeFromZero: (src: string) =>
    [...src.matchAll(/@keyframes\s+([\w-]+)\s*\{\s*(?:0%|from)\s*\{([^}]*)\}/g)]
      .filter((m) => /scale\(\s*0\s*\)/.test(m[2]))
      .map((m) => m[1]),
  /**
   * A literal duration instead of a `--cui-duration-*` token. Each comma-separated part is
   * judged on its own, so a loop beside it (`infinite`, which keeps its own duration)
   * doesn't excuse a one-off.
   */
  literalDuration: (src: string) =>
    declarations(src)
      .flatMap((d) => splitSelectorList(d.slice(d.indexOf(":") + 1)))
      .filter((part) => !/\binfinite\b/.test(part) && /(?<![\w.-])\d*\.?\d+m?s\b/.test(part)),
  /**
   * A timer waiting a hand-copied duration instead of `motionDuration()`. Best effort: it
   * sees a numeric literal as the last argument, not a named constant.
   */
  literalTimer: (src: string) =>
    [...src.matchAll(/setTimeout\((?:(?!setTimeout\()[\s\S]){0,300}?\}?\s*,\s*(\d+)\s*\)\s*;/g)].map((m) => m[0]),
  /** A floating panel with no `transform-origin`, so it scales from its centre, not its trigger. */
  noTransformOrigin: (src: string) => (/transform-origin|transformOrigin/.test(src) ? [] : ["no transform-origin"]),
};

describe("motion rules catch what they describe", () => {
  it.each([
    ["transitionAll", ".x { transition: all 150ms ease; }"],
    ["easeIn", ".x { transition: opacity var(--cui-duration-fast) ease-in; }"],
    ["keyframeFromZero", "@keyframes pop { 0% { transform: scale(0); } 100% { transform: scale(1); } }"],
    ["literalDuration", ".x { transition: color 0.15s ease; }"],
    ["literalDuration", ".x { animation: spin 1s linear infinite, fade 150ms ease; }"],
    ["literalTimer", "setTimeout(() => { open.value = false; }, 150);"],
    ["noTransformOrigin", ".panel { animation: pop var(--cui-duration-base) var(--cui-ease-out); }"],
  ] as const)("%s flags its violation", (rule, violation) => {
    expect(rules[rule](motionSource(violation))).not.toEqual([]);
  });

  it.each([
    ["transitionAll", ".x { transition: opacity var(--cui-duration-fast) ease; }"],
    ["easeIn", ".x { animation: spin 2s ease-in-out infinite; }"],
    ["keyframeFromZero", "@keyframes pop { from { opacity: 0; transform: scale(0.95); } }"],
    ["literalDuration", ".x { transition: color var(--cui-duration-fast) ease; } .y { animation: spin 1s linear infinite; }"],
    ["literalTimer", 'setTimeout(close, motionDuration("fast", el));\n// setTimeout(close, 150);'],
    ["noTransformOrigin", ".panel { transform-origin: var(--_panel-transform-origin); }"],
  ] as const)("%s passes the correct form", (rule, ok) => {
    expect(rules[rule](motionSource(ok))).toEqual([]);
  });

  it("ignores the reduced-motion clamp, and comments", () => {
    const src = "/* transition: color 0.15s ease */ @media (prefers-reduced-motion: reduce) { * { transition-duration: 1ms !important; } }";
    expect(rules.literalDuration(motionSource(src))).toEqual([]);
  });
});

/** Every file's findings for `rule`, against what's exempt. */
function check(rule: keyof typeof rules, exempt: Record<string, Exemption> = {}, only?: string[]) {
  const scanned = only ? sources.filter((s) => only.includes(s.name)) : sources;
  if (only) expect(scanned.map((s) => s.name).sort(), "files to scan").toEqual([...only].sort());
  const found = Object.fromEntries(scanned.map((s) => [s.name, rules[rule](s.motion).length] as const).filter(([, n]) => n > 0));
  expectExemptions(found, exempt);
}

const C = "clean-ui/src/components/";

describe("motion in both packages", () => {
  it("never transitions `all`", () => check("transitionAll"));

  it("never eases in", () => check("easeIn"));

  it("never starts an entrance from scale(0)", () =>
    check("keyframeFromZero", {
      [`${C}CuiCheckbox.vue`]: { count: 1, why: "the check-mark pop; starts near 0.9 in #266" },
      [`${C}CuiRadio.vue`]: { count: 1, why: "the dot pop; starts near 0.9 in #266" },
    }));

  it("reads every duration from a --cui-duration-* token", () =>
    check("literalDuration", {
      [`${C}CuiToast.vue`]: { count: 1, why: "the progress bar's per-tick width; a single scaleX transition in #266" },
      "clean-ui-editor/src/styles/editor.css": { count: 1, why: "the max-length shake: a one-off 0.5s gesture, faster reads as a glitch" },
    }));

  it("waits for an exit through motionDuration(), never a literal", () =>
    check("literalTimer", {
      [`${C}CuiDropdown.vue`]: { count: 3, why: "hover-intent delays before opening and closing, not an animation's length" },
      [`${C}CuiDropdownSub.vue`]: { count: 2, why: "hover-intent delays before opening and closing, not an animation's length" },
      [`${C}CuiTreeView.vue`]: { count: 1, why: "its type-ahead reset; goes with its own type-ahead in #289" },
    }));

  it("scales every floating panel from its trigger", () => {
    const FLOATING = ["CuiPopover", "CuiTooltip", "CuiContextMenu", "CuiDropdownMenu", "CuiDropdownSub", "CuiSelect", "CuiCombobox"].map(
      (c) => `${C}${c}.vue`,
    );
    // Every panel scales from its centre until #262 sets the origin from the placement.
    check("noTransformOrigin", Object.fromEntries(FLOATING.map((f) => [f, { count: 1, why: "origin from placement in #262" }])), FLOATING);
  });
});

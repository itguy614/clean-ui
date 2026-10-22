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

/**
 * Comments and `prefers-reduced-motion: reduce` blocks out: the reduced rule clamps to a
 * literal 1ms on purpose. (A `no-preference` block is where full motion lives, so it stays.)
 * Line comments only outside stylesheets, and only after whitespace, so `url(//cdn…)` stays.
 */
function motionSource(src: string, css = false): string {
  let out = stripComments(src);
  if (!css) out = out.replace(/(^|\s)\/\/[^\n]*/g, "$1");
  return withoutBlocks(out, /@media[^{]*prefers-reduced-motion\s*:\s*reduce[^{]*\{/);
}

/** `src` with every block whose opening matches `opening` cut out, nested braces and all. */
function withoutBlocks(src: string, opening: RegExp): string {
  let out = src;
  for (;;) {
    const at = out.search(opening);
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
  .map((f) => ({ name: relative(PACKAGES, f), motion: motionSource(readFileSync(f, "utf8"), f.endsWith(".css")) }));

/**
 * `transition` / `animation` declarations, `name: value`, whole: a quoted inline style
 * string to its closing quote, a stylesheet value to its `;` or `}`, across lines.
 */
const declarations = (src: string) =>
  [
    ...src.matchAll(
      /\b(transition|animation)(-[a-z-]+)?\s*:\s*(?:[\w.!]+\s*\?\s*(["'`])([^"'`]*)\3\s*:\s*)?(?:(["'`])([^"'`]*)\5|([^;{}"'`]+))/g,
    ),
  ].flatMap((m) =>
    // Both branches of an inline ternary (`dragging ? 'none' : 'width …'`) are declarations.
    [m[4], m[6] ?? m[7]]
      .filter((v): v is string => v !== undefined)
      .map((v) => `${m[1]}${m[2] ?? ""}: ${v.replace(/\s+/g, " ").trim()}`),
  );

/** A declaration's comma-separated parts, `var()` fallbacks dropped (a token with a fallback is still a token). */
const parts = (d: string) =>
  splitSelectorList(d.slice(d.indexOf(":") + 1)).map((p) => {
    let out = p;
    while (/var\([^()]*\)/.test(out)) out = out.replace(/var\([^()]*\)/g, "var");
    return out;
  });

/** A zero scale: `scale(0)`, `scale(0, 0)`, `scaleX(0)`, `scale(0.0)`. */
const ZERO_SCALE = /scale[XY]?\(\s*0(?:\.0*)?\s*(?:,\s*0(?:\.0*)?\s*)?\)/;
const LAYOUT = /^(width|height|max-height|min-height|max-width|min-width|top|left|right|bottom|inset|margin[a-z-]*|padding[a-z-]*)$/;

/** The last top-level argument of each `setTimeout(…)` call. */
function timerDelays(src: string): string[] {
  const out: string[] = [];
  for (const m of src.matchAll(/\bsetTimeout\(/g)) {
    let depth = 1;
    let i = m.index! + m[0].length;
    let lastComma = -1;
    for (; i < src.length && depth > 0; i++) {
      const c = src[i];
      if ("([{".includes(c)) depth++;
      else if (")]}".includes(c)) depth--;
      else if (c === "," && depth === 1) lastComma = i;
    }
    if (lastComma !== -1) out.push(src.slice(lastComma + 1, i - 1).trim());
  }
  return out;
}

/** Each rule takes motion source (see motionSource) and returns its findings. */
const rules = {
  /** `transition: all` animates whatever changes, layout included. Name the properties. */
  transitionAll: (src: string) => declarations(src).filter((d) => /^transition(-property)?\s*:\s*['"`]?\s*all\b/.test(d)),
  /** `ease-in` starts slowly, so UI feels late. (`ease-in-out` is fine.) */
  easeIn: (src: string) => declarations(src).filter((d) => /\bease-in\b(?!-)/.test(d)),
  /**
   * An entrance from a zero scale appears from nowhere: start near 0.95 with opacity. In a
   * keyframes' first frame (any selector list holding `0%` or `from`), or in a Vue
   * `<Transition>` class's `-enter-from` / `-leave-to` state.
   */
  keyframeFromZero: (src: string) => [
    ...[...src.matchAll(/@keyframes\s+([\w-]+)\s*\{\s*([^{]*)\{([^}]*)\}/g)]
      .filter((m) => /(^|,)\s*(0%|from)\s*(,|$)/.test(m[2].trim()) && ZERO_SCALE.test(m[3]))
      .map((m) => m[1]),
    ...[...src.matchAll(/([.\w-]*-(?:enter-from|leave-to))[^{]*\{([^}]*)\}/g)].filter((m) => ZERO_SCALE.test(m[2])).map((m) => m[1]),
  ],
  /**
   * A literal duration instead of a `--cui-duration-*` token. Each comma-separated part is
   * judged on its own, so a loop beside it (`infinite`, which keeps its own duration)
   * doesn't excuse a one-off.
   */
  literalDuration: (src: string) =>
    declarations(src)
      .flatMap(parts)
      .filter((part) => !/\binfinite\b/.test(part) && /(?<![\w.-])\d*\.?\d+m?s\b/.test(part)),
  /**
   * A timer waiting a hand-copied duration instead of `motionDuration()`: a numeric literal
   * anywhere in its delay argument (a ternary included) with no `motionDuration` call.
   * Best effort: a named constant isn't seen.
   */
  literalTimer: (src: string) => timerDelays(src).filter((d) => /\b\d+\b/.test(d) && !/\bmotionDuration\(/.test(d)),
  /**
   * A floating panel that doesn't take its `transform-origin` from a private property: the
   * placement-derived origin #262 emits as `--_<component>-transform-origin`. A fixed
   * `transform-origin: center` elsewhere in the file doesn't count.
   */
  noTransformOrigin: (src: string) => (/transform-origin:\s*var\(--_[\w-]+-transform-origin\b/.test(src) ? [] : ["no placement origin"]),
  /**
   * Hover-only motion outside `@media (hover: hover) and (pointer: fine)`: on a touch
   * screen a tap sets the hover state, and some browsers leave it set (#265). A `:hover`
   * rule that moves (`transform`), or a transform written from a mouseenter handler.
   */
  ungatedHoverMotion: (src: string) => [
    ...[...withoutBlocks(src, /@media[^{]*\(hover:\s*hover\)[^{]*\(pointer:\s*fine\)[^{]*\{/).matchAll(/([^{}]*:hover[^{]*)\{([^}]*)\}/g)]
      .filter((m) => /(^|[;\s])(transform|translate|scale|rotate)\s*:/.test(m[2]))
      .map((m) => m[1].trim()),
    ...[...src.matchAll(/@mouse(?:enter|over)="[^"]*style\.transform/g)].map((m) => m[0]),
  ],
  /** A transition on a layout property, which lays out and paints every frame: use transform/opacity. */
  layoutTransition: (src: string) =>
    declarations(src)
      .filter((d) => d.startsWith("transition:"))
      .flatMap(parts)
      .map((p) => p.split(/\s+/)[0])
      .filter((prop) => LAYOUT.test(prop)),
};

describe("motion rules catch what they describe", () => {
  it.each([
    ["transitionAll", ".x { transition: all 150ms ease; }"],
    ["easeIn", ".x { transition: opacity var(--cui-duration-fast) ease-in; }"],
    ["keyframeFromZero", "@keyframes pop { 0% { transform: scale(0); } 100% { transform: scale(1); } }"],
    ["literalDuration", ".x { transition: color 0.15s ease; }"],
    ["literalDuration", ".x { animation: spin 1s linear infinite, fade 150ms ease; }"],
    ["literalTimer", "setTimeout(() => { open.value = false; }, 150);"],
    ["literalTimer", 'const f = () => setTimeout(close, entrance === "none" ? 0 : 150)'],
    ["noTransformOrigin", ".panel { animation: pop var(--cui-duration-base) var(--cui-ease-out); transform-origin: center; }"],
    ["keyframeFromZero", "@keyframes pop { 0%, 40% { transform: scaleX(0); } }"],
    ["keyframeFromZero", ".cui-x-enter-from { opacity: 0; transform: scale(0); }"],
    ["easeIn", ".x {\n  transition:\n    color var(--cui-duration-fast) ease,\n    border-color var(--cui-duration-fast) ease-in;\n}"],
    ["transitionAll", "@media (prefers-reduced-motion: no-preference) { .x { transition: all var(--cui-duration-fast); } }"],
    ["layoutTransition", ".x { transition: max-height var(--cui-duration-slow) var(--cui-ease-out); }"],
    ["ungatedHoverMotion", ".card:hover { transform: translateY(-2px); }"],
    ["ungatedHoverMotion", ".card:hover { translate: 0 -2px; }"],
    ["ungatedHoverMotion", "@media (hover: hover) { .card:hover { scale: 1.05; } }"],
    ["ungatedHoverMotion", '<button @mouseenter="($event.target as HTMLElement).style.transform = \'scale(1.1)\'">'],
    ["layoutTransition", ':style="{ transition: \'width var(--cui-duration-press) ease\' }"'],
    ["layoutTransition", ":style=\"{ transition: dragging ? 'none' : 'left var(--cui-duration-press) ease' }\""],
  ] as const)("%s flags its violation", (rule, violation) => {
    expect(rules[rule](motionSource(violation))).not.toEqual([]);
  });

  it.each([
    ["transitionAll", ".x { transition: opacity var(--cui-duration-fast) ease; }"],
    ["easeIn", ".x { animation: spin 2s ease-in-out infinite; }"],
    ["keyframeFromZero", "@keyframes pop { from { opacity: 0; transform: scale(0.95); } }"],
    ["literalDuration", ".x { transition: color var(--cui-duration-fast) ease; } .y { animation: spin 1s linear infinite; }"],
    ["literalTimer", 'setTimeout(close, motionDuration("fast", el));\n// setTimeout(close, 150);'],
    ["literalTimer", 'setTimeout(() => { items.splice(i, 1); }, motionDuration("fast", el));'],
    ["noTransformOrigin", ".panel { transform-origin: var(--_panel-transform-origin); }"],
    ["literalDuration", ".x { transition: opacity var(--cui-duration-fast, 150ms) ease; }"],
    ["layoutTransition", ".x { transition: transform var(--cui-duration-base) var(--cui-ease-out), opacity var(--cui-duration-base) ease; }"],
    ["ungatedHoverMotion", "@media (hover: hover) and (pointer: fine) { .card:hover { transform: translateY(-2px); } } .x:hover { background: red; }"],
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
// Layout-property transitions still in the library, each with the issue that removes it.
// Layout-property transitions still in the library, each with the issue that removes it.
const LAYOUT_EXEMPT: Record<string, Exemption> = {
  [`${C}CuiAccordionItem.vue`]: { count: 1, why: "max-height collapse; grid-template-rows in #270 (2.0)" },
  [`${C}CuiFieldset.vue`]: { count: 3, why: "max-height and padding collapse; grid-template-rows in #270 (2.0)" },
  [`${C}CuiTreeNode.vue`]: { count: 1, why: "max-height collapse; grid-template-rows in #270 (2.0)" },
}

describe("motion in both packages", () => {
  it("never transitions `all`", () => check("transitionAll"));

  it("never eases in", () => check("easeIn"));

  it("never starts an entrance from scale(0)", () => check("keyframeFromZero"));

  it("reads every duration from a --cui-duration-* token", () =>
    check("literalDuration", {
      "clean-ui-editor/src/styles/editor.css": { count: 1, why: "the max-length shake: a one-off 0.5s gesture, faster reads as a glitch" },
    }));

  it("waits for an exit through motionDuration(), never a literal", () =>
    check("literalTimer", {
      [`${C}CuiDropdown.vue`]: { count: 3, why: "hover-intent delays before opening and closing, not an animation's length" },
      [`${C}CuiDropdownSub.vue`]: { count: 2, why: "hover-intent delays before opening and closing, not an animation's length" },
      [`${C}CuiTreeView.vue`]: { count: 1, why: "its type-ahead reset; goes with its own type-ahead in #289" },
    }));

  it("transitions no layout property", () => check("layoutTransition", LAYOUT_EXEMPT));

  it("gates hover-only motion to a fine pointer", () => check("ungatedHoverMotion"));

  it("scales every floating panel from its trigger", () => {
    // The elements that render an anchored panel. CuiSelect, CuiCombobox and CuiTagInput
    // render theirs through CuiListboxPanel. A new floating panel joins this list.
    const FLOATING = ["CuiPopover", "CuiTooltip", "CuiContextMenu", "CuiDropdownMenu", "CuiDropdownSub", "CuiListboxPanel"].map(
      (c) => `${C}${c}.vue`,
    );
    check("noTransformOrigin", {}, FLOATING);
  });
});

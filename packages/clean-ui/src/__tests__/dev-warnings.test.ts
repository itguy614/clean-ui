import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { expectExemptions, sourceFiles, where, type Exemption } from "../styles/__tests__/css-helpers";

/**
 * #369 — dev-only diagnostics must not ship in a production build. Two mechanical rules over
 * both packages, each checked against a deliberate violation so it can't pass vacuously:
 *
 * 1. A bare `console.warn` / `console.error` is a finding. A diagnostic goes through
 *    `warnOnce` (utils/devWarn.ts), which is silent outside `__DEV__`.
 * 2. A call to `warnOnce` / `warnVariantColor` has both halves of the guard earlier in the same
 *    function: `__DEV__` (safe where there is no `process`) and the literal `process.env.NODE_ENV
 *    !== "production"` a consumer's bundler replaces, which is what makes the call and its message
 *    string dead code the minifier drops. A guard only inside `warnOnce`, or `__DEV__` alone,
 *    would keep the string. See utils/devWarn.ts.
 */

const strip = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/[^\n]*/g, "$1");

const CONSOLE = /\bconsole\.(warn|error)\s*\(/g;
const WARN_CALL = /(?<![.\w]|function )(warnOnce|warnVariantColor)\s*\(/g;
const GUARD_WINDOW = 400;
const STATIC_HALF = 'process.env.NODE_ENV !== "production"';

const bareConsole = (src: string) => [...strip(src).matchAll(CONSOLE)].length;

function unguardedWarnCalls(src: string): number {
  const code = strip(src).replace(/^import .*$/gm, "");
  return [...code.matchAll(WARN_CALL)].filter((m) => {
    const before = code.slice(Math.max(0, m.index - GUARD_WINDOW), m.index);
    const lastFn = Math.max(before.lastIndexOf("function "), before.lastIndexOf("=> {"));
    const scope = before.slice(lastFn === -1 ? 0 : lastFn);
    return !(scope.includes("__DEV__") && scope.includes(STATIC_HALF));
  }).length;
}

describe("the scans catch a violation", () => {
  it("bare console", () => {
    expect(bareConsole('console.warn("x")')).toBe(1);
    expect(bareConsole('// console.warn("x")\nconst a = 1')).toBe(0);
  });
  it("an unguarded call, and a guarded one", () => {
    expect(unguardedWarnCalls('function f() {\n  warnOnce("x");\n}')).toBe(1);
    const both = `__DEV__ && ${STATIC_HALF}`;
    expect(unguardedWarnCalls(`function f() {\n  if (${both}) warnOnce("x");\n}`)).toBe(0);
    // `__DEV__` alone keeps the string in a production bundle.
    expect(unguardedWarnCalls('function f() {\n  if (__DEV__) warnOnce("x");\n}')).toBe(1);
    // A guard in an earlier function doesn't cover this one.
    expect(unguardedWarnCalls(`function a() { if (__DEV__ && ${STATIC_HALF}) {} }\nfunction f() {\n  warnOnce("x");\n}`)).toBe(1);
  });
});

const sources = sourceFiles(/\.(vue|ts)$/).map((f) => ({ name: where(f), src: readFileSync(f, "utf8") }));

// The sinks behind `__DEV__`, and runtime failures a consumer wants in production too.
const CONSOLE_EXEMPT: Record<string, Exemption> = {
  "clean-ui/src/utils/devWarn.ts": { count: 1, why: "warnOnce's own sink, behind __DEV__" },
  "clean-ui-editor/src/duplicate-guard.ts": { count: 1, why: "its own warnOnce sink; its one call is behind both halves" },
  "clean-ui/src/composables/useAsyncSearch.ts": { count: 1, why: "a failed consumer fetch; also surfaced as `error`, kept in production" },
  "clean-ui-editor/src/plugins/command-context.ts": { count: 1, why: "a plugin's dialog close threw on unmount: a runtime failure" },
  "clean-ui-editor/src/render/CuiMarkdownViewer.vue": { count: 1, why: "the consumer's adapter threw and the viewer fell back: a runtime failure" },
  "clean-ui-editor/src/components/CuiMarkdownEditor.vue": {
    count: 1,
    why: "plugin registry warnings arrive prebuilt from the registry, so guarding the report would not drop their strings (follow-up)",
  },
};

describe("dev warnings stay out of production (#369)", () => {
  it("no bare console.warn / console.error outside the documented exemptions", () => {
    const found = Object.fromEntries(sources.map((s) => [s.name, bareConsole(s.src)] as const).filter(([, n]) => n > 0));
    expectExemptions(found, CONSOLE_EXEMPT);
  });

  it("every warnOnce / warnVariantColor call is behind __DEV__", () => {
    const found = Object.fromEntries(
      sources
        .filter((s) => !s.name.endsWith("utils/devWarn.ts"))
        .map((s) => [s.name, unguardedWarnCalls(s.src)] as const)
        .filter(([, n]) => n > 0),
    );
    expectExemptions(found, {});
  });
});

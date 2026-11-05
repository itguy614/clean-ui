import { isColorRole } from "./color";

const ROLE_LIST =
  "primary, secondary, success, error, warning, info, surface, surface-light, surface-dark";

// Module-scoped, so the library doesn't pull Node's global types into its own build.
declare const process: { env: { NODE_ENV?: string } };

function detectDev(): boolean {
  try {
    return process.env.NODE_ENV !== "production";
  } catch {
    // No `process`: a native-ESM import with no bundler to replace the expression.
    return false;
  }
}

/**
 * Whether dev-only diagnostics run: true outside a production build, false where there is
 * no `process` to ask (a native-ESM import with no bundler), which keeps the import loading.
 *
 * This is the RUNTIME half of a pair (#369). The static half is `process.env.NODE_ENV !==
 * "production"`, spelled out at every call site: Vite, webpack, Rollup (plugin-replace),
 * esbuild and Bun replace that exact expression with a literal, as they do for Vue's own
 * `*.esm-bundler.js` builds, so in the consumer's production build the guard is
 * `__DEV__ && false` and the minifier drops the call, message string included. (A `typeof
 * process` check in place of the try/catch would be wrong: a browser dev build has no
 * `process`, so warnings would never appear there. And `__DEV__` alone is not dead code to a
 * minifier, since `detectDev()` is a call.) `dist` leaves `process.env.NODE_ENV` as written:
 * the consumer's bundler decides. Not `import.meta.env.DEV`, which is Vite-only.
 *
 * So a call site reads `if (__DEV__ && process.env.NODE_ENV !== "production") warnOnce(…)`,
 * with `process` declared module-scoped; `src/__tests__/dev-warnings.test.ts` fails on a bare
 * `console.warn` or a `warnOnce` without both halves, and the consumer fixture build asserts
 * no warning text survives (`scripts/check-fixture-guarantees.mjs`).
 *
 * `sideEffects`: this module has none of its own (a `Set` and functions), so it needs no
 * `sideEffects` entry and drops out of a production bundle once nothing calls it. Only
 * `duplicate-guard.ts` is listed, because it registers the instance stamp at import.
 */
export const __DEV__: boolean = detectDev();

// Warn at most once per unique message, so the same mistake repeated across many
// component instances doesn't spam the console. These only ever fire on genuine misuse,
// never on valid usage, and only outside production (see `__DEV__`).
const warned = new Set<string>();
export function warnOnce(message: string): void {
  if (!__DEV__ || warned.has(message)) return;
  warned.add(message);
  console.warn(message);
}

/** Test seam: forget which warnings have fired, so a test can assert on its own. */
export function __clearWarned(): void {
  warned.clear();
}

/**
 * Sanity-check the two most-confused props. `color` sets the semantic role;
 * `variant` sets the structural style — passing a role name to `variant`
 * (e.g. `variant="info"`) is the common mistake, so we detect it and point at
 * the right prop. Only warns on invalid values; valid usage is silent.
 *
 * @param component  Display name, e.g. "CuiBadge".
 * @param variant    The value passed to `variant` + that component's allowed set.
 * @param color      The value passed to `color` (validated against the roles).
 */
export function warnVariantColor(
  component: string,
  variant: { value: string | undefined; allowed: readonly string[] },
  color: string | undefined,
): void {
  if (!__DEV__) return;
  const v = variant.value;
  if (v != null && !variant.allowed.includes(v)) {
    const hint = isColorRole(v)
      ? ` "${v}" is a color role — did you mean color="${v}"?`
      : "";
    warnOnce(
      `[clean-ui] ${component}: variant="${v}" is not valid. ` +
        `Expected one of: ${variant.allowed.join(", ")}.${hint}`,
    );
  }

  if (color != null && !isColorRole(color)) {
    const alias = color === "danger" ? ` Use color="error".` : "";
    warnOnce(
      `[clean-ui] ${component}: color="${color}" is not a valid role. ` +
        `Expected one of: ${ROLE_LIST}.${alias}`,
    );
  }
}

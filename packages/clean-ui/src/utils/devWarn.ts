import { isColorRole } from "./color";

const ROLE_LIST =
  "primary, secondary, success, error, warning, info, surface, surface-light, surface-dark";

// Warn at most once per unique message, so the same mistake repeated across many
// component instances doesn't spam the console. (Matches the unconditional
// console.warn pattern already used by CuiIcon — reliable NODE_ENV/dev detection
// across bundlers in a published ESM library is brittle, and these only ever fire
// on genuine misuse, never on valid usage.)
const warned = new Set<string>();
function warnOnce(message: string): void {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(message);
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

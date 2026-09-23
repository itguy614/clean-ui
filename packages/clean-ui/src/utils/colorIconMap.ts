import { shallowReactive } from "vue";
import { hasIcon } from "../icons/registry";
import type { CuiColor } from "../types/common";

/**
 * Default icon per color role, for CuiAlert, CuiToast and CuiBanner.
 *
 * `error` is an octagon rather than an ✕ (which reads as "close") and rather than
 * `warning-circle` (which would leave hue as the only thing separating the two roles).
 * `components/__tests__/feedbackRoleIcon.test.ts` holds that invariant.
 *
 * These are the defaults, not the answer: `registerRoleIcons()` overrides them app-wide.
 */
export const COLOR_ICON_MAP: Record<CuiColor, string> = {
  primary: "info",
  secondary: "info",
  success: "check-circle",
  error: "warning-octagon",
  warning: "warning-circle",
  info: "info",
  surface: "info",
  "surface-light": "info",
  "surface-dark": "info",
};

/** App-level overrides, mirroring how `registerIcons` layers over the built-in set. */
const overrides = shallowReactive<Partial<Record<CuiColor, string>>>({});

/**
 * Override the icon a color role renders in CuiAlert, CuiToast and CuiBanner.
 *
 * Role → icon is a theme concern in the same way role → colour is, and colours are
 * overridable at the root. Without this, a design language with its own error glyph had
 * to pass `icon` at every single feedback component in the app (#140).
 *
 * ```ts
 * registerRoleIcons({ error: "siren", success: "seal-check" });
 * ```
 *
 * Reactive, so a call after mount re-renders. Names are resolved the same way the `icon`
 * prop is — see {@link resolveRoleIcon} — so an unregistered name renders as text rather
 * than as a `?` glyph.
 */
export function registerRoleIcons(icons: Partial<Record<CuiColor, string>>): void {
  Object.assign(overrides, icons);
}

/** Test seam: drop app-level overrides, leaving the library defaults. */
export function __clearRoleIcons(): void {
  for (const key of Object.keys(overrides)) delete overrides[key as CuiColor];
}

/**
 * Resolve the icon a feedback component should render, from its color role and an
 * optional `icon` override.
 *
 *  - explicit override naming a registered icon → that icon
 *  - explicit override that is anything else    → rendered as literal text
 *  - otherwise → the role's icon: `registerRoleIcons()` first, then the library default
 *
 * The text branch exists because `CuiToast.icon` has always taken an emoji or a character
 * and a programmatic toast has no slot to fall back on, so one prop had to cover both.
 *
 * The discriminator is the STATIC registry — built-ins plus `registerIcons()`. A name that
 * only resolves through the optional lazy resolver (`@itguy614/clean-ui/icons/lazy`) is
 * not known here and renders as text. Mirrors `resolveLiveRegion` in shape: a pure
 * resolver the components read once (#119).
 */
export function resolveRoleIcon(
  icon: string | undefined,
  color: CuiColor,
): { name: string | null; text: string | null } {
  if (icon) return hasIcon(icon) ? { name: icon, text: null } : { name: null, text: icon };

  const role = overrides[color] ?? COLOR_ICON_MAP[color] ?? "info";
  return hasIcon(role) ? { name: role, text: null } : { name: null, text: role };
}

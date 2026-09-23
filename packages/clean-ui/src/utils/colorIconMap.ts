import { hasIcon } from "../icons/registry";

/**
 * Default icon per color role, for CuiAlert, CuiToast and CuiBanner.
 *
 * `error` is an octagon rather than an ✕ (which reads as "close") and rather than
 * `warning-circle` (which would leave hue as the only thing separating the two roles).
 * `components/__tests__/feedbackRoleIcon.test.ts` holds that invariant.
 */
export const COLOR_ICON_MAP: Record<string, string> = {
  success: "check-circle",
  error: "warning-octagon",
  warning: "warning-circle",
  info: "info",
  primary: "info",
  secondary: "info",
};

/**
 * Resolve the icon a feedback component should render, from its color role and an
 * optional `icon` override.
 *
 *  - no override            → the role's default, as an icon
 *  - override names a registered icon → that icon
 *  - anything else          → the override rendered as literal text
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
  color: string,
): { name: string | null; text: string | null } {
  if (!icon) return { name: COLOR_ICON_MAP[color] ?? "info", text: null };
  return hasIcon(icon) ? { name: icon, text: null } : { name: null, text: icon };
}

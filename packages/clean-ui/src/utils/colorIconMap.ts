import { hasIcon } from "../icons/registry";

/**
 * Maps color roles to their default Phosphor icon names.
 * Used by CuiAlert, CuiToast and CuiBanner for auto-icons.
 *
 * `error` is an octagon, not an ✕: a cross reads as "close" far more strongly than it
 * reads as "error", and beside a dismissible component's own ✕ it renders as a second
 * close button (#119). It is deliberately not `warning-circle` either — error and warning
 * are adjacent severities, and giving them the same glyph would leave colour as the only
 * thing telling them apart (WCAG 1.4.1). The octagon is the stop-sign silhouette, so it
 * reads as the more severe of the two without relying on hue.
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
 * Whether an `icon` prop should render as an icon or as literal text.
 *
 * `CuiToast` has always taken an emoji or a character here — `toast({ icon: "🚀" })` —
 * and a programmatic toast has no slot to fall back on, so that had to keep working while
 * Banner and Alert gained the same prop for Phosphor names. One rule covers both: a
 * registered name renders the icon, anything else renders as text (#119).
 *
 * Registration is checked against the built-in set plus anything a consumer has added
 * through `registerIcons()`, so a custom icon name works here too.
 */
export function isIconName(icon: string | undefined): icon is string {
  return !!icon && hasIcon(icon);
}

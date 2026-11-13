import { shallowReactive, type Component } from "vue";
import { resolveRegisteredIcon } from "../icons/registry";
import { IconCheckCircle } from "../icons/generated/check-circle";
import { IconInfo } from "../icons/generated/info";
import { IconWarningCircle } from "../icons/generated/warning-circle";
import { IconWarningOctagon } from "../icons/generated/warning-octagon";
import type { CuiColor, CuiRoleIcon } from "../types/common";

/**
 * Default icon per color role, for CuiAlert, CuiToast and CuiBanner.
 *
 * `error` is an octagon rather than an ✕ (which reads as "close") and rather than
 * `warning-circle` (which would leave hue as the only thing separating the two roles).
 * `components/__tests__/feedbackRoleIcon.test.ts` holds that invariant.
 *
 * These are the defaults, not the answer: `createCleanUI({ roleIcons })` or a
 * `CuiConfigProvider` overrides them for an app or a subtree, and `registerRoleIcons()` (or
 * `configureCleanUI`) globally.
 */
export const COLOR_ICON_MAP: Record<CuiColor, Component> = {
  primary: IconInfo,
  secondary: IconInfo,
  success: IconCheckCircle,
  error: IconWarningOctagon,
  warning: IconWarningCircle,
  info: IconInfo,
  surface: IconInfo,
  "surface-light": IconInfo,
  "surface-dark": IconInfo,
};

/** App-level overrides, mirroring how `registerIcons` layers over the built-in set. */
const overrides = shallowReactive<Partial<Record<CuiColor, CuiRoleIcon>>>({});

/**
 * Override the icon a color role renders in CuiAlert, CuiToast and CuiBanner, **globally**:
 * the same as `configureCleanUI({ roleIcons })`, of which this stays the documented alias.
 * For one app, prefer `createCleanUI({ roleIcons })` (#149).
 *
 * Role → icon is a theme concern in the same way role → colour is, and colours are
 * overridable at the root. Without this, a design language with its own error glyph had
 * to pass `icon` at every single feedback component in the app (#140).
 *
 * ```ts
 * registerRoleIcons({ error: PhSiren, success: "seal-check" });
 * ```
 *
 * Reactive, so a call after mount re-renders. A component renders as itself; a string is
 * resolved the same way the `icon` prop is — see {@link resolveRoleIcon} — so an unregistered
 * name renders as text rather than as a `?` glyph.
 */
export function registerRoleIcons(icons: Partial<Record<CuiColor, CuiRoleIcon>>): void {
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
 *  - explicit override that is a component      → that icon
 *  - explicit override naming a registered icon → that icon
 *  - explicit override that is any other string → rendered as literal text
 *  - otherwise → the role's icon: the app's or provider's (`provided`), then the global
 *    `registerRoleIcons()` / `configureCleanUI()`, then the library default, which is a
 *    built-in component and needs no registration
 *
 * The text branch exists because `CuiToast.icon` has always taken an emoji or a character
 * and a programmatic toast has no slot to fall back on, so one prop had to cover both.
 *
 * The discriminator for a string is the STATIC registry — `registerIcons()`, plus the built-in
 * names once `@itguy614/clean-ui/icons/builtin` is imported. A name that only resolves through
 * the optional lazy resolver (`@itguy614/clean-ui/icons/lazy`) is not known here and renders
 * as text. Mirrors `resolveLiveRegion` in shape: a pure resolver the components read once (#119).
 */
export function resolveRoleIcon(
  icon: CuiRoleIcon | undefined,
  color: CuiColor,
  /** The app's or the nearest provider's role icons (#149), above the global ones. */
  provided?: Partial<Record<CuiColor, CuiRoleIcon>>,
): { icon: Component | null; text: string | null } {
  const chosen = icon || (provided?.[color] ?? overrides[color] ?? COLOR_ICON_MAP[color] ?? IconInfo);
  if (typeof chosen !== "string") return { icon: chosen, text: null };
  const registered = resolveRegisteredIcon(chosen);
  return registered ? { icon: registered, text: null } : { icon: null, text: chosen };
}

import { computed, inject, shallowReactive, type ComputedRef } from "vue";
import { registerRoleIcons } from "./colorIconMap";
import { CuiDefaultsKey, type CleanUIConfig, type CuiHeadingLevels } from "../components/config-context";
import type { CuiTitleAs } from "../types/common";

export type { CleanUIConfig, CuiHeadingLevels };

/** The library's own levels: a card or an empty state sits under a section, a dialog is its own page. */
const HEADING_DEFAULTS: CuiHeadingLevels = {
  cardHeader: "h3",
  modalHeader: "h2",
  confirmDialog: "h2",
  emptyState: "h3",
};

/** The global fallback, under every app's and every provider's own. */
const globalHeadingLevels = shallowReactive<Partial<CuiHeadingLevels>>({});

/**
 * Set the library's **global** defaults (#149): the fallback beneath any app's own. A
 * per-component prop wins over them, then the nearest `CuiConfigProvider`, then the options
 * given to `createCleanUI()` — so prefer those, which belong to one app. This is for code that
 * has no app to hand: a test setup, a micro-frontend shell.
 *
 * ```ts
 * configureCleanUI({ headingLevels: { cardHeader: "h2" }, roleIcons: { error: "siren" } });
 * ```
 *
 * Reactive, so a call after mount re-renders, and cumulative: each call merges into what
 * earlier ones set. Module-wide — one per JavaScript realm — so on a server it is shared by
 * every request, which is why app-level options are the better home.
 */
export function configureCleanUI(config: CleanUIConfig): void {
  if (config.headingLevels) Object.assign(globalHeadingLevels, config.headingLevels);
  if (config.roleIcons) registerRoleIcons(config.roleIcons);
}

/** The defaults provided above this component — an app's, merged with any providers' — or null. */
export function useCleanUIDefaults(): ComputedRef<Required<CleanUIConfig>> | null {
  return inject(CuiDefaultsKey, null);
}

/**
 * The element a component's title renders as: its own `titleAs`, else the provided default,
 * else the global one, else the library's.
 */
export function useHeadingLevel(key: keyof CuiHeadingLevels, titleAs: () => CuiTitleAs | undefined) {
  const provided = useCleanUIDefaults();
  return computed<CuiTitleAs>(
    () => titleAs() ?? provided?.value.headingLevels[key] ?? globalHeadingLevels[key] ?? HEADING_DEFAULTS[key],
  );
}

/** Merge a layer of defaults onto the one beneath it. */
export function mergeDefaults(base: Required<CleanUIConfig> | undefined, layer: CleanUIConfig): Required<CleanUIConfig> {
  return {
    headingLevels: { ...base?.headingLevels, ...layer.headingLevels },
    roleIcons: { ...base?.roleIcons, ...layer.roleIcons },
  };
}

/** Test seam: drop the global heading defaults. */
export function __clearHeadingLevels(): void {
  for (const key of Object.keys(globalHeadingLevels)) delete globalHeadingLevels[key as keyof CuiHeadingLevels];
}

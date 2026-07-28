import { shallowReactive, type Component } from "vue";
import { BUILTIN_ICONS } from "./builtin";

/**
 * Icon registry — the tree-shakeable path for icons beyond the built-in set.
 *
 * Consumers statically import the Phosphor components they use and register them
 * by the same kebab-case name they pass to `<CuiIcon name="…" />`, so their
 * bundler sees a real static reference and ships only those icons:
 *
 * ```ts
 * import { registerIcons } from "@itguy614/clean-ui";
 * import { PhRocket, PhGithubLogo } from "@phosphor-icons/vue";
 *
 * registerIcons({ rocket: PhRocket, "github-logo": PhGithubLogo });
 * ```
 *
 * Module-level on purpose: callable from an app entry, a route module, or a
 * lazily-loaded feature, with no app instance or component context needed.
 * Sharing it across SSR requests is safe — icon components are stateless.
 */

// shallowReactive so a registration after a CuiIcon has already rendered
// re-resolves it, without Vue walking into the component definitions.
const registered = shallowReactive<Record<string, Component>>({});

/**
 * Register icons by name. Later calls override earlier ones for the same name,
 * and a registered name also overrides the built-in of that name.
 */
export function registerIcons(icons: Record<string, Component>): void {
  Object.assign(registered, icons);
}

/** Look a name up: registered first, then the library's built-in set. */
export function resolveRegisteredIcon(name: string): Component | undefined {
  return registered[name] ?? BUILTIN_ICONS[name];
}

/** Whether a name resolves without the lazy fallback (i.e. is tree-shakeable). */
export function hasIcon(name: string): boolean {
  return resolveRegisteredIcon(name) !== undefined;
}

/** Names currently resolvable statically — built-in plus registered. */
export function registeredIconNames(): string[] {
  return [...new Set([...Object.keys(BUILTIN_ICONS), ...Object.keys(registered)])].sort();
}

/** Test seam: drop consumer registrations, leaving the built-ins. */
export function __clearRegisteredIcons(): void {
  for (const key of Object.keys(registered)) delete registered[key];
}

/**
 * Resolver consulted for a name that is neither built-in nor registered.
 *
 * Deliberately a hook rather than a dynamic `import()` inside CuiIcon: a bundler
 * that sees `import("@phosphor-icons/vue")` anywhere must keep all ~1500 icons,
 * which is the very cost #42 is about — measured at 1315 kB gzip versus 124 kB
 * once the import is gone. Keeping it in a separate module that nothing imports
 * by default means the package only enters a bundle if the consumer asks for it,
 * via `@itguy614/clean-ui/icons/lazy`.
 */
export type IconFallbackResolver = (name: string) => Promise<Component | undefined>;

let fallbackResolver: IconFallbackResolver | null = null;

/** Install a resolver for unregistered names. See `icons/lazy`. */
export function setIconFallbackResolver(resolver: IconFallbackResolver | null): void {
  fallbackResolver = resolver;
}

export function getIconFallbackResolver(): IconFallbackResolver | null {
  return fallbackResolver;
}

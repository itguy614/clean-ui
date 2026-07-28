/**
 * Opt-in lazy icon loading.
 *
 * ```ts
 * import "@itguy614/clean-ui/icons/lazy";
 * ```
 *
 * Installs a fallback resolver so ANY Phosphor icon name works without being
 * registered, matching clean-ui ≤1.0.1 behaviour. Convenient for prototypes and
 * for apps whose icon names are data-driven and unbounded.
 *
 * The cost is the whole point of keeping this in its own module: the dynamic
 * import below makes bundlers retain every icon in the package. Measured on an
 * app rendering a single icon — 124 kB gzip without this module, 1315 kB with it.
 * So don't reach for it to silence a warning; register the handful of names you
 * actually use instead:
 *
 * ```ts
 * import { registerIcons } from "@itguy614/clean-ui";
 * import { PhRocket } from "@phosphor-icons/vue";
 * registerIcons({ rocket: PhRocket });
 * ```
 */
import type { Component } from "vue";
import { setIconFallbackResolver } from "./registry";

function toPascalCase(name: string): string {
  return "Ph" + name.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("");
}

const cache = new Map<string, Component | undefined>();

/**
 * Enable lazy resolution. Called automatically when this module is imported;
 * exported as well so the intent can be explicit at a call site.
 */
export function enableLazyIcons(): void {
  setIconFallbackResolver(async (name) => {
    const pascalName = toPascalCase(name);
    if (cache.has(pascalName)) return cache.get(pascalName);

    const mod = await import("@phosphor-icons/vue");
    const resolved = mod[pascalName as keyof typeof mod] as Component | undefined;
    cache.set(pascalName, resolved);
    return resolved;
  });
}

/** Undo {@link enableLazyIcons} — unregistered names go back to the fallback glyph. */
export function disableLazyIcons(): void {
  setIconFallbackResolver(null);
}

enableLazyIcons();

<script setup lang="ts">
import { shallowRef, computed, watchEffect, toRaw, type Component } from "vue";
import type { CuiSize, CuiColorOrCss, HideableProps } from "../types/common";
import { resolveColor } from "../utils/color";
import {
  resolveRegisteredIcon,
  getIconFallbackResolver,
  type IconFallbackResolver,
} from "../icons/registry";
import { FALLBACK_ICON } from "../icons/builtin";
import { warnOnce } from "../utils/devWarn";

export type IconWeight = "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
export type IconSize = CuiSize | (string & {});

export interface CuiIconProps extends HideableProps {
  /**
   * Phosphor icon name in kebab-case (e.g. "check", "warning-circle").
   * Resolved from the built-in set and anything passed to `registerIcons()`.
   * An unregistered name still renders, via a lazy import of the whole Phosphor
   * package — which is not tree-shakeable, so it warns in the console.
   */
  name?: string;
  /**
   * A Phosphor component passed directly, e.g. `:icon="PhRocket"`. The simplest
   * tree-shakeable path — the consumer's own static import. Takes precedence
   * over `name`.
   */
  icon?: Component;
  /** Icon weight/style */
  weight?: IconWeight;
  /** Icon size — named scale (xs–xl) or custom CSS value */
  size?: IconSize;
  /** Icon color — a color role (mapped to its token) or any CSS color */
  color?: CuiColorOrCss;
  /** Secondary color for duotone weight */
  duotoneColor?: string;
  /** Opacity for duotone secondary layer (0-1) */
  duotoneOpacity?: number;
}

const props = withDefaults(defineProps<CuiIconProps>(), {
  weight: "regular",
  size: "md",
  color: "currentColor",
  duotoneOpacity: 0.2,
  hidden: false,
});

// Size mapping
const sizeMap: Record<string, string> = {
  xs: "0.875rem",  // 14px
  sm: "1rem",      // 16px
  md: "1.25rem",   // 20px
  lg: "1.5rem",    // 24px
  xl: "2rem",      // 32px
};

const resolvedSize = computed(() => sizeMap[props.size] ?? props.size);

// Convert kebab-case name to PascalCase with Ph prefix
function toPascalCase(name: string): string {
  return "Ph" + name.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("");
}

/**
 * Icons resolve in three steps:
 *
 * 1. `:icon` — a component handed straight to us.
 * 2. `name` against the built-in set + `registerIcons()`. Synchronous, so the
 *    icon renders on first paint and during SSR (both sides read the same static
 *    map, so there's nothing to mismatch).
 * 3. Neither — the fallback glyph, plus a warning naming the fix.
 *
 * There is deliberately NO `import("@phosphor-icons/vue")` here: a bundler that
 * sees one has to keep all ~1500 icons, which is exactly the cost #42 is about
 * (1315 kB gzip with it, 124 kB without). Consumers who want any-name resolution
 * install a resolver by importing `@itguy614/clean-ui/icons/lazy`, which keeps
 * the package out of every other bundle.
 */
// shallowRef, not ref: a plain ref deep-converts the component definition, which
// makes Vue log "received a Component that was made a reactive object".
const asyncResolved = shallowRef<Component | null>(null);

const staticIcon = computed<Component | null>(() => {
  // toRaw: an icon held in reactive state arrives as a proxy, and rendering a
  // reactive component definition makes Vue warn about the overhead.
  if (props.icon) return toRaw(props.icon);
  if (!props.name) return null;
  return resolveRegisteredIcon(props.name) ?? null;
});

const iconComponent = computed<Component | null>(() => staticIcon.value ?? asyncResolved.value);

function warnUnknown(name: string) {
  warnOnce(
    `[CuiIcon] unknown icon "${name}". Register it so it ships with your bundle:\n` +
      `  import { registerIcons } from "@itguy614/clean-ui";\n` +
      `  import { ${toPascalCase(name)} } from "@phosphor-icons/vue";\n` +
      `  registerIcons({ "${name}": ${toPascalCase(name)} });\n` +
      `Or, to resolve any name at runtime (pulls in the whole icon package):\n` +
      `  import "@itguy614/clean-ui/icons/lazy";`,
  );
}

async function resolveViaFallback(name: string, resolver: IconFallbackResolver) {
  try {
    const resolved = await resolver(name);
    if (!resolved) {
      warnOnce(`[CuiIcon] Icon "${name}" (${toPascalCase(name)}) not found in @phosphor-icons/vue`);
    }
    // Ignore a stale resolution if `name` changed while we were resolving.
    if (props.name === name) asyncResolved.value = resolved ?? FALLBACK_ICON;
  } catch {
    warnOnce(`[CuiIcon] Failed to load icon "${name}"`);
    if (props.name === name) asyncResolved.value = FALLBACK_ICON;
  }
}

watchEffect(() => {
  if (staticIcon.value || !props.name) {
    asyncResolved.value = null;
    return;
  }

  const resolver = getIconFallbackResolver();
  if (!resolver) {
    // Render the "?" glyph rather than nothing, so a typo is visible instead of
    // silently blank — same as pre-1.1 behaviour for a bad name.
    warnUnknown(props.name);
    asyncResolved.value = FALLBACK_ICON;
    return;
  }

  // A resolver can't complete during SSR; the placeholder covers the gap.
  if (typeof window === "undefined") return;
  resolveViaFallback(props.name, resolver);
});

// Unconditional, matching the rest of utils/devWarn: only genuine misuse
// reaches it, and dev detection in a published ESM library is unreliable.
watchEffect(() => {
  if (!props.name && !props.icon) {
    warnOnce("[CuiIcon] requires either a `name` or an `icon` prop.");
  }
});

// Duotone CSS overrides
const wrapperStyle = computed(() => {
  const style: Record<string, string> = {};

  if (props.weight === "duotone") {
    if (props.duotoneColor) {
      style["--_duotone-color"] = props.duotoneColor;
    }
    style["--_duotone-opacity"] = String(props.duotoneOpacity);
  }

  return style;
});
</script>

<template>
  <span
    v-show="!hidden"
    class="cui-icon"
    :class="{ 'cui-icon--duotone': weight === 'duotone' }"
    :style="wrapperStyle"
  >
    <component
      v-if="iconComponent"
      :is="iconComponent"
      :weight="weight"
      :size="resolvedSize"
      :color="resolveColor(color)"
    />
    <!-- Placeholder reserves the icon's box before it resolves (SSR + first
         client tick) so there's no layout shift when it appears. -->
    <span
      v-else
      class="cui-icon__placeholder"
      :style="{ width: resolvedSize, height: resolvedSize }"
      aria-hidden="true"
    />
  </span>
</template>

<style scoped>
.cui-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 0;
}

/* Sized blank box so the icon's footprint is reserved before it resolves. */
.cui-icon__placeholder {
  display: inline-block;
}

/* Duotone overrides — target the secondary layer rendered by Phosphor */
.cui-icon--duotone :deep(svg > *[opacity]) {
  opacity: var(--_duotone-opacity, 0.2);
}

.cui-icon--duotone :deep(svg > *[opacity][fill]) {
  fill: var(--_duotone-color, currentColor);
}
</style>

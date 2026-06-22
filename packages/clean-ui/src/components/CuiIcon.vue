<script setup lang="ts">
import { ref, computed, onMounted, watch, type Component } from "vue";
import type { CuiSize, CuiColorOrCss, HideableProps } from "../types/common";
import { resolveColor } from "../utils/color";

export type IconWeight = "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
export type IconSize = CuiSize | (string & {});

export interface CuiIconProps extends HideableProps {
  /** Phosphor icon name in kebab-case (e.g. "check", "warning-circle", "eye-slash") */
  name: string;
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

// Cache resolved icon components so they're only loaded once per icon name
const iconCache = new Map<string, Component>();
const iconComponent = ref<Component | null>(null);

// Resolve the icon for a given name. Runs in the browser only (called from
// onMounted + a watcher) so the Phosphor import never executes on the server —
// avoiding hydration mismatches. The `requested`/guard handles a reactive
// `name` change whose async import resolves out of order.
async function resolveIcon(name: string) {
  const pascalName = toPascalCase(name);

  if (iconCache.has(pascalName)) {
    iconComponent.value = iconCache.get(pascalName)!;
    return;
  }

  try {
    const mod = await import("@phosphor-icons/vue");
    let resolved = mod[pascalName as keyof typeof mod] as Component | undefined;
    if (!resolved) {
      console.warn(`[CuiIcon] Icon "${name}" (${pascalName}) not found in @phosphor-icons/vue`);
      resolved = mod.PhQuestion as Component;
    }
    iconCache.set(pascalName, resolved);
    // Ignore a stale resolution if `name` changed while we were importing.
    if (props.name === name) iconComponent.value = resolved;
  } catch {
    console.warn(`[CuiIcon] Failed to load icon "${name}"`);
  }
}

onMounted(() => resolveIcon(props.name));
// Re-resolve when the name prop changes (browser-only; onMounted has run).
watch(() => props.name, (name) => resolveIcon(name));

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

<script setup lang="ts">
import { ref, computed, onMounted, type Component } from "vue";
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

onMounted(async () => {
  // onMounted only runs in the browser — never on the server
  // This prevents hydration mismatches from async imports
  const pascalName = toPascalCase(props.name);

  if (iconCache.has(pascalName)) {
    iconComponent.value = iconCache.get(pascalName)!;
    return;
  }

  try {
    const mod = await import("@phosphor-icons/vue");
    const resolved = mod[pascalName as keyof typeof mod] as Component | undefined;
    if (resolved) {
      iconCache.set(pascalName, resolved);
      iconComponent.value = resolved;
    } else {
      console.warn(`[CuiIcon] Icon "${props.name}" (${pascalName}) not found in @phosphor-icons/vue`);
      iconComponent.value = mod.PhQuestion as Component;
    }
  } catch {
    console.warn(`[CuiIcon] Failed to load icon "${props.name}"`);
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

/* Duotone overrides — target the secondary layer rendered by Phosphor */
.cui-icon--duotone :deep(svg > *[opacity]) {
  opacity: var(--_duotone-opacity, 0.2);
}

.cui-icon--duotone :deep(svg > *[opacity][fill]) {
  fill: var(--_duotone-color, currentColor);
}
</style>

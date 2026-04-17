<script setup lang="ts">
import { computed, defineAsyncComponent, type Component } from "vue";

export type IconWeight = "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
export type IconSize = "xs" | "sm" | "md" | "lg" | "xl" | string;

export interface CuiIconProps {
  /** Phosphor icon name in kebab-case (e.g. "check", "warning-circle", "eye-slash") */
  name: string;
  /** Icon weight/style */
  weight?: IconWeight;
  /** Icon size — named or custom CSS value */
  size?: IconSize;
  /** Icon color (default: currentColor, inherits from parent) */
  color?: string;
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

// Cache async components so they're only created once per icon name
const iconCache = new Map<string, Component>();

const iconComponent = computed(() => {
  const pascalName = toPascalCase(props.name);

  if (iconCache.has(pascalName)) {
    return iconCache.get(pascalName)!;
  }

  const comp = defineAsyncComponent(() =>
    import("@phosphor-icons/vue").then((mod: any) => {
      if (mod[pascalName]) return mod[pascalName];
      console.warn(`[CuiIcon] Icon "${props.name}" (${pascalName}) not found in @phosphor-icons/vue`);
      return mod.PhQuestion; // Fallback
    }),
  );

  iconCache.set(pascalName, comp);
  return comp;
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
    class="cui-icon"
    :class="{ 'cui-icon--duotone': weight === 'duotone' }"
    :style="wrapperStyle"
  >
    <component
      :is="iconComponent"
      :weight="weight"
      :size="resolvedSize"
      :color="color"
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

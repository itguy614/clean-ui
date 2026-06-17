<script setup lang="ts">
import { computed } from "vue";
import type { HideableProps, CuiRounded } from "../types/common";

export type CardVariant = "elevated" | "outline" | "ghost";

const radiusMap: Record<CuiRounded, string> = {
  none: "0",
  sm: "0.25rem",
  md: "var(--cui-button-radius, 0.375rem)",
  lg: "0.5rem",
  full: "9999px",
};

export interface CuiCardProps extends HideableProps {
  /** Visual style */
  variant?: CardVariant;
  /** Border radius */
  rounded?: CuiRounded;
}

const props = withDefaults(defineProps<CuiCardProps>(), {
  variant: "elevated",
  hidden: false,
  rounded: "lg",
});

const cardStyle = computed(() => {
  const base: Record<string, string> = {
    borderRadius: radiusMap[props.rounded],
    overflow: "clip",
    background: "var(--cui-surface-base)",
  };

  if (props.variant === "elevated") {
    base.border = "1px solid var(--cui-border)";
    base.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 4px rgba(0, 0, 0, 0.03)";
  } else if (props.variant === "outline") {
    base.border = "1px solid var(--cui-border)";
  } else {
    base.border = "none";
    base.background = "transparent";
  }

  return base;
});
</script>

<template>
  <div v-show="!hidden" :style="cardStyle">
    <slot />
  </div>
</template>

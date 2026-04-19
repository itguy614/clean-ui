<script setup lang="ts">
import { computed } from "vue";

export type CardVariant = "default" | "outline" | "ghost";

export interface CuiCardProps {
  /** Visual style */
  variant?: CardVariant;
  /** Hide the component */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiCardProps>(), {
  variant: "default",
  hidden: false,
});

const cardStyle = computed(() => {
  const base: Record<string, string> = {
    borderRadius: "0.5rem",
    overflow: "clip",
    background: "var(--cui-surface-base)",
  };

  if (props.variant === "default") {
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

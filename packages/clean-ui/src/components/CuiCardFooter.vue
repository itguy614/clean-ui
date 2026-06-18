<script setup lang="ts">
import type { HideableProps } from "../types/common";

export interface CuiCardFooterProps extends HideableProps {
  /** Align footer content */
  align?: "left" | "right" | "center" | "between";
}

const props = withDefaults(defineProps<CuiCardFooterProps>(), {
  align: "right",
  hidden: false,
});

const justifyMap: Record<string, string> = {
  left: "flex-start",
  right: "flex-end",
  center: "center",
  between: "space-between",
};
</script>

<template>
  <div
    v-show="!hidden"
    :style="{
      display: 'flex',
      alignItems: 'center',
      gap: 'calc(0.5rem * var(--cui-density-scale, 1))',
      padding: 'calc(0.375rem * var(--cui-density-scale, 1)) calc(1.125rem * var(--cui-density-scale, 1)) calc(1rem * var(--cui-density-scale, 1))',
      justifyContent: justifyMap[align],
    }"
  >
    <slot />
  </div>
</template>

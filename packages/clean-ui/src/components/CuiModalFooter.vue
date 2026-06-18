<script setup lang="ts">
import type { HideableProps } from "../types/common";

export interface CuiModalFooterProps extends HideableProps {
  /** Align footer content */
  align?: "left" | "right" | "center" | "between";
}

const props = withDefaults(defineProps<CuiModalFooterProps>(), {
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
      padding: 'calc(0.75rem * var(--cui-density-scale, 1)) calc(1.5rem * var(--cui-density-scale, 1)) calc(1.25rem * var(--cui-density-scale, 1))',
      flexShrink: '0',
      justifyContent: justifyMap[align],
      background: 'var(--cui-surface-base)',
      position: 'relative',
      zIndex: '1',
    }"
  >
    <slot />
  </div>
</template>

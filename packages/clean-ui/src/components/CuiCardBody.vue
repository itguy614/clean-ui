<script setup lang="ts">
import type { HideableProps } from "../types/common";

export interface CuiCardBodyProps extends HideableProps {
  /** Remove default padding */
  noPadding?: boolean;
}

withDefaults(defineProps<CuiCardBodyProps>(), {
  noPadding: false,
  hidden: false,
});
</script>

<template>
  <div v-show="!hidden" :style="{ padding: noPadding ? '0' : 'calc(0.5rem * var(--cui-density-scale, 1)) calc(1.125rem * var(--cui-density-scale, 1))' }">
    <slot />
  </div>
</template>

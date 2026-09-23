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
  <div class="cui-card-body" :class="{ 'cui-card-body--flush': noPadding }" v-show="!hidden">
    <slot />
  </div>
</template>

<style scoped>
/* The padding does not vary with any prop, so it is a plain default here rather than an
   inline style — nothing to emit, and `--cui-card-body-padding` overrides it from
   anywhere. Asymmetric paddings take a single shorthand token; `px`/`py` cannot express
   them (#115). */
:where(.cui-card-body) {
  padding: var(
    --cui-card-body-padding,
    calc(0.5rem * var(--cui-density-scale, 1)) calc(1.125rem * var(--cui-density-scale, 1))
  );
}

:where(.cui-card-body--flush) {
  padding: 0;
}
</style>

<script setup lang="ts">
import type { HideableProps } from "../types/common";

export interface CuiModalFooterProps extends HideableProps {
  /** Align footer content */
  align?: "left" | "right" | "center" | "between";
}

withDefaults(defineProps<CuiModalFooterProps>(), {
  align: "right",
  hidden: false,
});
</script>

<template>
  <div class="cui-modal-footer" :class="`cui-modal-footer--${align}`" v-show="!hidden">
    <slot />
  </div>
</template>

<style scoped>
/* Every themeable rule is a whole :where(), so a consumer's plain `.cui-modal-footer { … }` at
   (0,1,0) wins without !important; structure (display, position) keeps normal specificity. */
.cui-modal-footer {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}
:where(.cui-modal-footer) {
  gap: var(--cui-modal-footer-gap, calc(0.5rem * var(--cui-density-scale, 1)));
  padding: calc(0.75rem * var(--cui-density-scale, 1)) var(--cui-modal-footer-px, calc(1.5rem * var(--cui-density-scale, 1))) calc(1.25rem * var(--cui-density-scale, 1));
  background: var(--cui-modal-footer-bg, var(--cui-surface-base));
}
:where(.cui-modal-footer--left) {
  justify-content: flex-start;
}
:where(.cui-modal-footer--right) {
  justify-content: flex-end;
}
:where(.cui-modal-footer--center) {
  justify-content: center;
}
:where(.cui-modal-footer--between) {
  justify-content: space-between;
}
</style>

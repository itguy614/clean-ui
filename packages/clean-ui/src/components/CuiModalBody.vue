<script setup lang="ts">
import CuiScrollArea from "./CuiScrollArea.vue";
import type { HideableProps } from "../types/common";

export interface CuiModalBodyProps extends HideableProps {
  /** Remove default padding */
  noPadding?: boolean;
}

withDefaults(defineProps<CuiModalBodyProps>(), {
  noPadding: false,
  hidden: false,
});
</script>

<template>
  <!--
    A CuiScrollArea (#143): the scroller, the edge fades, and — once the body overflows — a
    named, focusable region, so a body with nothing focusable in it can still be scrolled by
    keyboard (WCAG 2.1.1). It was a bare overflow div before, unreachable by Tab.
    Flex item in the modal column: sizes to its content, then shrinks when the modal hits
    its max-height.
  -->
  <CuiScrollArea class="cui-modal-body" :hidden="hidden">
    <div class="cui-modal-body__content" :class="{ 'cui-modal-body__content--flush': noPadding }">
      <slot />
    </div>
  </CuiScrollArea>
</template>

<style scoped>
/* Every themeable rule is a whole :where(), so a consumer's plain `.cui-modal-body__content { … }`
   at (0,1,0) wins without !important; the flex sizing is structure and keeps normal specificity. */
.cui-modal-body {
  flex: 1 1 auto;
  min-height: 0;
}
:where(.cui-modal-body__content) {
  padding: var(--cui-modal-body-py, calc(0.75rem * var(--cui-density-scale, 1))) var(--cui-modal-body-px, calc(1.5rem * var(--cui-density-scale, 1)));
  font-size: var(--cui-modal-body-font-size, 0.875rem);
  line-height: 1.6;
  color: var(--cui-modal-body-color, var(--cui-text-secondary));
}
/* After the base rule, so it wins at equal specificity; it drops the padding altogether, so
   the padding tokens above cannot bring it back. */
:where(.cui-modal-body__content--flush) {
  padding: 0;
}
</style>

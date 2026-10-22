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
  <CuiScrollArea
    class="cui-modal-body"
    :hidden="hidden"
    :style="{ flex: '1 1 auto', minHeight: '0' }"
  >
    <div
      class="cui-modal-body__content"
      :style="{
        padding: noPadding ? '0' : 'calc(0.75rem * var(--cui-density-scale, 1)) calc(1.5rem * var(--cui-density-scale, 1))',
        fontSize: '0.875rem',
        lineHeight: '1.6',
        color: 'var(--cui-text-secondary)',
      }"
    >
      <slot />
    </div>
  </CuiScrollArea>
</template>

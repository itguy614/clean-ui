<script setup lang="ts">
import { useScrollShadows, scrollShadowTopStyle, scrollShadowBottomStyle } from "../composables/useScrollShadows";

export interface CuiModalBodyProps {
  /** Remove default padding */
  noPadding?: boolean;
  /** Hide the component */
  hidden?: boolean;
}

withDefaults(defineProps<CuiModalBodyProps>(), {
  noPadding: false,
  hidden: false,
});

const { canScrollUp, canScrollDown, onScroll, onMount } = useScrollShadows();
</script>

<template>
  <div v-show="!hidden" :style="{ position: 'relative', flex: '1', minHeight: '0' }">
    <!-- Top scroll shadow -->
    <div v-if="canScrollUp" :style="scrollShadowTopStyle" />

    <!-- Scrollable content -->
    <div
      :ref="onMount"
      :style="{
        height: '100%',
        overflowY: 'auto',
        padding: noPadding ? '0' : '0.75rem 1.5rem',
        fontSize: '0.875rem',
        lineHeight: '1.6',
        color: 'var(--cui-text-secondary)',
      }"
      @scroll="onScroll"
    >
      <slot />
    </div>

    <!-- Bottom scroll shadow -->
    <div v-if="canScrollDown" :style="scrollShadowBottomStyle" />
  </div>
</template>

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
  <!--
    Nested flex approach:
    - Outer wrapper: flex item in the modal column, also a flex column itself.
      flex-basis: auto sizes to content, then shrinks when modal hits max-height.
    - Inner scroll: flex item that fills the wrapper, scrolls overflow.
    - Shadows: absolute on the wrapper, above the scroll content.
  -->
  <div
    v-show="!hidden"
    :style="{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      flex: '1 1 auto',
      minHeight: '0',
      overflow: 'hidden',
    }"
  >
    <!-- Scroll container -->
    <div
      :ref="onMount"
      :style="{
        flex: '1 1 auto',
        minHeight: '0',
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

    <!-- Scroll shadows: absolute positioned on wrapper, above scroll content -->
    <div v-if="canScrollUp" :style="scrollShadowTopStyle" />
    <div v-if="canScrollDown" :style="scrollShadowBottomStyle" />
  </div>
</template>

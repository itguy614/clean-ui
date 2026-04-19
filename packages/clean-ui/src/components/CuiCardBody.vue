<script setup lang="ts">
export interface CuiCardBodyProps {
  /** Remove default padding */
  noPadding?: boolean;
  /** Hide the component */
  hidden?: boolean;
}

withDefaults(defineProps<CuiCardBodyProps>(), {
  noPadding: false,
  hidden: false,
});
</script>

<template>
  <div v-show="!hidden" :style="{ padding: noPadding ? '0' : '0.5rem 1.125rem' }">
    <slot />
  </div>
</template>

<script setup lang="ts">
export interface CuiTimelineProps {
  /** Compact mode — less spacing */
  compact?: boolean;
  /** Hide the component */
  hidden?: boolean;
}

withDefaults(defineProps<CuiTimelineProps>(), {
  compact: false,
  hidden: false,
});
</script>

<template>
  <div
    v-show="!hidden"
    :style="{
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    }"
    role="list"
  >
    <slot />
  </div>
</template>

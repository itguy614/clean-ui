<script setup lang="ts">
import type { HideableProps } from "../types/common";

export type CuiTimelineProps = HideableProps;

withDefaults(defineProps<CuiTimelineProps>(), {
  hidden: false,
});
</script>

<template>
  <div
    class="cui-timeline"
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

<script setup lang="ts">
import type { HideableProps } from "../types/common";

export interface CuiTimelineProps extends HideableProps {
  /** Compact mode — less spacing */
  compact?: boolean;
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

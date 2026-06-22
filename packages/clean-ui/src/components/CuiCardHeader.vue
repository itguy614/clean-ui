<script setup lang="ts">
import type { HideableProps } from "../types/common";

export interface CuiCardHeaderProps extends HideableProps {
  /** Convenience: title text */
  title?: string;
  /** Convenience: subtitle text */
  subtitle?: string;
}

withDefaults(defineProps<CuiCardHeaderProps>(), {
  hidden: false,
});
</script>

<template>
  <div
    v-show="!hidden"
    :style="{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 'calc(0.75rem * var(--cui-density-scale, 1))',
      padding: 'calc(1rem * var(--cui-density-scale, 1)) calc(1.125rem * var(--cui-density-scale, 1)) calc(0.375rem * var(--cui-density-scale, 1))',
    }"
  >
    <div :style="{ flex: '1', minWidth: '0' }">
      <slot>
        <div
          v-if="title"
          :style="{
            fontSize: '1.0625rem',
            fontWeight: '600',
            lineHeight: '1.4',
            color: 'var(--cui-text-emphasis)',
          }"
        >
          {{ title }}
        </div>
        <div
          v-if="subtitle"
          :style="{
            fontSize: '0.8125rem',
            color: 'var(--cui-text-secondary)',
            marginTop: 'calc(0.125rem * var(--cui-density-scale, 1))',
          }"
        >
          {{ subtitle }}
        </div>
      </slot>
    </div>
    <div v-if="$slots.actions" :style="{ display: 'flex', alignItems: 'center', gap: 'calc(0.5rem * var(--cui-density-scale, 1))', flexShrink: '0' }">
      <slot name="actions" />
    </div>
  </div>
</template>

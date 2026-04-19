<script setup lang="ts">
import { computed } from "vue";
import type { ButtonColor } from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";

export interface CuiTimelineItemProps {
  /** Color role for the dot/icon */
  color?: ButtonColor;
  /** Icon name (replaces the dot) */
  icon?: string;
  /** Title text */
  title?: string;
  /** Timestamp or meta text */
  timestamp?: string;
  /** Hide the connector line (use on last item) */
  last?: boolean;
  /** Hide the component */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiTimelineItemProps>(), {
  color: "primary",
  last: false,
  hidden: false,
});

const dotStyle = computed(() => ({
  width: props.icon ? "1.75rem" : "0.75rem",
  height: props.icon ? "1.75rem" : "0.75rem",
  borderRadius: "50%",
  background: props.icon ? `var(--cui-${props.color}-bg)` : `var(--cui-${props.color})`,
  color: `var(--cui-${props.color})`,
  border: props.icon ? `1px solid var(--cui-${props.color}-border)` : "3px solid var(--cui-surface-base, white)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: "0",
  position: "relative" as const,
  zIndex: "1",
  boxShadow: props.icon ? "none" : `0 0 0 3px var(--cui-surface-base, white)`,
}));
</script>

<template>
  <div
    v-show="!hidden"
    :style="{
      display: 'flex',
      gap: '0.875rem',
      position: 'relative',
      paddingBottom: last ? '0' : '1.5rem',
    }"
    role="listitem"
  >
    <!-- Left column: dot/icon + connector line -->
    <div
      :style="{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flexShrink: '0',
        width: icon ? '1.75rem' : '0.75rem',
      }"
    >
      <!-- Dot or icon -->
      <div :style="dotStyle">
        <slot name="icon">
          <CuiIcon v-if="icon" :name="icon" size="0.875rem" />
        </slot>
      </div>

      <!-- Connector line -->
      <div
        v-if="!last"
        :style="{
          width: '2px',
          flex: '1',
          background: 'var(--cui-border)',
          marginTop: '0.375rem',
          borderRadius: '1px',
        }"
      />
    </div>

    <!-- Right column: content -->
    <div :style="{ flex: '1', minWidth: '0', paddingTop: icon ? '0.125rem' : '0' }">
      <!-- Title + timestamp row -->
      <div v-if="title || timestamp" :style="{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }">
        <span
          v-if="title"
          :style="{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: 'var(--cui-text-body)',
            lineHeight: '1.4',
          }"
        >
          {{ title }}
        </span>
        <span
          v-if="timestamp"
          :style="{
            fontSize: '0.75rem',
            color: 'var(--cui-text-tertiary)',
            whiteSpace: 'nowrap',
          }"
        >
          {{ timestamp }}
        </span>
      </div>

      <!-- Body content -->
      <div
        v-if="$slots.default"
        :style="{
          fontSize: '0.8125rem',
          color: 'var(--cui-text-secondary)',
          lineHeight: '1.55',
          marginTop: title ? '0.25rem' : '0',
        }"
      >
        <slot />
      </div>
    </div>
  </div>
</template>

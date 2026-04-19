<script setup lang="ts">
import { computed } from "vue";
import type { ButtonColor } from "./CuiButton.vue";

export type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";
export type SpinnerVariant = "ring" | "dots" | "bars";

export interface CuiSpinnerProps {
  /** Size */
  size?: SpinnerSize;
  /** Color role */
  color?: ButtonColor;
  /** Visual variant */
  variant?: SpinnerVariant;
  /** Accessible label */
  label?: string;
  /** Show label text below the spinner */
  showLabel?: boolean;
  /** Hide the component */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiSpinnerProps>(), {
  size: "md",
  color: "primary",
  variant: "ring",
  label: "Loading",
  showLabel: false,
  hidden: false,
});

const sizeConfig: Record<SpinnerSize, { box: string; stroke: string; dotSize: string; barWidth: string; barHeight: string; labelFont: string; gap: string }> = {
  xs: { box: "0.875rem", stroke: "2px", dotSize: "0.25rem", barWidth: "0.1875rem", barHeight: "0.5rem", labelFont: "0.6875rem", gap: "0.25rem" },
  sm: { box: "1.25rem", stroke: "2px", dotSize: "0.3125rem", barWidth: "0.1875rem", barHeight: "0.625rem", labelFont: "0.75rem", gap: "0.375rem" },
  md: { box: "1.75rem", stroke: "3px", dotSize: "0.375rem", barWidth: "0.25rem", barHeight: "0.875rem", labelFont: "0.8125rem", gap: "0.5rem" },
  lg: { box: "2.5rem", stroke: "3px", dotSize: "0.5rem", barWidth: "0.25rem", barHeight: "1.125rem", labelFont: "0.875rem", gap: "0.5rem" },
  xl: { box: "3.5rem", stroke: "4px", dotSize: "0.625rem", barWidth: "0.3125rem", barHeight: "1.5rem", labelFont: "1rem", gap: "0.625rem" },
};

const cfg = computed(() => sizeConfig[props.size]);
const spinnerColor = computed(() => `var(--cui-${props.color})`);
</script>

<template>
  <div
    v-show="!hidden"
    role="status"
    :aria-label="label"
    :style="{
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: cfg.gap,
    }"
  >
    <!-- Ring variant -->
    <div
      v-if="variant === 'ring'"
      :style="{
        width: cfg.box,
        height: cfg.box,
        borderRadius: '50%',
        border: `${cfg.stroke} solid var(--cui-border)`,
        borderTopColor: spinnerColor,
        animation: 'cui-spin 0.75s linear infinite',
      }"
    />

    <!-- Dots variant -->
    <div
      v-else-if="variant === 'dots'"
      :style="{
        display: 'flex',
        alignItems: 'center',
        gap: cfg.dotSize,
        height: cfg.box,
      }"
    >
      <div
        v-for="i in 3"
        :key="i"
        :style="{
          width: cfg.dotSize,
          height: cfg.dotSize,
          borderRadius: '50%',
          background: spinnerColor,
          animation: `cui-spinner-bounce 1.4s ease-in-out ${(i - 1) * 0.16}s infinite both`,
        }"
      />
    </div>

    <!-- Bars variant -->
    <div
      v-else-if="variant === 'bars'"
      :style="{
        display: 'flex',
        alignItems: 'center',
        gap: `calc(${cfg.barWidth} * 0.75)`,
        height: cfg.box,
      }"
    >
      <div
        v-for="i in 4"
        :key="i"
        :style="{
          width: cfg.barWidth,
          height: cfg.barHeight,
          borderRadius: '9999px',
          background: spinnerColor,
          animation: `cui-spinner-bars 1.2s ease-in-out ${(i - 1) * 0.1}s infinite`,
        }"
      />
    </div>

    <!-- Label -->
    <span
      v-if="showLabel"
      :style="{
        fontSize: cfg.labelFont,
        color: 'var(--cui-text-secondary)',
        fontWeight: '500',
      }"
    >
      {{ label }}
    </span>

    <!-- Screen reader text (always present) -->
    <span v-if="!showLabel" style="position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap;">
      {{ label }}
    </span>
  </div>
</template>

<style>
@keyframes cui-spinner-bounce {
  0%, 80%, 100% { transform: scale(0.4); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

@keyframes cui-spinner-bars {
  0%, 40%, 100% { transform: scaleY(0.5); opacity: 0.4; }
  20% { transform: scaleY(1); opacity: 1; }
}
</style>

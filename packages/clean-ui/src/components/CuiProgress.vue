<script setup lang="ts">
import { computed } from "vue";
import type { ButtonColor } from "./CuiButton.vue";

export type ProgressVariant = "bar" | "circle";
export type ProgressSize = "sm" | "md" | "lg";
export type ProgressAnimation = "none" | "stripe" | "shimmer";

export interface CuiProgressProps {
  /** Current value (0 to max) */
  value?: number;
  /** Maximum value */
  max?: number;
  /** Visual variant */
  variant?: ProgressVariant;
  /** Color role */
  color?: ButtonColor;
  /** Size */
  size?: ProgressSize;
  /** Show percentage label */
  showLabel?: boolean;
  /** Unknown progress — animated indicator */
  indeterminate?: boolean;
  /** Fill animation (bar variant only) */
  animation?: ProgressAnimation;
  /** Hide the component */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiProgressProps>(), {
  value: 0,
  max: 100,
  variant: "bar",
  color: "primary",
  size: "md",
  showLabel: false,
  indeterminate: false,
  animation: "none",
  hidden: false,
});

const percent = computed(() => {
  if (props.indeterminate) return 0;
  return Math.min(Math.max((props.value / props.max) * 100, 0), 100);
});

const percentLabel = computed(() => `${Math.round(percent.value)}%`);

// Bar sizes
const barHeight: Record<ProgressSize, string> = {
  sm: "0.375rem",
  md: "0.625rem",
  lg: "1rem",
};

// Circle sizes
const circleSize: Record<ProgressSize, number> = {
  sm: 40,
  md: 64,
  lg: 96,
};

const circleStroke: Record<ProgressSize, number> = {
  sm: 4,
  md: 5,
  lg: 6,
};

const circleDims = computed(() => {
  const size = circleSize[props.size];
  const stroke = circleStroke[props.size];
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percent.value / 100) * circumference;

  return { size, stroke, radius, circumference, dashOffset };
});

const circleLabelSize: Record<ProgressSize, string> = {
  sm: "0.625rem",
  md: "0.875rem",
  lg: "1.25rem",
};
</script>

<template>
  <!-- Bar variant -->
  <div
    v-if="variant === 'bar'"
    v-show="!hidden"
    class="cui-progress-bar"
    :style="{ '--_progress-color': `var(--cui-${color})`, '--_progress-bg': `var(--cui-${color}-bg)` }"
    role="progressbar"
    :aria-valuenow="indeterminate ? undefined : value"
    :aria-valuemin="0"
    :aria-valuemax="max"
  >
    <div
      class="cui-progress-bar__track"
      :style="{ height: barHeight[size] }"
    >
      <div
        class="cui-progress-bar__fill"
        :class="{
          'cui-progress-bar__fill--indeterminate': indeterminate,
          'cui-progress-bar__fill--stripe': animation === 'stripe' && !indeterminate,
          'cui-progress-bar__fill--shimmer': animation === 'shimmer' && !indeterminate,
        }"
        :style="indeterminate ? {} : { width: `${percent}%` }"
      />
    </div>
    <div v-if="showLabel || $slots.label" class="cui-progress-bar__label">
      <slot name="label" :value="value" :max="max" :percent="percent">
        {{ percentLabel }}
      </slot>
    </div>
  </div>

  <!-- Circle variant -->
  <div
    v-else
    v-show="!hidden"
    class="cui-progress-circle"
    :style="{
      width: `${circleDims.size}px`,
      height: `${circleDims.size}px`,
      '--_progress-color': `var(--cui-${color})`,
      '--_progress-bg': `var(--cui-${color}-bg)`,
    }"
    role="progressbar"
    :aria-valuenow="indeterminate ? undefined : value"
    :aria-valuemin="0"
    :aria-valuemax="max"
  >
    <svg
      :width="circleDims.size"
      :height="circleDims.size"
      class="cui-progress-circle__svg"
      :class="{ 'cui-progress-circle__svg--indeterminate': indeterminate }"
    >
      <!-- Track ring -->
      <circle
        class="cui-progress-circle__track"
        :cx="circleDims.size / 2"
        :cy="circleDims.size / 2"
        :r="circleDims.radius"
        fill="none"
        :stroke-width="circleDims.stroke"
      />
      <!-- Fill ring -->
      <circle
        class="cui-progress-circle__fill"
        :class="{ 'cui-progress-circle__fill--indeterminate': indeterminate }"
        :cx="circleDims.size / 2"
        :cy="circleDims.size / 2"
        :r="circleDims.radius"
        fill="none"
        :stroke-width="circleDims.stroke"
        :stroke-dasharray="circleDims.circumference"
        :stroke-dashoffset="indeterminate ? circleDims.circumference * 0.75 : circleDims.dashOffset"
        stroke-linecap="round"
      />
    </svg>
    <!-- Label -->
    <div
      v-if="(showLabel || $slots.label) && !indeterminate"
      class="cui-progress-circle__label"
      :style="{ fontSize: circleLabelSize[size] }"
    >
      <slot name="label" :value="value" :max="max" :percent="percent">
        {{ percentLabel }}
      </slot>
    </div>
  </div>
</template>

<style scoped>
/* ============================================================
   BAR VARIANT
   ============================================================ */

.cui-progress-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cui-progress-bar__track {
  flex: 1;
  background: var(--_progress-bg);
  border-radius: 9999px;
  overflow: hidden;
}

.cui-progress-bar__fill {
  height: 100%;
  background: var(--_progress-color);
  border-radius: 9999px;
  transition: width 0.4s ease;
}

/* Indeterminate bar animation */
.cui-progress-bar__fill--indeterminate {
  width: 40% !important;
  animation: cui-progress-bar-slide 1.5s ease-in-out infinite;
}

@keyframes cui-progress-bar-slide {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(150%);
  }
  100% {
    transform: translateX(-100%);
  }
}

/* Stripe animation — diagonal stripes scrolling across the fill */
.cui-progress-bar__fill--stripe {
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.15) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.15) 75%,
    transparent 75%,
    transparent
  );
  background-size: 1rem 1rem;
  animation: cui-progress-stripe 0.8s linear infinite;
}

@keyframes cui-progress-stripe {
  from { background-position: 1rem 0; }
  to { background-position: 0 0; }
}

/* Shimmer animation — bright band sweeping across the fill */
.cui-progress-bar__fill--shimmer {
  position: relative;
  overflow: hidden;
}

.cui-progress-bar__fill--shimmer::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 100%
  );
  animation: cui-progress-shimmer 1.5s ease-in-out infinite;
}

@keyframes cui-progress-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.cui-progress-bar__label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--cui-text-secondary);
  white-space: nowrap;
  min-width: 2.5rem;
  text-align: right;
}

/* ============================================================
   CIRCLE VARIANT
   ============================================================ */

.cui-progress-circle {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.cui-progress-circle__svg {
  transform: rotate(-90deg);
}

.cui-progress-circle__track {
  stroke: var(--_progress-bg);
}

.cui-progress-circle__fill {
  stroke: var(--_progress-color);
  transition: stroke-dashoffset 0.4s ease;
}

/* Indeterminate circle — spinning */
.cui-progress-circle__svg--indeterminate {
  animation: cui-spin 1s linear infinite;
}

.cui-progress-circle__fill--indeterminate {
  transition: none;
}

.cui-progress-circle__label {
  position: absolute;
  font-weight: 600;
  color: var(--cui-text-body);
}
</style>

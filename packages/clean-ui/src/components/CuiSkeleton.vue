<script setup lang="ts">
import { computed } from "vue";

export type SkeletonVariant = "text" | "rectangle" | "circle";
export type SkeletonAnimation = "shimmer" | "pulse" | "none";
export type SkeletonRounded = "none" | "sm" | "md" | "lg" | "full";

export interface CuiSkeletonProps {
  /** Shape variant */
  variant?: SkeletonVariant;
  /** Animation style */
  animation?: SkeletonAnimation;
  /** Number of text lines (text variant only) */
  lines?: number;
  /** Width of the last text line for a natural trailing-off look */
  lastLineWidth?: string;
  /** CSS width (rectangle variant) */
  width?: string;
  /** CSS height (rectangle variant) */
  height?: string;
  /** Diameter (circle variant) */
  size?: string;
  /** Border radius (rectangle variant only; circle is always full) */
  rounded?: SkeletonRounded;
  /** Hide the component */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiSkeletonProps>(), {
  variant: "text",
  animation: "shimmer",
  lines: 3,
  lastLineWidth: "60%",
  width: "100%",
  height: "1rem",
  size: "3rem",
  rounded: "sm",
  hidden: false,
});

const radiusMap: Record<SkeletonRounded, string> = {
  none: "0",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  full: "9999px",
};

const rectStyle = computed(() => ({
  width: props.width,
  height: props.height,
  borderRadius: radiusMap[props.rounded],
}));

const circleStyle = computed(() => ({
  width: props.size,
  height: props.size,
  borderRadius: "50%",
}));

function textLineStyle(index: number) {
  const isLast = index === props.lines - 1;
  return {
    width: isLast && props.lines > 1 ? props.lastLineWidth : "100%",
    height: "0.75rem",
    borderRadius: "0.25rem",
  };
}
</script>

<template>
  <div
    v-show="!hidden"
    role="status"
    aria-busy="true"
    aria-label="Loading"
    class="cui-skeleton"
  >
    <!-- Text variant -->
    <template v-if="variant === 'text'">
      <div class="cui-skeleton__text">
        <div
          v-for="i in lines"
          :key="i"
          class="cui-skeleton__line"
          :class="{
            'cui-skeleton__line--shimmer': animation === 'shimmer',
            'cui-skeleton__line--pulse': animation === 'pulse',
          }"
          :style="textLineStyle(i - 1)"
        />
      </div>
    </template>

    <!-- Rectangle variant -->
    <template v-else-if="variant === 'rectangle'">
      <div
        class="cui-skeleton__block"
        :class="{
          'cui-skeleton__block--shimmer': animation === 'shimmer',
          'cui-skeleton__block--pulse': animation === 'pulse',
        }"
        :style="rectStyle"
      />
    </template>

    <!-- Circle variant -->
    <template v-else>
      <div
        class="cui-skeleton__block"
        :class="{
          'cui-skeleton__block--shimmer': animation === 'shimmer',
          'cui-skeleton__block--pulse': animation === 'pulse',
        }"
        :style="circleStyle"
      />
    </template>
  </div>
</template>

<style scoped>
.cui-skeleton {
  display: inline-block;
  width: 100%;
}

/* --- Text lines --- */
.cui-skeleton__text {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cui-skeleton__line {
  background: var(--cui-border);
  position: relative;
  overflow: hidden;
}

/* --- Generic block (rectangle + circle) --- */
.cui-skeleton__block {
  background: var(--cui-border);
  position: relative;
  overflow: hidden;
}

/* --- Shimmer animation --- */
.cui-skeleton__line--shimmer::after,
.cui-skeleton__block--shimmer::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 100%
  );
  animation: cui-skeleton-shimmer 1.5s ease-in-out infinite;
}

:where(.dark, .dark *) .cui-skeleton__line--shimmer::after,
:where(.dark, .dark *) .cui-skeleton__block--shimmer::after {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.08) 50%,
    transparent 100%
  );
}

@keyframes cui-skeleton-shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* --- Pulse animation (uses shared keyframes) --- */
.cui-skeleton__line--pulse,
.cui-skeleton__block--pulse {
  animation: cui-pulse 2s ease-in-out infinite;
}
</style>

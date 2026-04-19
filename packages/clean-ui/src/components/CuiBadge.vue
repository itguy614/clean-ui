<script setup lang="ts">
import { computed } from "vue";
import type { ButtonColor } from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";

export type BadgeVariant = "solid" | "subtle" | "outline";
export type BadgeSize = "sm" | "md";
export type BadgeAnimation = "pulse" | "bounce" | "ping" | "none";

export interface CuiBadgeProps {
  /** Visual variant */
  variant?: BadgeVariant;
  /** Color role */
  color?: ButtonColor;
  /** Size */
  size?: BadgeSize;
  /** Render as a small dot with no text */
  dot?: boolean;
  /** Show remove button (tag mode) */
  removable?: boolean;
  /** Animation */
  animation?: BadgeAnimation;
  /** Hide the component */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiBadgeProps>(), {
  variant: "subtle",
  color: "primary",
  size: "sm",
  dot: false,
  removable: false,
  animation: "none",
  hidden: false,
});

const emit = defineEmits<{
  remove: [];
}>();

const badgeStyle = computed(() => {
  const c = props.color;
  const v = props.variant;

  const base: Record<string, string> = {};

  if (v === "solid") {
    base.background = `var(--cui-${c}-solid, var(--cui-${c}))`;
    base.color = `var(--cui-${c}-text)`;
    base.border = "1px solid transparent";
  } else if (v === "outline") {
    base.background = "transparent";
    base.color = `var(--cui-${c})`;
    base.border = `1px solid var(--cui-${c}-border)`;
  } else {
    // subtle
    base.background = `var(--cui-${c}-bg)`;
    base.color = `var(--cui-${c})`;
    base.border = "1px solid transparent";
  }

  return base;
});

const dotStyle = computed(() => ({
  background: `var(--cui-${props.color})`,
}));
</script>

<template>
  <!-- Dot mode -->
  <span
    v-if="dot"
    v-show="!hidden"
    class="cui-badge cui-badge--dot"
    :class="[
      `cui-badge--${size}`,
      animation !== 'none' ? `cui-badge--${animation}` : '',
    ]"
  >
    <span class="cui-badge__dot" :style="dotStyle" />
    <span v-if="animation === 'ping'" class="cui-badge__ping" :style="dotStyle" />
  </span>

  <!-- Standard badge -->
  <span
    v-else
    v-show="!hidden"
    class="cui-badge"
    :class="[
      `cui-badge--${size}`,
      animation !== 'none' ? `cui-badge--${animation}` : '',
    ]"
    :style="badgeStyle"
  >
    <span class="cui-badge__content">
      <slot />
    </span>
    <button
      v-if="removable"
      type="button"
      class="cui-badge__remove"
      aria-label="Remove"
      @click.stop="emit('remove')"
    >
      <CuiIcon name="x" :size="size === 'sm' ? '0.625rem' : '0.75rem'" />
    </button>
  </span>
</template>

<style scoped>
/* --- Base --- */
.cui-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border-radius: 9999px;
  font-weight: 500;
  white-space: nowrap;
  vertical-align: middle;
  line-height: 1;
}

/* --- Sizes --- */
.cui-badge--sm {
  padding: 0.125rem 0.5rem;
  font-size: 0.6875rem;
}

.cui-badge--md {
  padding: 0.1875rem 0.625rem;
  font-size: 0.8125rem;
}

/* --- Dot mode --- */
.cui-badge--dot {
  position: relative;
  padding: 0;
  border: none;
  background: none;
}

.cui-badge__dot {
  display: block;
  border-radius: 50%;
}

.cui-badge--dot.cui-badge--sm .cui-badge__dot {
  width: 0.5rem;
  height: 0.5rem;
}

.cui-badge--dot.cui-badge--md .cui-badge__dot {
  width: 0.625rem;
  height: 0.625rem;
}

/* --- Remove button (tag mode) --- */
.cui-badge__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
  margin: -0.0625rem -0.125rem -0.0625rem 0;
  border-radius: 50%;
  color: currentColor;
  opacity: 0.6;
  transition: opacity 0.15s ease;
}

.cui-badge__remove:hover {
  opacity: 1;
}

.cui-badge__content {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

/* Animations — use shared keyframes from main.css where possible */
.cui-badge--pulse {
  animation: cui-pulse 2s ease-in-out infinite;
}

.cui-badge--bounce {
  animation: cui-bounce 1s ease infinite;
}

/* Ping is unique to badge (expanding ring on dot) */
.cui-badge__ping {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  opacity: 0.75;
  animation: cui-badge-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}

@keyframes cui-badge-ping {
  0% { transform: scale(1); opacity: 0.75; }
  75%, 100% { transform: scale(2.5); opacity: 0; }
}
</style>

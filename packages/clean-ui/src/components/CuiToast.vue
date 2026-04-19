<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import type { ButtonColor } from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";
import type { AlertAnimation, AlertVariant } from "./CuiAlert.vue";
import { COLOR_ICON_MAP } from "../utils/colorIconMap";

export interface CuiToastProps {
  /** Internal toast id */
  toastId?: string;
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Color role */
  color?: ButtonColor;
  /** Visual variant */
  variant?: AlertVariant;
  /** Show dismiss button */
  dismissible?: boolean;
  /** Auto-dismiss after N ms (0 to disable) */
  autoDismiss?: number;
  /** Show progress countdown bar */
  showProgress?: boolean;
  /** Persistent animation */
  animation?: AlertAnimation;
  /** Custom icon (emoji or text) */
  icon?: string;
  /** Hide the default role icon */
  noIcon?: boolean;
  /** Whether this toast is the topmost (active) — timer only runs when true */
  active?: boolean;
  /** Hide the component */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiToastProps>(), {
  color: "primary",
  variant: "subtle",
  dismissible: true,
  autoDismiss: 5000,
  showProgress: true,
  animation: "none",
  noIcon: false,
  active: true,
  hidden: false,
});

const emit = defineEmits<{
  dismiss: [];
}>();

// Auto-dismiss timer
const isPaused = ref(false);
const elapsed = ref(0);
let intervalId: ReturnType<typeof setInterval> | null = null;
const TICK = 50; // ms

const progressPercent = computed(() => {
  if (!props.autoDismiss || props.autoDismiss === 0) return 0;
  return Math.min((elapsed.value / props.autoDismiss) * 100, 100);
});

function startTimer() {
  if (intervalId) return;
  if (!props.autoDismiss || props.autoDismiss === 0) return;
  intervalId = setInterval(() => {
    if (!isPaused.value && props.active) {
      elapsed.value += TICK;
      if (elapsed.value >= props.autoDismiss!) {
        dismiss();
      }
    }
  }, TICK);
}

// Start timer when becoming the topmost toast
watch(
  () => props.active,
  (isActive) => {
    if (isActive && !intervalId) {
      startTimer();
    }
  },
);

function dismiss() {
  if (intervalId) clearInterval(intervalId);
  emit("dismiss");
}

function onMouseEnter() {
  isPaused.value = true;
}

function onMouseLeave() {
  isPaused.value = false;
}

onMounted(() => {
  if (props.active) {
    startTimer();
  }
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});

// Toast style based on variant
const toastStyle = computed(() => {
  const c = props.color;
  const v = props.variant;
  const base: Record<string, string> = {
    "--_toast-focus-ring": `var(--cui-${c}-focus-ring)`,
  };

  if (v === "solid") {
    base.background = `var(--cui-${c}-solid, var(--cui-${c}))`;
    base.color = `var(--cui-${c}-text)`;
    base["--_toast-icon-color"] = `var(--cui-${c}-text)`;
    base["--_toast-dismiss-color"] = `var(--cui-${c}-text)`;
    base["--_toast-progress-bg"] = "rgb(255 255 255 / 0.2)";
    base["--_toast-progress-bar"] = "rgb(255 255 255 / 0.6)";
  } else if (v === "outline") {
    base.background = "var(--cui-surface-base)";
    base.color = `var(--cui-${c})`;
    base.border = `1px solid var(--cui-${c}-border)`;
    base["--_toast-icon-color"] = `var(--cui-${c})`;
    base["--_toast-dismiss-color"] = "var(--cui-text-secondary)";
    base["--_toast-progress-bg"] = `var(--cui-${c}-bg)`;
    base["--_toast-progress-bar"] = `var(--cui-${c})`;
  } else {
    // subtle (default)
    base.background = `var(--cui-${c}-bg)`;
    base.color = "var(--cui-text-body)";
    base.border = `1px solid var(--cui-${c}-border)`;
    base["--_toast-icon-color"] = `var(--cui-${c})`;
    base["--_toast-dismiss-color"] = "var(--cui-text-secondary)";
    base["--_toast-progress-bg"] = `var(--cui-${c}-border)`;
    base["--_toast-progress-bar"] = `var(--cui-${c})`;
  }

  return base;
});

const defaultIconName = computed(() => COLOR_ICON_MAP[props.color] ?? "info");
</script>

<template>
  <div
    v-show="!hidden"
    class="cui-toast"
    :class="[
      animation !== 'none' ? `cui-toast--${animation}` : '',
    ]"
    :style="toastStyle"
    role="alert"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <!-- Icon -->
    <div v-if="!noIcon" class="cui-toast__icon">
      <template v-if="icon">{{ icon }}</template>
      <CuiIcon v-else :name="defaultIconName" size="1.25rem" />
    </div>

    <!-- Body -->
    <div class="cui-toast__body">
      <div v-if="title" class="cui-toast__title">{{ title }}</div>
      <div v-if="description || $slots.default" class="cui-toast__description">
        <slot>{{ description }}</slot>
      </div>
      <div v-if="$slots.actions" class="cui-toast__actions">
        <slot name="actions" />
      </div>
    </div>

    <!-- Dismiss -->
    <button
      v-if="dismissible"
      type="button"
      class="cui-toast__dismiss"
      aria-label="Dismiss"
      @click="dismiss"
    >
      <CuiIcon name="x" size="0.875rem" />
    </button>

    <!-- Progress bar -->
    <div
      v-if="showProgress && autoDismiss && autoDismiss > 0 && active"
      class="cui-toast__progress"
    >
      <div
        class="cui-toast__progress-bar"
        :style="{ width: `${100 - progressPercent}%` }"
      />
    </div>
  </div>
</template>

<style scoped>
.cui-toast {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: var(--cui-button-radius, 0.375rem);
  min-width: 280px;
  max-width: 420px;
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.15);
  overflow: hidden;
}

/* --- Icon --- */
.cui-toast__icon {
  display: flex;
  flex-shrink: 0;
  margin-top: 0.0625rem;
}

/* --- Body --- */
.cui-toast__body {
  flex: 1;
  min-width: 0;
}

.cui-toast__title {
  font-weight: 600;
  font-size: 0.9375rem;
  line-height: 1.4;
}

.cui-toast__description {
  font-size: 0.8125rem;
  line-height: 1.5;
  opacity: 0.9;
  margin-top: 0.125rem;
}

.cui-toast__actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.625rem;
}

/* --- Icon --- */
.cui-toast__icon {
  color: var(--_toast-icon-color, currentColor);
}

/* --- Dismiss --- */
.cui-toast__dismiss {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--_toast-dismiss-color, currentColor);
  padding: 0;
  border-radius: 0.25rem;
  opacity: 0.6;
  transition: opacity 0.15s ease;
  margin: -0.125rem -0.25rem -0.125rem 0;
}

.cui-toast__dismiss:hover {
  opacity: 1;
}

/* --- Progress bar --- */
.cui-toast__progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--_toast-progress-bg, rgb(255 255 255 / 0.2));
}

.cui-toast__progress-bar {
  height: 100%;
  background: var(--_toast-progress-bar, rgb(255 255 255 / 0.6));
  transition: width 0.05s linear;
  border-radius: 0 3px 0 0;
}

/* Pulse, glow, shake — use shared keyframes from main.css */
.cui-toast--pulse {
  animation: cui-pulse 2.5s ease-in-out infinite;
}

.cui-toast--glow {
  --_cui-glow-color: var(--_toast-focus-ring);
  animation: cui-glow 2s ease-in-out infinite;
}

.cui-toast--shake {
  animation: cui-shake 4s ease-in-out infinite;
}
</style>

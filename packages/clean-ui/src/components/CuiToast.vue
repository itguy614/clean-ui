<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import type { HideableProps, ColorableProps, LiveRegionProps, RoleIconProps } from "../types/common";
import CuiIcon from "./CuiIcon.vue";
import type { AlertAnimation, AlertVariant } from "./CuiAlert.vue";
import { resolveRoleIcon } from "../utils/colorIconMap";
import { useCleanUIDefaults } from "../utils/configure";
import { resolveLiveRegion } from "../utils/liveRegion";
import { useMessages } from "../composables/useMessages";

export interface CuiToastProps extends HideableProps, ColorableProps, LiveRegionProps, RoleIconProps {
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
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
  /** Whether this toast is the topmost (active) — timer only runs when true, unless `pauseWhenInactive` is false */
  active?: boolean;
  /** Pause auto-dismiss while hovered */
  pauseOnHover?: boolean;
  /** Pause auto-dismiss while focus is inside the toast */
  pauseOnFocus?: boolean;
  /**
   * Pause auto-dismiss while the toast is not `active` (another one is on top). With all
   * three `pause*` props false, `autoDismiss` is a wall-clock deadline (#345).
   */
  pauseWhenInactive?: boolean;
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
  pauseOnHover: true,
  pauseOnFocus: true,
  pauseWhenInactive: true,
  hidden: false,
});

const emit = defineEmits<{
  dismiss: [];
}>();

// Auto-dismiss timer. Paused while the pointer is over the toast or focus is in it: a
// keyboard or switch user on the dismiss button or an action gets the same time a pointer
// user does by hovering (#344, WCAG 2.2.1). Each pause can be turned off, for a time limit
// that is genuinely essential, such as a server-side undo window (#345).
const hovered = ref(false);
const focused = ref(false);
/** Whether the countdown (and its bar) runs while this toast isn't the topmost one. */
const counts = computed(() => props.active || !props.pauseWhenInactive);
const isPaused = computed(
  () => !counts.value || (props.pauseOnHover && hovered.value) || (props.pauseOnFocus && focused.value),
);
let elapsed = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
let resumedAt = 0;
let done = false;

// The countdown bar is one CSS animation over autoDismiss (#266), paused with the timer:
// no re-render per tick. It mounts whenever the toast starts counting, so it starts as far
// in as the timer already is — read then, not on every tick.
const countdownFrom = ref(0);
watch(counts, (isCounting) => {
  if (isCounting) countdownFrom.value = elapsed;
}, { immediate: true });

// One timeout for the time that is left, armed while counting; a pause banks the time that
// passed. No polling, and no time lost to a pause. performance.now() is monotonic, so a
// system clock change can't move a deadline.
function stopTimer() {
  if (timer) elapsed += performance.now() - resumedAt;
  clearTimeout(timer);
  timer = undefined;
}

function syncTimer() {
  stopTimer();
  if (isPaused.value || done || !props.autoDismiss) return;
  resumedAt = performance.now();
  timer = setTimeout(dismiss, props.autoDismiss - elapsed);
}

watch([isPaused, () => props.autoDismiss], syncTimer);

function dismiss() {
  // Once only: a hover or focus change while the leave plays must not re-arm it.
  done = true;
  stopTimer();
  emit("dismiss");
}

function onMouseEnter() {
  hovered.value = true;
}

function onMouseLeave() {
  hovered.value = false;
}

function onFocusOut(e: FocusEvent) {
  // Still inside: focus moved from one of the toast's buttons to another.
  if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null)) focused.value = false;
}

onMounted(syncTimer);

onUnmounted(stopTimer);

// Toast style based on variant
const toastStyle = computed(() => {
  const c = props.color;
  const v = props.variant;
  // Paint as private tokens, read back through the stylesheet's :where() (#211).
  const base: Record<string, string> = {
    "--_toast-focus-ring": `var(--cui-${c}-focus-ring)`,
  };

  if (v === "solid") {
    base["--_toast-bg"] = `var(--cui-${c}-solid, var(--cui-${c}))`;
    base["--_toast-color"] = `var(--cui-${c}-text)`;
    base["--_toast-icon-color"] = `var(--cui-${c}-text)`;
    base["--_toast-dismiss-color"] = `var(--cui-${c}-text)`;
    base["--_toast-progress-bg"] = "rgb(255 255 255 / 0.2)";
    base["--_toast-progress-bar"] = "rgb(255 255 255 / 0.6)";
  } else if (v === "outline") {
    base["--_toast-bg"] = "var(--cui-surface-base)";
    base["--_toast-color"] = `var(--cui-${c})`;
    base["--_toast-border"] = `1px solid var(--cui-${c}-border)`;
    base["--_toast-icon-color"] = `var(--cui-${c})`;
    base["--_toast-dismiss-color"] = "var(--cui-text-secondary)";
    base["--_toast-progress-bg"] = `var(--cui-${c}-bg)`;
    base["--_toast-progress-bar"] = `var(--cui-${c})`;
  } else {
    // subtle (default)
    base["--_toast-bg"] = `var(--cui-${c}-bg)`;
    base["--_toast-color"] = "var(--cui-text-body)";
    base["--_toast-border"] = `1px solid var(--cui-${c}-border)`;
    base["--_toast-icon-color"] = `var(--cui-${c})`;
    base["--_toast-dismiss-color"] = "var(--cui-text-secondary)";
    base["--_toast-progress-bg"] = `var(--cui-${c}-border)`;
    base["--_toast-progress-bar"] = `var(--cui-${c})`;
  }

  return base;
});

const defaults = useCleanUIDefaults();
const roleIcon = computed(() => resolveRoleIcon(props.icon, props.color, defaults?.value.roleIcons));

const liveAttrs = computed(() => resolveLiveRegion(props.color, props.live));
const messages = useMessages();
</script>

<template>
  <div
    v-show="!hidden"
    class="cui-toast"
    :class="[
      animation !== 'none' ? `cui-toast--${animation}` : '',
    ]"
    :style="toastStyle"
    v-bind="liveAttrs"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @focusin="focused = true"
    @focusout="onFocusOut"
  >
    <!-- Icon -->
    <div v-if="!noIcon" class="cui-toast__icon">
      <slot name="icon">
        <template v-if="roleIcon.text">{{ roleIcon.text }}</template>
        <CuiIcon v-else :name="roleIcon.name!" size="1.25rem" />
      </slot>
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
      :aria-label="messages.dismiss"
      @click="dismiss"
    >
      <CuiIcon name="x" size="0.875rem" />
    </button>

    <!-- Progress bar -->
    <div
      v-if="showProgress && autoDismiss && counts"
      class="cui-toast__progress"
    >
      <div
        class="cui-toast__progress-bar"
        :style="{
          animationDuration: `${autoDismiss}ms`,
          animationDelay: `-${countdownFrom}ms`,
          animationPlayState: isPaused ? 'paused' : 'running',
        }"
      />
    </div>
  </div>
</template>

<style scoped>
/* --- Themeable: zero specificity, so a consumer's own rule wins (see CuiButton.vue) --- */
:where(.cui-toast) {
  background: var(--cui-toast-bg, var(--_toast-bg));
  color: var(--cui-toast-color, var(--_toast-color));
  border: var(--cui-toast-border, var(--_toast-border, none));
  border-radius: var(--cui-toast-radius, var(--cui-button-radius, var(--cui-radius-md, 0.375rem)));
}

.cui-toast {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: calc(0.75rem * var(--cui-density-scale, 1));
  padding: calc(0.875rem * var(--cui-density-scale, 1)) calc(1rem * var(--cui-density-scale, 1));
  min-width: 280px;
  max-width: 420px;
  box-shadow: var(--cui-shadow-md);
}

/* --- Icon --- */
.cui-toast__icon {
  display: flex;
  flex-shrink: 0;
  margin-top: calc(0.0625rem * var(--cui-density-scale, 1));
}

/* --- Body --- */
.cui-toast__body {
  flex: 1;
  min-width: 0;
  /* The toast doesn't clip its overflow (its glow sits outside it), so a long unbroken
     word or URL wraps instead of running past the edge. */
  overflow-wrap: anywhere;
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
  margin-top: calc(0.125rem * var(--cui-density-scale, 1));
}

.cui-toast__actions {
  display: flex;
  gap: calc(0.5rem * var(--cui-density-scale, 1));
  margin-top: calc(0.625rem * var(--cui-density-scale, 1));
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
  transition: opacity var(--cui-duration-fast) ease;
  margin: calc(-0.125rem * var(--cui-density-scale, 1)) calc(-0.25rem * var(--cui-density-scale, 1)) calc(-0.125rem * var(--cui-density-scale, 1)) 0;
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
  /* Clips the bar to the toast's rounded bottom corners itself, so the toast needs no
     overflow: hidden — which would clip its glow (::after). */
  overflow: hidden;
  border-bottom-left-radius: inherit;
  border-bottom-right-radius: inherit;
}

/* Drains towards the inline-start edge as the time runs down: one linear transform
   animation over the whole autoDismiss, not a width updated per tick (#266). Its duration,
   offset and pause come from the timer, inline. */
.cui-toast__progress-bar {
  width: 100%;
  height: 100%;
  background: var(--_toast-progress-bar, rgb(255 255 255 / 0.6));
  border-radius: 0 3px 0 0;
  animation-name: cui-toast-countdown;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

:where([dir="rtl"]) .cui-toast__progress-bar {
  animation-name: cui-toast-countdown-rtl;
}

@keyframes cui-toast-countdown {
  from { transform: translateX(0); }
  to { transform: translateX(-100%); }
}

@keyframes cui-toast-countdown-rtl {
  from { transform: translateX(0); }
  to { transform: translateX(100%); }
}

/* Pulse, glow, shake — use shared keyframes from main.css */
.cui-toast--pulse {
  animation: cui-pulse 2.5s ease-in-out infinite;
}

.cui-toast--glow::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: 0 0 12px 2px var(--_toast-focus-ring);
  pointer-events: none;
  animation: cui-glow-fade 2s ease-in-out infinite;
}

.cui-toast--shake {
  animation: cui-shake 4s ease-in-out infinite;
}
</style>

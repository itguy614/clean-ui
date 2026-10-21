<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import type { HideableProps, ColorableProps, CuiRounded, LiveRegionProps, RoleIconProps } from "../types/common";
import CuiIcon from "./CuiIcon.vue";
import { resolveRoleIcon } from "../utils/colorIconMap";
import { resolveLiveRegion } from "../utils/liveRegion";
import { warnVariantColor } from "../utils/devWarn";
import { useMessages } from "../composables/useMessages";
import { RADIUS_SCALE } from "../utils/sizing";

export type AlertVariant = "solid" | "subtle" | "outline";
export type AlertEntrance = "fade" | "slide-down" | "slide-left" | "none";
export type AlertAnimation = "pulse" | "glow" | "shake" | "none";

export interface CuiAlertProps extends HideableProps, ColorableProps, LiveRegionProps, RoleIconProps {
  /** Visual variant */
  variant?: AlertVariant;
  /** Title text */
  title?: string;
  /** Show dismiss X button */
  dismissible?: boolean;
  /** Auto-dismiss after N milliseconds */
  autoDismiss?: number;
  /** Entrance animation */
  entrance?: AlertEntrance;
  /** Persistent animation while visible */
  animation?: AlertAnimation;
  /** Border radius */
  rounded?: CuiRounded;
}

const props = withDefaults(defineProps<CuiAlertProps>(), {
  color: "info",
  variant: "subtle",
  noIcon: false,
  dismissible: false,
  entrance: "fade",
  animation: "none",
  hidden: false,
  rounded: "md",
});

warnVariantColor("CuiAlert", { value: props.variant, allowed: ["solid", "subtle", "outline"] }, props.color);

const emit = defineEmits<{
  dismiss: [];
}>();

const visible = ref(true);
const mounted = ref(false);

// Auto-dismiss timer
let timer: ReturnType<typeof setTimeout> | null = null;

onMounted(() => {
  // Trigger entrance animation after mount
  requestAnimationFrame(() => {
    mounted.value = true;
  });

  if (props.autoDismiss && props.autoDismiss > 0) {
    timer = setTimeout(() => {
      dismiss();
    }, props.autoDismiss);
  }
});

onUnmounted(() => {
  if (timer) clearTimeout(timer);
});

function dismiss() {
  mounted.value = false;
  // Wait for exit animation before hiding
  setTimeout(() => {
    visible.value = false;
    emit("dismiss");
  }, 300);
}

const alertStyle = computed(() => {
  const c = props.color;
  const v = props.variant;
  const base: Record<string, string> = {
    // Paint as private tokens, read back through the stylesheet's :where() (#211).
    "--_alert-radius": RADIUS_SCALE[props.rounded],
    "--_alert-focus-ring": `var(--cui-${c}-focus-ring)`,
  };

  if (v === "solid") {
    base["--_alert-bg"] = `var(--cui-${c}-solid, var(--cui-${c}))`;
    base["--_alert-color"] = `var(--cui-${c}-text)`;
    base["--_alert-border"] = "1px solid transparent";
    base["--_alert-icon-color"] = `var(--cui-${c}-text)`;
    base["--_alert-dismiss-color"] = `var(--cui-${c}-text)`;
  } else if (v === "outline") {
    base["--_alert-bg"] = "transparent";
    base["--_alert-color"] = `var(--cui-${c})`;
    base["--_alert-border"] = `1px solid var(--cui-${c}-border)`;
    base["--_alert-icon-color"] = `var(--cui-${c})`;
    base["--_alert-dismiss-color"] = `var(--cui-${c})`;
  } else {
    // subtle
    base["--_alert-bg"] = `var(--cui-${c}-bg)`;
    base["--_alert-color"] = `var(--cui-text-body)`;
    base["--_alert-border"] = `1px solid var(--cui-${c}-border)`;
    base["--_alert-icon-color"] = `var(--cui-${c})`;
    base["--_alert-dismiss-color"] = `var(--cui-text-secondary)`;
  }

  return base;
});

const roleIcon = computed(() => resolveRoleIcon(props.icon, props.color));

const liveAttrs = computed(() => resolveLiveRegion(props.color, props.live));
const messages = useMessages();
</script>

<template>
  <div
    v-if="visible"
    v-show="!hidden"
    class="cui-alert"
    :class="[
      `cui-alert--entrance-${entrance}`,
      { 'cui-alert--mounted': mounted },
      animation !== 'none' ? `cui-alert--${animation}` : '',
    ]"
    :style="alertStyle"
    v-bind="liveAttrs"
  >
    <!-- Icon -->
    <div v-if="!noIcon" class="cui-alert__icon">
      <slot name="icon">
        <template v-if="roleIcon.text">{{ roleIcon.text }}</template>
        <CuiIcon v-else :name="roleIcon.name!" size="1.25rem" />
      </slot>
    </div>

    <!-- Body -->
    <div class="cui-alert__body">
      <div v-if="title" class="cui-alert__title">{{ title }}</div>
      <div v-if="$slots.default" class="cui-alert__description">
        <slot />
      </div>
      <div v-if="$slots.actions" class="cui-alert__actions">
        <slot name="actions" />
      </div>
    </div>

    <!-- Dismiss -->
    <button
      v-if="dismissible"
      type="button"
      class="cui-alert__dismiss"
      :aria-label="messages.dismiss"
      @click="dismiss"
    >
      <CuiIcon name="x" size="0.875rem" />
    </button>
  </div>
</template>

<style scoped>
/* --- Themeable: zero specificity, so a consumer's own rule wins (see CuiButton.vue) --- */
:where(.cui-alert) {
  background: var(--cui-alert-bg, var(--_alert-bg));
  color: var(--cui-alert-color, var(--_alert-color));
  border: var(--cui-alert-border, var(--_alert-border));
  border-radius: var(--cui-alert-radius, var(--_alert-radius));
}

.cui-alert {
  display: flex;
  align-items: flex-start;
  gap: calc(0.75rem * var(--cui-density-scale, 1));
  padding: calc(0.875rem * var(--cui-density-scale, 1)) calc(1rem * var(--cui-density-scale, 1));
  position: relative;
}

/* --- Icon --- */
.cui-alert__icon {
  display: flex;
  flex-shrink: 0;
  color: var(--_alert-icon-color);
  margin-top: calc(0.0625rem * var(--cui-density-scale, 1));
}

/* --- Body --- */
.cui-alert__body {
  flex: 1;
  min-width: 0;
}

.cui-alert__title {
  font-weight: 600;
  font-size: 0.9375rem;
  line-height: 1.4;
  margin-bottom: calc(0.125rem * var(--cui-density-scale, 1));
}

.cui-alert__description {
  font-size: 0.875rem;
  line-height: 1.5;
  opacity: 0.9;
}

.cui-alert__actions {
  display: flex;
  gap: calc(0.5rem * var(--cui-density-scale, 1));
  margin-top: calc(0.625rem * var(--cui-density-scale, 1));
}

/* --- Dismiss --- */
.cui-alert__dismiss {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--_alert-dismiss-color);
  padding: 0;
  border-radius: 0.25rem;
  opacity: 0.6;
  transition: opacity 0.15s ease;
  margin: calc(-0.125rem * var(--cui-density-scale, 1)) calc(-0.25rem * var(--cui-density-scale, 1)) calc(-0.125rem * var(--cui-density-scale, 1)) 0;
}

.cui-alert__dismiss:hover {
  opacity: 1;
}

/* ============================================================
   ENTRANCE ANIMATIONS
   ============================================================ */

/* Fade */
.cui-alert--entrance-fade {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.cui-alert--entrance-fade.cui-alert--mounted {
  opacity: 1;
}

/* Slide down */
.cui-alert--entrance-slide-down {
  opacity: 0;
  transform: translateY(-1rem);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.cui-alert--entrance-slide-down.cui-alert--mounted {
  opacity: 1;
  transform: translateY(0);
}

/* Slide left */
.cui-alert--entrance-slide-left {
  opacity: 0;
  transform: translateX(2rem);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.cui-alert--entrance-slide-left.cui-alert--mounted {
  opacity: 1;
  transform: translateX(0);
}

/* None */
.cui-alert--entrance-none {
  opacity: 1;
}

/* ============================================================
   PERSISTENT ANIMATIONS
   ============================================================ */

/* Pulse, glow, shake — use shared keyframes from main.css */
.cui-alert--pulse.cui-alert--mounted {
  animation: cui-pulse 2.5s ease-in-out infinite;
}

.cui-alert--glow.cui-alert--mounted {
  --_cui-glow-color: var(--_alert-focus-ring);
  animation: cui-glow 2s ease-in-out infinite;
}

.cui-alert--shake.cui-alert--mounted {
  animation: cui-shake 4s ease-in-out infinite;
}
</style>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted, toRef } from "vue";
import { usePopover, type PopoverPlacement } from "../composables/usePopover";
import type { ButtonColor } from "./CuiButton.vue";

export type TooltipTrigger = "hover" | "focus" | "click" | "hover-focus";

export interface CuiTooltipProps {
  /** Simple text content */
  text?: string;
  /** Preferred placement */
  placement?: PopoverPlacement;
  /** How the tooltip is triggered */
  trigger?: TooltipTrigger;
  /** Delay before showing (ms) */
  showDelay?: number;
  /** Delay before hiding (ms) */
  hideDelay?: number;
  /** Hide the arrow */
  noArrow?: boolean;
  /** Color role (default: dark neutral) */
  color?: ButtonColor;
  /** Manual visibility control */
  visible?: boolean;
  /** Disabled — prevents showing */
  disabled?: boolean;
  /** Hide the component */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiTooltipProps>(), {
  placement: "top",
  trigger: "hover-focus",
  showDelay: 200,
  hideDelay: 100,
  noArrow: false,
  disabled: false,
  hidden: false,
});

const emit = defineEmits<{
  "update:visible": [value: boolean];
}>();

const isVisible = ref(false);
let showTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

// Sync with v-model:visible
watch(
  () => props.visible,
  (val) => {
    if (val !== undefined) isVisible.value = val;
  },
);

const { referenceRef, floatingRef, arrowRef, floatingStyles, arrowStyle, currentSide } = usePopover({
  placement: toRef(props, "placement"),
  offsetDistance: 8,
  arrow: !props.noArrow,
});

function show() {
  if (props.disabled) return;
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  showTimer = setTimeout(() => {
    isVisible.value = true;
    emit("update:visible", true);
  }, props.showDelay);
}

function hide() {
  if (showTimer) {
    clearTimeout(showTimer);
    showTimer = null;
  }
  hideTimer = setTimeout(() => {
    isVisible.value = false;
    emit("update:visible", false);
  }, props.hideDelay);
}

function toggle() {
  if (isVisible.value) {
    hide();
  } else {
    show();
  }
}

// Event handlers based on trigger
function onMouseEnter() {
  if (props.trigger === "hover" || props.trigger === "hover-focus") show();
}

function onMouseLeave() {
  if (props.trigger === "hover" || props.trigger === "hover-focus") hide();
}

function onFocusIn() {
  if (props.trigger === "focus" || props.trigger === "hover-focus") show();
}

function onFocusOut() {
  if (props.trigger === "focus" || props.trigger === "hover-focus") hide();
}

function onClick() {
  if (props.trigger === "click") toggle();
}

// Close on Escape
function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && isVisible.value) {
    hide();
  }
}

// Keep tooltip open when hovering over it
function onTooltipMouseEnter() {
  if (props.trigger === "hover" || props.trigger === "hover-focus") {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  }
}

function onTooltipMouseLeave() {
  if (props.trigger === "hover" || props.trigger === "hover-focus") {
    hide();
  }
}

onUnmounted(() => {
  if (showTimer) clearTimeout(showTimer);
  if (hideTimer) clearTimeout(hideTimer);
});

// Tooltip background/text colors
const tooltipStyle = computed(() => {
  if (props.color) {
    return {
      background: `var(--cui-${props.color})`,
      color: `var(--cui-${props.color}-text)`,
      "--_arrow-bg": `var(--cui-${props.color})`,
    };
  }
  return {};
});

const hasContent = computed(() => props.text || true); // #content slot checked in template
</script>

<template>
  <div
    v-show="!hidden"
    class="cui-tooltip-wrapper"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
    @click="onClick"
    @keydown="onKeydown"
  >
    <!-- Trigger (default slot) -->
    <div ref="referenceRef" class="cui-tooltip__trigger">
      <slot />
    </div>

    <!-- Tooltip -->
    <Teleport to="body">
      <div
        v-if="isVisible"
        ref="floatingRef"
        class="cui-tooltip"
        :class="[
          props.color ? `cui-tooltip--colored` : 'cui-tooltip--default',
          `cui-tooltip--${currentSide}`,
        ]"
        :style="{ ...floatingStyles, ...tooltipStyle }"
        role="tooltip"
        @mouseenter="onTooltipMouseEnter"
        @mouseleave="onTooltipMouseLeave"
      >
        <div class="cui-tooltip__content">
          <slot name="content">{{ text }}</slot>
        </div>

        <!-- Arrow -->
        <div
          v-if="!noArrow"
          ref="arrowRef"
          class="cui-tooltip__arrow"
          :style="arrowStyle"
        />
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.cui-tooltip-wrapper {
  display: inline-flex;
}

.cui-tooltip__trigger {
  display: inline-flex;
}

/* --- Tooltip --- */
.cui-tooltip {
  z-index: 9999;
  padding: 0.375rem 0.625rem;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  line-height: 1.4;
  max-width: 280px;
  word-wrap: break-word;
  pointer-events: auto;
  animation: cui-tooltip-in 0.15s ease;
}

@keyframes cui-tooltip-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Default (dark) theme */
.cui-tooltip--default {
  background: var(--color-surface-900);
  color: var(--color-surface-100);
  --_arrow-bg: var(--color-surface-900);
}

:where(.dark, .dark *) .cui-tooltip--default {
  background: var(--color-surface-700);
  color: var(--color-surface-100);
  --_arrow-bg: var(--color-surface-700);
}

/* --- Arrow --- */
.cui-tooltip__arrow {
  width: 8px;
  height: 8px;
  background: var(--_arrow-bg);
  transform: rotate(45deg);
  position: absolute;
}

/* Prevent arrow from poking through rounded corners */
.cui-tooltip--top .cui-tooltip__arrow {
  clip-path: polygon(0% 0%, 100% 0%, 100% 100%);
}

.cui-tooltip--bottom .cui-tooltip__arrow {
  clip-path: polygon(0% 0%, 0% 100%, 100% 100%);
}

.cui-tooltip--left .cui-tooltip__arrow {
  clip-path: polygon(0% 0%, 100% 0%, 100% 100%);
}

.cui-tooltip--right .cui-tooltip__arrow {
  clip-path: polygon(0% 0%, 0% 100%, 100% 100%);
}

.cui-tooltip__content {
  position: relative;
  z-index: 1;
}
</style>

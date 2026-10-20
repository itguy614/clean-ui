<script setup lang="ts">
import { ref, computed, watch, onUnmounted, toRef } from "vue";
import { usePopover, type PopoverPlacement } from "../composables/usePopover";
import { useLayerStack } from "../composables/useLayerStack";
import type { HideableProps, ColorableProps, DisableableProps } from "../types/common";

export type TooltipTrigger = "hover" | "focus" | "click" | "hover-focus";

export interface CuiTooltipProps extends HideableProps, ColorableProps, DisableableProps {
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
  /** Manual visibility control */
  visible?: boolean;
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

// Sync with v-model:visible. Immediate, so one that starts visible renders visible (#248).
watch(
  () => props.visible,
  (val) => {
    if (val !== undefined) isVisible.value = val;
  },
  { immediate: true },
);

const { referenceRef, floatingRef, arrowRef, floatingStyles, arrowStyle, currentSide, isPositioned } = usePopover({
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

function clearTimers() {
  if (showTimer) clearTimeout(showTimer);
  if (hideTimer) clearTimeout(hideTimer);
  showTimer = hideTimer = null;
}

function hideNow() {
  clearTimers();
  isVisible.value = false;
  emit("update:visible", false);
}

function hide() {
  clearTimers();
  hideTimer = setTimeout(hideNow, props.hideDelay);
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

// Escape dismisses a visible tooltip wherever focus is (WCAG 1.4.13), not only from
// inside its trigger (#254), and at once — a dismissal shouldn't wait out hideDelay. The
// shared layer stack (#278) decides whether it is this tooltip's Escape: one opened inside
// a modal sits above it and closes first; one left showing beneath a modal opened later
// does not take the modal's Escape.
useLayerStack({ active: isVisible, onEscape: hideNow });

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
  clearTimers();
});

// Tooltip background/text colors
/**
 * How the tooltip is hidden for the frame or two before Floating UI has
 * positioned it (#88).
 *
 * NOT `visibility: hidden`, which was the original guard: `focus()` on a
 * `visibility: hidden` element is a silent no-op, so any consumer moving focus
 * into the tooltip on open was racing the positioning, and lost intermittently
 * (#112). Two of them grew retry loops to work around it.
 *
 * `animation: none` is load-bearing, not tidiness. A CSS animation overrides
 * inline styles, and the tooltip's scale-in animates `opacity` from 0 to 1 — so
 * `opacity: 0` alone would be overridden the moment it started, and the tooltip
 * would appear at the origin before being positioned, which is exactly the
 * flash #88 fixed. Withholding the animation also means it plays from the final
 * position rather than starting mid-move.
 */
const hiddenUntilPositioned = computed(() => {
  const styles: Record<string, string> = {};
  if (isPositioned.value) return styles;
  styles.opacity = "0";
  styles.pointerEvents = "none";
  styles.animation = "none";
  return styles;
});

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
        :style="{ ...floatingStyles, ...tooltipStyle, ...hiddenUntilPositioned }"
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
  z-index: calc(var(--cui-z-overlay, 9990) + 9); /* TOOLTIP_Z_INDEX in utils/position.ts */
  padding: calc(0.375rem * var(--cui-density-scale, 1)) calc(0.625rem * var(--cui-density-scale, 1));
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

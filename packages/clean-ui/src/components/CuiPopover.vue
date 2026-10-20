<script setup lang="ts">
import { ref, computed, watch, onUnmounted, useSlots } from "vue";
import { useCuiId } from "../composables/useCuiId";
import { usePopover, type PopoverPlacement } from "../composables/usePopover";
import { useClickOutside } from "../composables/useClickOutside";
import { useLayerStack } from "../composables/useLayerStack";
import CuiIcon from "./CuiIcon.vue";
import type { HideableProps, DisableableProps, CuiRounded } from "../types/common";
import { useMessages } from "../composables/useMessages";
import { RADIUS_SCALE } from "../utils/sizing";

export type PopoverTrigger = "click" | "hover" | "focus" | "hover-focus";

export interface CuiPopoverProps extends HideableProps, DisableableProps {
  /** Optional header title — renders header bar with close button */
  title?: string;
  /** Preferred placement */
  placement?: PopoverPlacement;
  /** How the popover is triggered */
  trigger?: PopoverTrigger;
  /** Delay before showing (ms) */
  showDelay?: number;
  /** Delay before hiding (ms) */
  hideDelay?: number;
  /** Hide the arrow */
  noArrow?: boolean;
  /** Distance from trigger (px) */
  offset?: number;
  /** Fixed width (e.g., "320px") */
  width?: string;
  /** Manual visibility control */
  visible?: boolean;
  /** Show close button in header */
  closable?: boolean;
  /** Border radius */
  rounded?: CuiRounded;
}

const props = withDefaults(defineProps<CuiPopoverProps>(), {
  placement: "bottom",
  trigger: "click",
  showDelay: 0,
  hideDelay: 100,
  noArrow: false,
  disabled: false,
  closable: true,
  rounded: "lg",
  hidden: false,
});

const emit = defineEmits<{
  "update:visible": [value: boolean];
}>();

const slots = useSlots();

const isVisible = ref(false);
let showTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

// Immediate, so a controlled popover that starts open renders open (#248). An absent
// `visible` is cast to false, which is the initial state anyway.
watch(
  () => props.visible,
  (val) => {
    if (val !== undefined) isVisible.value = val;
  },
  { immediate: true },
);

const { referenceRef, floatingRef, arrowRef, floatingStyles, arrowStyle, currentSide, isPositioned } = usePopover({
  placement: computed(() => props.placement),
  offsetDistance: computed(() => props.offset ?? 10),
  arrow: !props.noArrow,
});

const wrapperRef = ref<HTMLElement | null>(null);

useClickOutside(
  () => [wrapperRef.value, floatingRef.value],
  () => {
    if (isVisible.value && props.trigger === "click") doHide();
  },
);

// Close on Escape from anywhere — the panel is teleported to <body>, so a wrapper-scoped
// keydown misses it once focus moves into the panel. Through the shared layer stack
// (#278), so only the topmost of a popover and the overlays around it closes.
useLayerStack({ active: isVisible, onEscape: hideNow });

function doShow() {
  if (props.disabled) return;
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
  if (props.showDelay > 0) {
    showTimer = setTimeout(() => { isVisible.value = true; emit("update:visible", true); }, props.showDelay);
  } else {
    isVisible.value = true; emit("update:visible", true);
  }
}

function doHide() {
  if (showTimer) { clearTimeout(showTimer); showTimer = null; }
  if (props.hideDelay > 0) {
    hideTimer = setTimeout(() => { isVisible.value = false; emit("update:visible", false); }, props.hideDelay);
  } else {
    isVisible.value = false; emit("update:visible", false);
  }
}

// A dismissal doesn't wait out hideDelay: the popover would stay top of the layer stack
// meanwhile and swallow the next Escape, meant for the layer beneath.
function hideNow() {
  if (showTimer) { clearTimeout(showTimer); showTimer = null; }
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
  isVisible.value = false; emit("update:visible", false);
}

function toggle() { isVisible.value ? doHide() : doShow(); }
function onMouseEnter() { if (props.trigger === "hover" || props.trigger === "hover-focus") doShow(); }
function onMouseLeave() { if (props.trigger === "hover" || props.trigger === "hover-focus") doHide(); }
function onFocusIn() { if (props.trigger === "focus" || props.trigger === "hover-focus") doShow(); }
function onFocusOut() { if (props.trigger === "focus" || props.trigger === "hover-focus") doHide(); }
function onClick() { if (props.trigger === "click") toggle(); }
function onPopoverMouseEnter() { if (props.trigger === "hover" || props.trigger === "hover-focus") { if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; } } }
function onPopoverMouseLeave() { if (props.trigger === "hover" || props.trigger === "hover-focus") doHide(); }

onUnmounted(() => {
  if (showTimer) clearTimeout(showTimer);
  if (hideTimer) clearTimeout(hideTimer);
});

// Plain functions, not computeds: `slots` is not reactive, so a computed would cache the
// first render's answer and miss a #header/#footer the parent adds or removes later.
const hasHeader = () => !!(props.title || slots.header);
const hasFooter = () => !!slots.footer;
// Per instance (a literal id collided across every titled popover on a page,
// #159), and whenever there is a header — prop or slot — so a custom #header
// still names the dialog. Stable across SSR and hydration (useCuiId).
const headerId = useCuiId("popover-title");

const panelStyle = computed(() => {
  const s: Record<string, string> = {
    zIndex: "9998",
    background: "var(--cui-surface-base)",
    border: "1px solid var(--cui-border)",
    borderRadius: RADIUS_SCALE[props.rounded],
    boxShadow: "0 8px 24px -4px rgba(0, 0, 0, 0.12), 0 2px 8px -2px rgba(0, 0, 0, 0.08)",
    minWidth: "12rem",
    maxWidth: "24rem",
    pointerEvents: "auto",
    animation: "cui-scale-in 0.15s ease",
    overflow: "hidden",
  };
  if (props.width) s.width = props.width;
  return s;
});

/**
 * How the panel is hidden for the frame or two before Floating UI has
 * positioned it (#88).
 *
 * NOT `visibility: hidden`, which was the original guard: `focus()` on a
 * `visibility: hidden` element is a silent no-op, so any consumer moving focus
 * into the panel on open was racing the positioning, and lost intermittently
 * (#112). Two of them grew retry loops to work around it.
 *
 * `animation: none` is load-bearing, not tidiness. A CSS animation overrides
 * inline styles, and the panel's scale-in animates `opacity` from 0 to 1 — so
 * `opacity: 0` alone would be overridden the moment it started, and the panel
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

const arrowElStyle = computed(() => ({
  width: "8px",
  height: "8px",
  background: "var(--cui-surface-base)",
  border: "1px solid var(--cui-border)",
  transform: "rotate(45deg)",
  position: "absolute" as const,
  ...arrowStyle.value,
}));

// Clip-path per side so arrow doesn't poke through rounded corners
const arrowClipPaths: Record<string, string> = {
  top: "polygon(0% 0%, 100% 0%, 100% 100%)",
  bottom: "polygon(0% 0%, 0% 100%, 100% 100%)",
  left: "polygon(0% 0%, 100% 0%, 100% 100%)",
  right: "polygon(0% 0%, 0% 100%, 100% 100%)",
};
const messages = useMessages();
</script>

<template>
  <div
    class="cui-popover"
    ref="wrapperRef"
    v-show="!hidden"
    :style="{ display: 'inline-flex' }"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
    @click="onClick"
  >
    <div ref="referenceRef" :style="{ display: 'inline-flex' }">
      <slot />
    </div>

    <Teleport to="body">
      <div
        v-if="isVisible"
        ref="floatingRef"
        class="cui-popover__panel"
        :style="{ ...floatingStyles, ...panelStyle, ...hiddenUntilPositioned }"
        role="dialog"
        :aria-labelledby="hasHeader() ? headerId : undefined"
        @mouseenter="onPopoverMouseEnter"
        @mouseleave="onPopoverMouseLeave"
      >
        <!-- Header -->
        <div
          v-if="hasHeader()"
          :style="{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 'calc(0.5rem * var(--cui-density-scale, 1))',
            padding: 'calc(0.75rem * var(--cui-density-scale, 1)) calc(0.875rem * var(--cui-density-scale, 1)) calc(0.25rem * var(--cui-density-scale, 1))',
          }"
        >
          <!-- The id sits on a wrapper so slotted header content is named too, and the
               close button is left out of the name. display: contents keeps the slot's
               children laid out as direct flex items of the header row, as before. -->
          <div :id="headerId" style="display: contents">
            <slot name="header">
              <span :style="{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--cui-text-body)' }">
                {{ title }}
              </span>
            </slot>
          </div>
          <button
            v-if="closable"
            type="button"
            :style="{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '1.375rem',
              height: '1.375rem',
              border: 'none',
              background: 'none',
              borderRadius: '0.25rem',
              color: 'var(--cui-text-tertiary)',
              cursor: 'pointer',
              flexShrink: '0',
              marginTop: 'calc(-0.0625rem * var(--cui-density-scale, 1))',
              marginRight: 'calc(-0.125rem * var(--cui-density-scale, 1))',
            }"
            :aria-label="messages.close"
            @click.stop="doHide"
          >
            <CuiIcon name="x" size="0.8125rem" />
          </button>
        </div>

        <!-- Body -->
        <div
          :style="{
            padding: hasHeader() ? 'calc(0.25rem * var(--cui-density-scale, 1)) calc(0.875rem * var(--cui-density-scale, 1)) calc(0.75rem * var(--cui-density-scale, 1))' : 'calc(0.75rem * var(--cui-density-scale, 1)) calc(0.875rem * var(--cui-density-scale, 1))',
            fontSize: '0.875rem',
            lineHeight: '1.55',
            color: 'var(--cui-text-secondary)',
          }"
        >
          <slot name="content" />
        </div>

        <!-- Footer -->
        <div
          v-if="hasFooter()"
          :style="{
            padding: '0 calc(0.875rem * var(--cui-density-scale, 1)) calc(0.75rem * var(--cui-density-scale, 1))',
          }"
        >
          <slot name="footer" />
        </div>

        <!-- Arrow -->
        <div
          v-if="!noArrow"
          ref="arrowRef"
          :style="{
            ...arrowElStyle,
            clipPath: arrowClipPaths[currentSide] || undefined,
          }"
        />
      </div>
    </Teleport>
  </div>
</template>

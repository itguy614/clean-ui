<script setup lang="ts">
import { ref, computed, watch, onUnmounted, useSlots } from "vue";
import { usePopover, type PopoverPlacement } from "../composables/usePopover";
import { useClickOutside } from "../composables/useClickOutside";
import CuiIcon from "./CuiIcon.vue";

export type PopoverTrigger = "click" | "hover" | "focus" | "hover-focus";

export interface CuiPopoverProps {
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
  /** Prevents showing */
  disabled?: boolean;
  /** Show close button in header */
  closable?: boolean;
  /** Hide the component */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiPopoverProps>(), {
  placement: "bottom",
  trigger: "click",
  showDelay: 0,
  hideDelay: 100,
  noArrow: false,
  disabled: false,
  closable: true,
  hidden: false,
});

const emit = defineEmits<{
  "update:visible": [value: boolean];
}>();

const slots = useSlots();

const isVisible = ref(false);
let showTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

watch(
  () => props.visible,
  (val) => {
    if (val !== undefined) isVisible.value = val;
  },
);

const { referenceRef, floatingRef, arrowRef, floatingStyles, arrowStyle, currentSide } = usePopover({
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

function toggle() { isVisible.value ? doHide() : doShow(); }
function onMouseEnter() { if (props.trigger === "hover" || props.trigger === "hover-focus") doShow(); }
function onMouseLeave() { if (props.trigger === "hover" || props.trigger === "hover-focus") doHide(); }
function onFocusIn() { if (props.trigger === "focus" || props.trigger === "hover-focus") doShow(); }
function onFocusOut() { if (props.trigger === "focus" || props.trigger === "hover-focus") doHide(); }
function onClick() { if (props.trigger === "click") toggle(); }
function onKeydown(e: KeyboardEvent) { if (e.key === "Escape" && isVisible.value) doHide(); }
function onPopoverMouseEnter() { if (props.trigger === "hover" || props.trigger === "hover-focus") { if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; } } }
function onPopoverMouseLeave() { if (props.trigger === "hover" || props.trigger === "hover-focus") doHide(); }

onUnmounted(() => {
  if (showTimer) clearTimeout(showTimer);
  if (hideTimer) clearTimeout(hideTimer);
});

const hasHeader = computed(() => props.title || slots.header);
const hasFooter = computed(() => !!slots.footer);
const headerId = computed(() => props.title ? "cui-popover-title" : undefined);

const panelStyle = computed(() => {
  const s: Record<string, string> = {
    zIndex: "9998",
    background: "var(--cui-surface-base)",
    border: "1px solid var(--cui-border)",
    borderRadius: "0.625rem",
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
</script>

<template>
  <div
    ref="wrapperRef"
    v-show="!hidden"
    :style="{ display: 'inline-flex' }"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
    @click="onClick"
    @keydown="onKeydown"
  >
    <div ref="referenceRef" :style="{ display: 'inline-flex' }">
      <slot />
    </div>

    <Teleport to="body">
      <div
        v-if="isVisible"
        ref="floatingRef"
        :style="{ ...floatingStyles, ...panelStyle }"
        role="dialog"
        :aria-labelledby="headerId"
        @mouseenter="onPopoverMouseEnter"
        @mouseleave="onPopoverMouseLeave"
      >
        <!-- Header -->
        <div
          v-if="hasHeader"
          :style="{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '0.5rem',
            padding: '0.75rem 0.875rem 0.25rem',
          }"
        >
          <slot name="header">
            <span
              :id="headerId"
              :style="{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--cui-text-body)' }"
            >
              {{ title }}
            </span>
          </slot>
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
              marginTop: '-0.0625rem',
              marginRight: '-0.125rem',
            }"
            aria-label="Close"
            @click.stop="doHide"
          >
            <CuiIcon name="x" size="0.8125rem" />
          </button>
        </div>

        <!-- Body -->
        <div
          :style="{
            padding: hasHeader ? '0.25rem 0.875rem 0.75rem' : '0.75rem 0.875rem',
            fontSize: '0.875rem',
            lineHeight: '1.55',
            color: 'var(--cui-text-secondary)',
          }"
        >
          <slot name="content" />
        </div>

        <!-- Footer -->
        <div
          v-if="hasFooter"
          :style="{
            padding: '0 0.875rem 0.75rem',
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

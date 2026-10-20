<script setup lang="ts">
import { ref, computed, useTemplateRef } from "vue";
import { useEventListener } from "../composables/useEventListener";
import { useCuiId } from "../composables/useCuiId";
import { useMessages } from "../composables/useMessages";
import CuiIcon from "./CuiIcon.vue";
import type { CuiOrientation, HideableProps } from "../types/common";

export interface CuiResizablePanelsProps extends HideableProps {
  /** Split orientation */
  orientation?: CuiOrientation;
  /** Initial size of the first panel as a percentage (0-100) */
  initialSize?: number;
  /** Minimum size of the first panel in px */
  minFirst?: number;
  /** Minimum size of the second panel in px */
  minSecond?: number;
  /** Collapse the first panel below this threshold (px). 0 disables. */
  collapseThreshold?: number;
}

const props = withDefaults(defineProps<CuiResizablePanelsProps>(), {
  orientation: "horizontal",
  initialSize: 50,
  minFirst: 100,
  minSecond: 100,
  collapseThreshold: 0,
  hidden: false,
});

const emit = defineEmits<{
  resize: [firstPercent: number];
  collapse: [collapsed: boolean];
}>();

const containerRef = ref<HTMLElement | null>(null);
const firstPercent = ref(props.initialSize);
const dragging = ref(false);
const collapsed = ref(false);

const isHorizontal = computed(() => props.orientation === "horizontal");

const containerStyle = computed(() => ({
  display: "flex",
  flexDirection: isHorizontal.value ? ("row" as const) : ("column" as const),
  width: "100%",
  height: "100%",
  overflow: "hidden",
}));

const firstPanelStyle = computed(() => {
  if (collapsed.value) {
    return isHorizontal.value
      ? { width: "0", minWidth: "0", overflow: "hidden" as const }
      : { height: "0", minHeight: "0", overflow: "hidden" as const };
  }
  return isHorizontal.value
    ? { width: `${firstPercent.value}%`, minWidth: `${props.minFirst}px`, overflow: "auto" as const }
    : { height: `${firstPercent.value}%`, minHeight: `${props.minFirst}px`, overflow: "auto" as const };
});

const secondPanelStyle = computed(() => ({
  flex: "1",
  minWidth: isHorizontal.value ? `${props.minSecond}px` : undefined,
  minHeight: !isHorizontal.value ? `${props.minSecond}px` : undefined,
  overflow: "auto" as const,
}));

const handleHover = ref(false);
// The line and grip highlight while the handle is dragged or hovered; keyboard focus shows
// the focus ring instead.
const handleActive = computed(() => dragging.value || handleHover.value);

const handleStyle = computed(() => {
  const base: Record<string, string> = {
    flexShrink: "0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    userSelect: "none",
    zIndex: "1",
    position: "relative",
  };

  if (isHorizontal.value) {
    base.width = "9px";
    base.cursor = "col-resize";
  } else {
    base.height = "9px";
    base.cursor = "row-resize";
  }

  return base;
});

const handleLineStyle = computed(() => {
  const active = handleActive.value;
  if (isHorizontal.value) {
    return {
      position: "absolute" as const,
      top: "0",
      bottom: "0",
      left: "50%",
      transform: "translateX(-50%)",
      width: active ? "3px" : "1px",
      background: active ? "var(--cui-primary)" : "var(--cui-border)",
      borderRadius: "1px",
      transition: "width 0.15s ease, background 0.15s ease",
    };
  }
  return {
    position: "absolute" as const,
    left: "0",
    right: "0",
    top: "50%",
    transform: "translateY(-50%)",
    height: active ? "3px" : "1px",
    background: active ? "var(--cui-primary)" : "var(--cui-border)",
    borderRadius: "1px",
    transition: "height 0.15s ease, background 0.15s ease",
  };
});

const gripStyle = computed(() => {
  const active = handleActive.value;
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: "2",
    opacity: active ? "0.8" : "0.35",
    transition: "opacity 0.15s ease",
    background: "var(--cui-surface-base, white)",
    borderRadius: "3px",
    padding: "2px",
  };
});

let startPos = 0;
let startPercent = 0;
// Read once per drag: the container's length and direction don't change mid-drag, and
// reading them on every pointermove would force a style and layout pass each time.
let dragTotal = 0;
let dragSign = 1;

/** The container's length along the split, in px. */
function totalSize() {
  const rect = containerRef.value?.getBoundingClientRect();
  return (isHorizontal.value ? rect?.width : rect?.height) ?? 0;
}

// Side by side in a right-to-left page, the first panel is on the right: moving the handle
// right shrinks it.
const rtl = () => isHorizontal.value && !!containerRef.value && getComputedStyle(containerRef.value).direction === "rtl";

/** The range the first panel can take, in percent, from the px minimums. */
function bounds(total: number) {
  return { min: (props.minFirst / total) * 100, max: 100 - (props.minSecond / total) * 100 };
}

function setCollapsed(next: boolean) {
  if (collapsed.value === next) return;
  collapsed.value = next;
  emit("collapse", next);
}

/** Move the split to `percent`, clamped to the minimums, collapsing below the threshold. */
function applyPercent(percent: number, total: number) {
  const { min, max } = bounds(total);
  const next = Math.max(min, Math.min(max, percent));
  if (props.collapseThreshold > 0) setCollapsed((next / 100) * total < props.collapseThreshold);
  firstPercent.value = next;
  emit("resize", next);
}

function onPointerDown(e: PointerEvent) {
  if (!containerRef.value) return;
  e.preventDefault();
  dragging.value = true;
  startPos = isHorizontal.value ? e.clientX : e.clientY;
  startPercent = firstPercent.value;
  dragTotal = totalSize();
  dragSign = rtl() ? -1 : 1;
}

function onPointerMove(e: PointerEvent) {
  if (!dragging.value || !dragTotal) return;
  const delta = ((isHorizontal.value ? e.clientX : e.clientY) - startPos) * dragSign;
  applyPercent(startPercent + (delta / dragTotal) * 100, dragTotal);
}

function onPointerUp() {
  dragging.value = false;
}

// Document-level, so a drag keeps tracking when the pointer leaves the handle; only while
// dragging, and removed on unmount mid-drag.
useEventListener("document", "pointermove", onPointerMove, { enabled: dragging });
// pointercancel too: the browser can take the gesture over (a touch scroll), and then
// pointerup never comes.
useEventListener("document", ["pointerup", "pointercancel"], onPointerUp, { enabled: dragging });

function onDoubleClick() {
  firstPercent.value = props.initialSize;
  collapsed.value = false;
  emit("resize", props.initialSize);
  emit("collapse", false);
}

// --- Keyboard (#156): the WAI-ARIA window splitter ---------------------------
// The handle is a focusable role="separator" whose value is the first panel's share.
// The arrows along the split move it (Shift for bigger steps), Home and End go to the
// smallest and largest the minimums allow, and Enter collapses the first panel and
// restores it, when collapsing is on: to the size it had, or to initialSize when that was
// under the threshold (a drag into the collapse). Double-click still resets to initialSize.
const messages = useMessages();
const firstPanelId = useCuiId("resizable-first");
const STEP = 2;
const BIG_STEP = 10;

const handleAttrs = computed(() => ({
  role: "separator",
  tabindex: 0,
  // The separator's own orientation: panels side by side are split by a vertical line.
  "aria-orientation": isHorizontal.value ? ("vertical" as const) : ("horizontal" as const),
  "aria-valuenow": collapsed.value ? 0 : Math.round(firstPercent.value),
  // The whole 0-100: the reachable range comes from px minimums over a measured size, which
  // isn't reactive, and a collapsed panel reports 0.
  "aria-valuemin": 0,
  "aria-valuemax": 100,
  "aria-controls": firstPanelId,
  "aria-label": messages.value.resizablePanels.handle,
}));

function onHandleKeydown(e: KeyboardEvent) {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const total = totalSize();
  if (!total) return;
  const [grow, shrink] = isHorizontal.value
    ? rtl() ? ["ArrowLeft", "ArrowRight"] : ["ArrowRight", "ArrowLeft"]
    : ["ArrowDown", "ArrowUp"];
  const step = e.shiftKey ? BIG_STEP : STEP;
  const from = collapsed.value ? 0 : firstPercent.value;

  if (e.key === grow) applyPercent(from + step, total);
  else if (e.key === shrink) applyPercent(from - step, total);
  else if (e.key === "Home") applyPercent(0, total); // clamped to the minimum
  else if (e.key === "End") applyPercent(100, total);
  else if (e.key === "Enter" && props.collapseThreshold > 0) {
    if (!collapsed.value) setCollapsed(true);
    else {
      const wasOpen = (firstPercent.value / 100) * total >= props.collapseThreshold;
      setCollapsed(false);
      applyPercent(wasOpen ? firstPercent.value : props.initialSize, total);
    }
  } else return;
  e.preventDefault();
}

// The handle is the component's one focusable element.
const handleEl = useTemplateRef<HTMLElement>("handleEl");
defineExpose({
  el: containerRef,
  focus: (opts?: FocusOptions) => handleEl.value?.focus(opts),
  blur: () => handleEl.value?.blur(),
});
</script>

<template>
  <div class="cui-resizable-panels" ref="containerRef" v-show="!hidden" :style="containerStyle">
    <!-- First panel -->
    <div :id="firstPanelId" :style="firstPanelStyle">
      <slot name="first" />
    </div>

    <!-- Drag handle -->
    <div
      ref="handleEl"
      class="cui-resizable-panels__handle"
      v-bind="handleAttrs"
      :style="handleStyle"
      @keydown="onHandleKeydown"
      @pointerdown="onPointerDown"
      @dblclick="onDoubleClick"
      @mouseenter="handleHover = true"
      @mouseleave="handleHover = false"
    >
      <div :style="handleLineStyle" />
      <div :style="gripStyle" aria-hidden="true">
        <CuiIcon name="dots-nine" size="1.25rem" />
      </div>
    </div>

    <!-- Second panel -->
    <div :style="secondPanelStyle">
      <slot name="second" />
    </div>
  </div>
</template>

<style scoped>
/* --- Themeable: zero specificity, so a consumer's own rule wins (see CuiButton.vue) --- */
/* Inset: the container clips its overflow, and an outward ring would be cut off at the ends. */
:where(.cui-resizable-panels__handle:focus-visible) {
  outline: 2px solid var(--cui-resizable-panels-focus-ring, var(--cui-primary-focus-ring));
  outline-offset: -2px;
}
</style>

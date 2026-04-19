<script setup lang="ts">
import { ref, computed, onUnmounted } from "vue";
import CuiIcon from "./CuiIcon.vue";

export type ResizableDirection = "horizontal" | "vertical";

export interface CuiResizablePanelsProps {
  /** Split direction */
  direction?: ResizableDirection;
  /** Initial size of the first panel as a percentage (0-100) */
  initialSize?: number;
  /** Minimum size of the first panel in px */
  minFirst?: number;
  /** Minimum size of the second panel in px */
  minSecond?: number;
  /** Collapse the first panel below this threshold (px). 0 disables. */
  collapseThreshold?: number;
  /** Hide the component */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiResizablePanelsProps>(), {
  direction: "horizontal",
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

const isHorizontal = computed(() => props.direction === "horizontal");

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

const handleStyle = computed(() => {
  const active = dragging.value || handleHover.value;
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
  const active = dragging.value || handleHover.value;
  if (isHorizontal.value) {
    return {
      position: "absolute" as const,
      top: "0",
      bottom: "0",
      left: "3px",
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
    top: "3px",
    height: active ? "3px" : "1px",
    background: active ? "var(--cui-primary)" : "var(--cui-border)",
    borderRadius: "1px",
    transition: "height 0.15s ease, background 0.15s ease",
  };
});

const gripStyle = computed(() => {
  const active = dragging.value || handleHover.value;
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
    padding: isHorizontal.value ? "4px 1px" : "1px 4px",
  };
});

const gripDotStyle = computed(() => ({
  width: "3px",
  height: "3px",
  borderRadius: "50%",
  background: "var(--cui-text-secondary)",
}));

let startPos = 0;
let startPercent = 0;

function onPointerDown(e: PointerEvent) {
  if (!containerRef.value) return;
  e.preventDefault();
  dragging.value = true;
  startPos = isHorizontal.value ? e.clientX : e.clientY;
  startPercent = firstPercent.value;

  document.addEventListener("pointermove", onPointerMove);
  document.addEventListener("pointerup", onPointerUp);
}

function onPointerMove(e: PointerEvent) {
  if (!containerRef.value || !dragging.value) return;

  const rect = containerRef.value.getBoundingClientRect();
  const totalSize = isHorizontal.value ? rect.width : rect.height;
  const delta = (isHorizontal.value ? e.clientX : e.clientY) - startPos;
  const deltaPercent = (delta / totalSize) * 100;
  let newPercent = startPercent + deltaPercent;

  // Clamp to min sizes
  const minFirstPercent = (props.minFirst / totalSize) * 100;
  const minSecondPercent = (props.minSecond / totalSize) * 100;
  newPercent = Math.max(minFirstPercent, Math.min(100 - minSecondPercent, newPercent));

  // Collapse logic
  if (props.collapseThreshold > 0) {
    const firstPx = (newPercent / 100) * totalSize;
    if (firstPx < props.collapseThreshold && !collapsed.value) {
      collapsed.value = true;
      emit("collapse", true);
    } else if (firstPx >= props.collapseThreshold && collapsed.value) {
      collapsed.value = false;
      emit("collapse", false);
    }
  }

  firstPercent.value = newPercent;
  emit("resize", newPercent);
}

function onPointerUp() {
  dragging.value = false;
  document.removeEventListener("pointermove", onPointerMove);
  document.removeEventListener("pointerup", onPointerUp);
}

function onDoubleClick() {
  firstPercent.value = props.initialSize;
  collapsed.value = false;
  emit("resize", props.initialSize);
  emit("collapse", false);
}

onUnmounted(() => {
  document.removeEventListener("pointermove", onPointerMove);
  document.removeEventListener("pointerup", onPointerUp);
});
</script>

<template>
  <div ref="containerRef" v-show="!hidden" :style="containerStyle">
    <!-- First panel -->
    <div :style="firstPanelStyle">
      <slot name="first" />
    </div>

    <!-- Drag handle -->
    <div
      :style="handleStyle"
      @pointerdown="onPointerDown"
      @dblclick="onDoubleClick"
      @mouseenter="handleHover = true"
      @mouseleave="handleHover = false"
    >
      <div :style="handleLineStyle" />
      <div :style="gripStyle">
        <CuiIcon
          :name="isHorizontal ? 'dots-six-vertical' : 'dots-six'"
          size="1.25rem"
        />
      </div>
    </div>

    <!-- Second panel -->
    <div :style="secondPanelStyle">
      <slot name="second" />
    </div>
  </div>
</template>

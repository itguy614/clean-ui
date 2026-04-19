<script setup lang="ts">
import { computed, useTemplateRef } from "vue";
import { useOverlay } from "../composables/useOverlay";
import CuiBackdrop from "./CuiBackdrop.vue";
import CuiModalHeader from "./CuiModalHeader.vue";
import CuiModalBody from "./CuiModalBody.vue";
import type { BackdropBlur } from "./CuiBackdrop.vue";

export type SlideoverSide = "right" | "left" | "top" | "bottom";
export type SlideoverSize = "sm" | "md" | "lg" | "xl" | "full";

export interface CuiSlideoverProps {
  /** Controls slideover visibility */
  open?: boolean;
  /** Which edge the panel slides from */
  side?: SlideoverSide;
  /** Panel size — named size or custom CSS value (e.g. "600px") */
  size?: SlideoverSize | string;
  /** Title text (rendered in header) */
  title?: string;
  /** Prevent closing via Escape and backdrop click */
  persistent?: boolean;
  /** Hide the X close button */
  noCloseButton?: boolean;
  /** Allow opening on top of another overlay */
  allowNested?: boolean;
  /** Backdrop opacity */
  backdropOpacity?: number;
  /** Backdrop blur */
  backdropBlur?: BackdropBlur;
  /** Backdrop color */
  backdropColor?: string;
  /** Backdrop image URL */
  backdropImage?: string;
  /** Backdrop gradient */
  backdropGradient?: string;
  /** Hide the component */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiSlideoverProps>(), {
  open: false,
  side: "right",
  size: "md",
  persistent: false,
  noCloseButton: false,
  allowNested: false,
  backdropOpacity: 0.5,
  backdropBlur: "none",
  backdropColor: "black",
  hidden: false,
});

const emit = defineEmits<{
  "update:open": [value: boolean];
  close: [];
}>();

const panelRef = useTemplateRef<HTMLElement>("panelEl");

const { isVisible, isAnimating, closeOverlay, onBackdropClick, onKeydown } = useOverlay({
  open: () => props.open,
  dialogRef: panelRef,
  persistent: () => props.persistent,
  allowNested: () => props.allowNested,
  animationDuration: 250,
  onUpdateOpen: (v) => emit("update:open", v),
  onClose: () => emit("close"),
});

// Horizontal or vertical slide
const isHorizontal = computed(() => props.side === "left" || props.side === "right");

// Named size → CSS value
const horizontalSizeMap: Record<string, string> = {
  sm: "20rem",    // 320px
  md: "28rem",    // 448px
  lg: "36rem",    // 576px
  xl: "48rem",    // 768px
  full: "100vw",
};

const verticalSizeMap: Record<string, string> = {
  sm: "25vh",
  md: "40vh",
  lg: "60vh",
  xl: "80vh",
  full: "100vh",
};

const panelDimension = computed(() => {
  const map = isHorizontal.value ? horizontalSizeMap : verticalSizeMap;
  return map[props.size] ?? props.size;
});

// Panel inline styles for size + position + transform
const panelStyle = computed(() => {
  const style: Record<string, string> = {
    position: "absolute",
    zIndex: "2",
    display: "flex",
    flexDirection: "column",
    background: "var(--cui-surface-base)",
    boxShadow: "0 16px 48px rgb(0 0 0 / 0.15)",
    outline: "none",
    overflow: "hidden",
    transition: "transform 0.25s ease",
  };

  if (isHorizontal.value) {
    style.width = panelDimension.value;
    style.maxWidth = props.size === "full" ? "100vw" : "calc(100vw - 2rem)";
    style.top = "0";
    style.height = "100%";
  } else {
    style.height = panelDimension.value;
    style.maxHeight = props.size === "full" ? "100vh" : "calc(100vh - 2rem)";
    style.left = "0";
    style.width = "100%";
  }

  // Side position
  if (props.side === "right") style.right = "0";
  else if (props.side === "left") style.left = "0";
  else if (props.side === "top") style.top = "0";
  else if (props.side === "bottom") style.bottom = "0";

  // Off-screen transform (overridden when visible)
  if (!isAnimating.value) {
    if (props.side === "right") style.transform = "translateX(100%)";
    else if (props.side === "left") style.transform = "translateX(-100%)";
    else if (props.side === "top") style.transform = "translateY(-100%)";
    else if (props.side === "bottom") style.transform = "translateY(100%)";
  } else {
    style.transform = "translate(0)";
  }

  return style;
});

// Generate id for aria-labelledby
const titleId = `cui-slideover-title-${Math.random().toString(36).slice(2, 8)}`;
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isVisible"
      v-show="!hidden"
      :style="{ position: 'fixed', inset: '0', zIndex: '9990' }"
      @keydown="onKeydown"
    >
      <!-- Backdrop -->
      <CuiBackdrop
        :visible="isAnimating"
        :opacity="backdropOpacity"
        :blur="backdropBlur"
        :color="backdropColor"
        :image="backdropImage"
        :gradient="backdropGradient"
        @click="onBackdropClick"
      />

      <!-- Panel -->
      <div
        ref="panelEl"
        :style="panelStyle"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title ? titleId : undefined"
        tabindex="-1"
      >
        <!-- Simple mode: title prop renders header + body wrapper -->
        <template v-if="title">
          <CuiModalHeader
            :title="title"
            :no-close-button="noCloseButton"
            @close="closeOverlay"
          />
          <CuiModalBody>
            <slot />
          </CuiModalBody>
        </template>

        <!-- Sub-component mode: consumer assembles with ModalHeader/Body/Footer -->
        <template v-else>
          <slot />
        </template>
      </div>
    </div>
  </Teleport>
</template>


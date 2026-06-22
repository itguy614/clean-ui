<script setup lang="ts">
import { computed, useTemplateRef } from "vue";
import { useOverlay } from "../composables/useOverlay";
import CuiBackdrop from "./CuiBackdrop.vue";
import CuiModalHeader from "./CuiModalHeader.vue";
import CuiModalBody from "./CuiModalBody.vue";
import type { BackdropBlur } from "./CuiBackdrop.vue";
import type { HideableProps, CuiRounded } from "../types/common";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

export interface CuiModalProps extends HideableProps {
  /** Controls modal visibility (v-model:visible) */
  visible?: boolean;
  /** Modal width — named size or custom CSS value */
  size?: ModalSize | string;
  /** Title text (rendered in header) */
  title?: string;
  /** Prevent closing via Escape and backdrop click */
  persistent?: boolean;
  /** Hide the X close button */
  noCloseButton?: boolean;
  /** Allow opening on top of another modal */
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
  /** Border radius */
  rounded?: CuiRounded;
}

const props = withDefaults(defineProps<CuiModalProps>(), {
  visible: false,
  size: "md",
  persistent: false,
  noCloseButton: false,
  allowNested: false,
  backdropOpacity: 0.5,
  backdropBlur: "none",
  backdropColor: "black",
  rounded: "md",
  hidden: false,
});

const radiusMap: Record<CuiRounded, string> = {
  none: "0",
  sm: "0.25rem",
  md: "var(--cui-button-radius, 0.375rem)",
  lg: "0.5rem",
  full: "9999px",
};

const emit = defineEmits<{
  "update:visible": [value: boolean];
  close: [];
}>();

const dialogRef = useTemplateRef<HTMLElement>("dialogEl");

const { isVisible, isAnimating, closeOverlay, onBackdropClick, onKeydown } = useOverlay({
  open: () => props.visible,
  dialogRef,
  persistent: () => props.persistent,
  allowNested: () => props.allowNested,
  onUpdateOpen: (v) => emit("update:visible", v),
  onClose: () => emit("close"),
});

// Size mapping
const sizeMap: Record<string, string> = {
  sm: "24rem",    // 384px
  md: "32rem",    // 512px
  lg: "48rem",    // 768px
  xl: "64rem",    // 1024px
  full: "calc(100vw - 2rem)",
};

const maxWidth = computed(() => sizeMap[props.size] ?? props.size);

// Generate id for aria-labelledby
const titleId = `cui-modal-title-${Math.random().toString(36).slice(2, 8)}`;
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isVisible"
      v-show="!hidden"
      class="cui-modal-overlay"
      :class="{ 'cui-modal-overlay--visible': isAnimating }"
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

      <!-- Modal dialog -->
      <div class="cui-modal-container">
        <div
          ref="dialogEl"
          class="cui-modal"
          :class="{ 'cui-modal--visible': isAnimating }"
          :style="{ maxWidth, borderRadius: radiusMap[rounded] }"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="title ? titleId : undefined"
          tabindex="-1"
        >
          <!-- Simple mode: title prop renders header + body wrapper automatically -->
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

          <!-- Sub-component mode: consumer assembles with CuiModalHeader/Body/Footer -->
          <template v-else>
            <slot />
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* --- Overlay (covers viewport) --- */
.cui-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9990;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: calc(2rem * var(--cui-density-scale, 1)) calc(1rem * var(--cui-density-scale, 1));
}

/* --- Container (centers the modal, must be above backdrop) --- */
.cui-modal-container {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  max-height: calc(100vh - 4rem);
  margin-top: calc(4rem * var(--cui-density-scale, 1));
}

/* --- Modal panel --- */
.cui-modal {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: calc(100vh - 8rem);
  background: var(--cui-surface-base);
  box-shadow: 0 16px 48px rgb(0 0 0 / 0.2);
  outline: none;
  overflow: hidden;

  /* Entrance animation */
  opacity: 0;
  transform: scale(0.95) translateY(-0.5rem);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.cui-modal--visible {
  opacity: 1;
  transform: scale(1) translateY(0);
}

:where(.dark, .dark *) .cui-modal {
  box-shadow: 0 16px 48px rgb(0 0 0 / 0.4);
}
</style>

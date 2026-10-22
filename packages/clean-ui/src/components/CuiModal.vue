<script setup lang="ts">
import { computed, useTemplateRef } from "vue";
import { useCuiId } from "../composables/useCuiId";
import { subtreeTransition } from "../utils/motion";
import { useOverlay } from "../composables/useOverlay";
import CuiBackdrop from "./CuiBackdrop.vue";
import CuiModalHeader from "./CuiModalHeader.vue";
import CuiModalBody from "./CuiModalBody.vue";
import type { BackdropBlur } from "./CuiBackdrop.vue";
import type { HideableProps, CuiRounded, TitleAsProps } from "../types/common";
import { RADIUS_SCALE } from "../utils/sizing";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

export interface CuiModalProps extends HideableProps, TitleAsProps {
  /** Controls modal visibility (v-model:visible) */
  visible?: boolean;
  /**
   * id of the element naming this dialog, for sub-component mode.
   *
   * Simple mode (the `title` prop) wires this up on its own. A wrapper that assembles its
   * own header — `CuiConfirmDialog` does — has no `title` for the modal to name itself
   * from, and so had no accessible name at all (#158).
   */
  ariaLabelledby?: string;
  /** Modal width — named size or custom CSS value */
  size?: ModalSize | string;
  /** Title text (rendered in header) */
  title?: string;
  /** Prevent closing via Escape and backdrop click */
  persistent?: boolean;
  /** Hide the X close button */
  noCloseButton?: boolean;
  /**
   * @deprecated Has no effect — overlays always stack, and Escape closes only the topmost
   * (#285). Removed in 2.0.
   */
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
  // `undefined`, not Vue's boolean `false`, so the deprecation warning fires only when passed.
  allowNested: undefined,
  backdropOpacity: 0.5,
  backdropBlur: "none",
  backdropColor: "black",
  rounded: "md",
  hidden: false,
});

const emit = defineEmits<{
  "update:visible": [value: boolean];
  close: [];
}>();

const dialogRef = useTemplateRef<HTMLElement>("dialogEl");

const { isVisible, isAnimating, mounted, onAfterLeave, closeOverlay, onBackdropClick, onKeydown } = useOverlay({
  open: () => props.visible,
  dialogRef,
  persistent: () => props.persistent,
  // Deprecated (#285): passed on only so useOverlay can warn that it does nothing.
  allowNested: props.allowNested === undefined ? undefined : () => props.allowNested!,
  name: "CuiModal",
  // Its exit is a <Transition> below, which reports back through onAfterLeave (#263).
  exit: "transition",
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
const titleId = useCuiId("modal-title");
</script>

<template>
  <Teleport to="body">
    <!-- Its dialog and backdrop animate on their own state classes (data-cui-exit); the
         leave waits for them, and a re-open mid-exit reverses them (#263). -->
    <Transition v-bind="subtreeTransition" @after-leave="onAfterLeave">
    <div
      v-if="mounted"
      v-show="isVisible && !hidden"
      class="cui-modal-overlay"
      :class="{ 'cui-modal-overlay--visible': isAnimating }"
      @keydown="onKeydown"
    >
      <!-- Backdrop -->
      <CuiBackdrop
        data-cui-exit
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
          data-cui-exit
          class="cui-modal"
          :class="{ 'cui-modal--visible': isAnimating }"
          :style="{ maxWidth, borderRadius: RADIUS_SCALE[rounded] }"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="ariaLabelledby ?? (title ? titleId : undefined)"
          tabindex="-1"
        >
          <!-- Simple mode: title prop renders header + body wrapper automatically -->
          <template v-if="title">
            <CuiModalHeader
              :title="title"
              :title-as="titleAs"
              :title-id="titleId"
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
    </Transition>
  </Teleport>
</template>

<style scoped>
/* --- Overlay (covers viewport) --- */
.cui-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--cui-z-overlay, 9990); /* OVERLAY_Z_INDEX in utils/position.ts */
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
  box-shadow: var(--cui-shadow-lg);
  outline: none;
  overflow: hidden;

  /* Entrance animation */
  opacity: 0;
  transform: scale(0.95) translateY(-0.5rem);
  transition: opacity var(--cui-duration-base) var(--cui-ease-out), transform var(--cui-duration-base) var(--cui-ease-out);
}

.cui-modal--visible {
  opacity: 1;
  transform: scale(1) translateY(0);
}
</style>

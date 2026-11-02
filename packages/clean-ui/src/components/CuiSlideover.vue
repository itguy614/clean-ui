<script setup lang="ts">
import { computed, useTemplateRef, watch } from "vue";
import { useCuiId } from "../composables/useCuiId";
import { subtreeTransition } from "../utils/motion";
import { useOverlay } from "../composables/useOverlay";
import { OVERLAY_Z_INDEX } from "../utils/position";
import CuiBackdrop from "./CuiBackdrop.vue";
import CuiModalHeader from "./CuiModalHeader.vue";
import CuiModalBody from "./CuiModalBody.vue";
import type { BackdropBlur } from "./CuiBackdrop.vue";
import type { HideableProps, TitleAsProps } from "../types/common";

export type SlideoverSide = "right" | "left" | "top" | "bottom";
export type SlideoverSize = "sm" | "md" | "lg" | "xl" | "full";

export interface CuiSlideoverProps extends HideableProps, TitleAsProps {
  /** Controls slideover visibility (v-model:visible) */
  visible?: boolean;
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
}

// The root is a <Teleport>, which can't take fallthrough attributes: Vue would drop a class
// or a data-testid with a warning. They go on the dialog panel instead, the element that is
// actually rendered, so a wrapper can give it its own cui-* class (#228). Bound last, so a
// consumer's own role (alertdialog), aria-labelledby or tabindex overrides the panel's.
defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<CuiSlideoverProps>(), {
  visible: false,
  side: "right",
  size: "md",
  persistent: false,
  noCloseButton: false,
  // `undefined`, not Vue's boolean `false`, so the deprecation warning fires only when passed.
  allowNested: undefined,
  backdropOpacity: 0.5,
  backdropBlur: "none",
  backdropColor: "black",
  hidden: false,
});

const emit = defineEmits<{
  "update:visible": [value: boolean];
  close: [];
}>();

const panelRef = useTemplateRef<HTMLElement>("panelEl");

const { isVisible, isAnimating, mounted, onAfterLeave, closeOverlay, onBackdropClick, onKeydown } = useOverlay({
  open: () => props.visible,
  dialogRef: panelRef,
  persistent: () => props.persistent,
  // Deprecated (#285): passed on only so useOverlay can warn that it does nothing.
  allowNested: props.allowNested === undefined ? undefined : () => props.allowNested!,
  name: "CuiSlideover",
  // Its exit is a <Transition> below, which reports back through onAfterLeave (#263).
  exit: "transition",
  onUpdateOpen: (v) => emit("update:visible", v),
  onClose: () => emit("close"),
});

// Closed while `hidden`: v-show is already off, so no leave runs to report the close.
watch(isVisible, (visible) => {
  if (!visible && props.hidden) onAfterLeave();
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

// The size is emitted as a private property and read back through the public token, so a
// class forwarded onto the panel, or a container-level --cui-slideover-width (left/right) or
// --cui-slideover-height (top/bottom), can restyle it (#407). Position, the slide and the
// paint live in the stylesheet, keyed on these classes.
const panelVars = computed(() =>
  isHorizontal.value
    ? { "--_slideover-width": horizontalSizeMap[props.size] ?? props.size }
    : { "--_slideover-height": verticalSizeMap[props.size] ?? props.size },
);

const panelClass = computed(() => [
  `cui-slideover__panel--${props.side}`,
  {
    "cui-slideover__panel--full": props.size === "full",
    "cui-slideover__panel--visible": isAnimating.value,
  },
]);

// Generate id for aria-labelledby
const titleId = useCuiId("slideover-title");
</script>

<template>
  <Teleport to="body">
    <!-- Its dialog and backdrop animate on their own state classes (data-cui-exit); the
         leave waits for them, and a re-open mid-exit reverses them (#263). -->
    <Transition v-bind="subtreeTransition" @after-leave="onAfterLeave">
    <div
      v-if="mounted"
      v-show="isVisible && !hidden"
      class="cui-slideover-overlay"
      :style="{ position: 'fixed', inset: '0', zIndex: OVERLAY_Z_INDEX }"
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

      <!-- Panel -->
      <div
        ref="panelEl"
        data-cui-exit
        class="cui-slideover__panel"
        :class="panelClass"
        :style="panelVars"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title ? titleId : undefined"
        tabindex="-1"
        v-bind="$attrs"
      >
        <!-- Simple mode: title prop renders header + body wrapper -->
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

        <!-- Sub-component mode: consumer assembles with ModalHeader/Body/Footer -->
        <template v-else>
          <slot />
        </template>
      </div>
    </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* --- Panel --- */
/* Themeable — zero specificity, so a class forwarded onto the panel (`<CuiSlideover class>`)
   or a consumer's own `.cui-slideover__panel { … }` wins without `!important` (#407). A token
   per axis, so a page-wide drawer width doesn't also set every sheet's height. */
:where(.cui-slideover__panel) {
  border-radius: var(--cui-slideover-radius, 0);
  background: var(--cui-surface-base);
  box-shadow: 0 16px 48px rgb(0 0 0 / 0.15);
}

:where(.cui-slideover__panel--left, .cui-slideover__panel--right) {
  width: var(--cui-slideover-width, var(--_slideover-width));
}

:where(.cui-slideover__panel--top, .cui-slideover__panel--bottom) {
  height: var(--cui-slideover-height, var(--_slideover-height));
}

.cui-slideover__panel {
  position: absolute;
  z-index: 2;
  display: flex;
  flex-direction: column;
  outline: none;
  overflow: hidden;
  /* Slides out faster than it came in, with its backdrop (#269): a transition takes the
     duration of the state it moves to. */
  transition: transform var(--cui-duration-fast) var(--cui-ease-drawer);
}

.cui-slideover__panel--left,
.cui-slideover__panel--right {
  top: 0;
  height: 100%;
  max-width: calc(100vw - 2rem);
}

.cui-slideover__panel--top,
.cui-slideover__panel--bottom {
  left: 0;
  width: 100%;
  max-height: calc(100vh - 2rem);
}

/* After the side rules: lifts the cap on whichever axis the panel slides along. */
.cui-slideover__panel--full {
  max-width: 100vw;
  max-height: 100vh;
}

/* Off-screen until visible. */
.cui-slideover__panel--right {
  right: 0;
  transform: translateX(100%);
}

.cui-slideover__panel--left {
  left: 0;
  transform: translateX(-100%);
}

.cui-slideover__panel--top {
  top: 0;
  transform: translateY(-100%);
}

.cui-slideover__panel--bottom {
  bottom: 0;
  transform: translateY(100%);
}

/* After the side rules, which it overrides at the same specificity. */
.cui-slideover__panel--visible {
  transform: translate(0);
  transition-duration: var(--cui-duration-slow);
}
</style>


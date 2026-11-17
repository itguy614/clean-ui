<script setup lang="ts">
import { computed, useTemplateRef, watch } from "vue";
import { useCuiId } from "../composables/useCuiId";
import { subtreeTransition } from "../utils/motion";
import { useOverlay } from "../composables/useOverlay";
import { useScopedTheme } from "../composables/useScopedTheme";
import { useDragDismiss } from "../composables/useDragDismiss";
import CuiBackdrop from "./CuiBackdrop.vue";
import CuiModalHeader from "./CuiModalHeader.vue";
import CuiModalBody from "./CuiModalBody.vue";
import type { BackdropBlur } from "./CuiBackdrop.vue";
import type { BackdropGradientProps, HideableProps, TitleAsProps, OverlayFocusProps } from "../types/common";

export type SlideoverSide = "right" | "left" | "top" | "bottom";
export type SlideoverSize = "sm" | "md" | "lg" | "xl" | "full";

export interface CuiSlideoverProps extends BackdropGradientProps, HideableProps, TitleAsProps, OverlayFocusProps {
  /** Controls slideover visibility (v-model:visible) */
  visible?: boolean;
  /** Which edge the panel slides from */
  side?: SlideoverSide;
  /** Panel size — named size or custom CSS value (e.g. "600px") */
  size?: SlideoverSize | string;
  /** Title text (rendered in header) */
  title?: string;
  /**
   * A modal overlay (the default) traps focus and, inside a `CuiSlideoverStack`, makes the
   * overlays beneath it inert. `false` opens it co-active: the ones beneath stay interactive,
   * focus moves freely and nothing is trapped. Bind it, `:modal="false"` (#41)
   */
  modal?: boolean;
  /** Prevent closing via Escape and backdrop click */
  persistent?: boolean;
  /** Hide the X close button */
  noCloseButton?: boolean;
  /** Turn off touch and pen drag-to-dismiss (drag the panel toward its edge to close it) */
  noDrag?: boolean;
  /** Backdrop opacity */
  backdropOpacity?: number;
  /** Backdrop blur */
  backdropBlur?: BackdropBlur;
  /** Backdrop color */
  backdropColor?: string;
  /** Backdrop image URL */
  backdropImage?: string;
}

// The root is a <Teleport>, which can't take fallthrough attributes: Vue would drop a class
// or a data-testid with a warning. They go on the dialog panel instead, the element that is
// actually rendered, so a wrapper can give it its own cui-* class (#228). Bound last, so a
// consumer's own role (alertdialog), aria-labelledby or tabindex overrides the panel's.
defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<CuiSlideoverProps>(), {
  visible: false,
  modal: true,
  side: "right",
  size: "md",
  persistent: false,
  noCloseButton: false,
  noDrag: false,
  backdropOpacity: 0.5,
  backdropBlur: "none",
  backdropColor: "black",
  // `undefined`, not Vue's boolean `false`: `returnFocus` accepts `false`, and Vue would
  // otherwise cast an absent prop to it and stop returning focus at all.
  initialFocus: undefined,
  returnFocus: undefined,
  hidden: false,
});

const emit = defineEmits<{
  "update:visible": [value: boolean];
  close: [];
  /** The entry has finished and focus is in place (#374). */
  "after-enter": [];
  /** The exit has finished and focus has been returned (#374). */
  "after-leave": [];
}>();

const overlayRef = useTemplateRef<HTMLElement>("overlayEl");
const panelRef = useTemplateRef<HTMLElement>("panelEl");

const { isVisible, isAnimating, mounted, onAfterLeave, closeOverlay, onBackdropClick, onKeydown, zIndex, ownsBackdrop, stacked } = useOverlay({
  open: () => props.visible,
  dialogRef: panelRef,
  persistent: () => props.persistent,
  // Its exit is a <Transition> below, which reports back through onAfterLeave (#263).
  onUpdateOpen: (v) => emit("update:visible", v),
  onClose: () => emit("close"),
  rootRef: overlayRef,
  initialFocus: () => props.initialFocus,
  returnFocus: () => props.returnFocus,
  onOpened: () => emit("after-enter"),
  onClosed: () => emit("after-leave"),
  modal: () => props.modal,
  side: () => props.side,
});

// Closed while `hidden`: v-show is already off, so no leave runs to report the close.
watch(isVisible, (visible) => {
  if (!visible && props.hidden) onAfterLeave();
});

// Touch and pen drag toward the edge to dismiss (#268). A mouse never drags it, so text
// selection and clicks are untouched; the gesture is also off while `persistent`.
const gesture = useDragDismiss({
  panel: panelRef,
  edge: () => props.side,
  enabled: () => !props.noDrag && !props.persistent && isAnimating.value,
  onDismiss: closeOverlay,
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
// The theme scope around the slideover, on the teleported overlay (#418).
const themeScope = useScopedTheme(() => mounted.value);
</script>

<template>
  <Teleport to="body">
    <!-- Its dialog and backdrop animate on their own state classes (data-cui-exit); the
         leave waits for them, and a re-open mid-exit reverses them (#263). -->
    <Transition v-bind="subtreeTransition" @after-leave="onAfterLeave">
    <div
      v-if="mounted"
      v-show="isVisible && !hidden"
      ref="overlayEl"
      class="cui-slideover-overlay"
      :class="[themeScope, { 'cui-slideover-overlay--stacked': stacked }]"
      :style="{ position: 'fixed', inset: '0', zIndex }"
      @keydown="onKeydown"
    >
      <!-- Backdrop -->
      <CuiBackdrop
        data-cui-exit
        :visible="isAnimating && ownsBackdrop"
        :class="{ 'cui-slideover__backdrop--live': ownsBackdrop }"
        :opacity="backdropOpacity"
        :blur="backdropBlur"
        :color="backdropColor"
        :image="backdropImage"
        :gradient="backdropGradient"
        :from="backdropFrom"
        :via="backdropVia"
        :to="backdropTo"
        :angle="backdropAngle"
        :smooth="backdropSmooth"
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
        :aria-modal="modal ? 'true' : 'false'"
        :aria-labelledby="title ? titleId : undefined"
        tabindex="-1"
        v-bind="$attrs"
        @pointerdown="gesture.onPointerdown"
        @click.capture="gesture.onClickCapture"
        @scroll.capture="gesture.onScrollCapture"
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
/* In a stack (#41) every overlay root is full-screen, and the ones above would block the
   panels beneath them. The root lets pointer events through; the panel and the one backdrop
   that is drawn (the lowest active overlay's) take them. */
.cui-slideover-overlay--stacked {
  pointer-events: none;
}
.cui-slideover-overlay--stacked .cui-slideover__panel,
.cui-slideover-overlay--stacked .cui-slideover__backdrop--live {
  pointer-events: auto;
}

/* --- Panel --- */
/* Themeable — zero specificity, so a class forwarded onto the panel (`<CuiSlideover class>`)
   or a consumer's own `.cui-slideover__panel { … }` wins without `!important` (#407). A token
   per axis, so a page-wide drawer width doesn't also set every sheet's height. */
:where(.cui-slideover__panel) {
  border-radius: var(--cui-slideover-radius, 0);
  background: var(--cui-surface-base);
  box-shadow: var(--cui-shadow-lg);
}

:where(.cui-slideover__panel--left, .cui-slideover__panel--right) {
  width: var(--_stack-width, var(--cui-slideover-width, var(--_slideover-width)));
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
  /* A touch drag moves the panel (#268) instead of panning the page; pinch-zoom stays, and a
     scroll container inside keeps its own native panning. */
  touch-action: pinch-zoom;
  /* Slides out faster than it came in, with its backdrop (#269): a transition takes the
     duration of the state it moves to. */
  transition: transform var(--cui-duration-fast) var(--cui-ease-drawer);
}

.cui-slideover__panel--left,
.cui-slideover__panel--right {
  top: 0;
  height: 100%;
  /* In a stack the layout sets the width itself and lifts this cap (--_stack-*, #41). */
  max-width: var(--_stack-max-width, calc(100vw - 2rem));
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
/* In a stack a panel sits --_stack-offset in from the edge, beside the ones beneath it, and
   leaves past all of them. Alone the offset is 0. Its edge is also where a re-flow scales
   from (useSlideoverStackLayout). */
.cui-slideover__panel--right {
  right: var(--_stack-offset, 0px);
  transform: translateX(calc(100% + var(--_stack-offset, 0px)));
  transform-origin: right center;
}

.cui-slideover__panel--left {
  left: var(--_stack-offset, 0px);
  transform: translateX(calc(-100% - var(--_stack-offset, 0px)));
  transform-origin: left center;
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


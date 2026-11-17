<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { useCuiId } from "../composables/useCuiId";
import { subtreeTransition } from "../utils/motion";
import { useOverlay } from "../composables/useOverlay";
import { backdropOf, joinStack } from "../composables/useOverlayJoin";
import { useScopedTheme } from "../composables/useScopedTheme";
import { useDragDismiss } from "../composables/useDragDismiss";
import { useVisualViewport } from "../composables/useVisualViewport";
import CuiBackdrop from "./CuiBackdrop.vue";
import CuiModalHeader from "./CuiModalHeader.vue";
import CuiModalBody from "./CuiModalBody.vue";
import type { BackdropBlur } from "./CuiBackdrop.vue";
import type { BackdropGradientProps, HideableProps, TitleAsProps, OverlayFocusProps } from "../types/common";

/** A snap point: a fraction of the viewport height (`0.5`), or a height in px (`320`, `"320px"`). */
export type CuiDrawerSnapPoint = number | string;

export interface CuiDrawerProps extends BackdropGradientProps, HideableProps, TitleAsProps, OverlayFocusProps {
  /** Controls drawer visibility (v-model:visible) */
  visible?: boolean;
  /** Title text (rendered in header) */
  title?: string;
  /**
   * A modal overlay traps focus and, inside a `CuiSlideoverStack`, makes the overlays beneath
   * it inert. `false` opens it co-active: the ones beneath stay interactive, focus moves
   * freely and nothing is trapped. Unset, it inherits the stack's `modal` (true alone). Bind
   * it, `:modal="false"` (#41)
   */
  modal?: boolean;
  /** Prevent closing via Escape, backdrop click and dragging down. The X button still closes */
  persistent?: boolean;
  /** Hide the X close button */
  noCloseButton?: boolean;
  /** Hide the grab handle at the top of the sheet */
  noHandle?: boolean;
  /** Turn off dragging: the sheet closes only by its controls, Escape and the backdrop */
  noDrag?: boolean;
  /**
   * Heights the sheet rests at: fractions of the viewport height (`[0.4, 1]`) or px (`320`,
   * `"320px"`). It opens at `activeSnapPoint` (the first listed), and a drag settles on the
   * nearest one, or closes. Without any, the sheet is as tall as its content.
   */
  snapPoints?: CuiDrawerSnapPoint[];
  /** The snap point the sheet rests at (v-model:active-snap-point); the first of `snapPoints` by default */
  activeSnapPoint?: CuiDrawerSnapPoint | null;
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
// actually rendered, as CuiSlideover does (#228).
defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<CuiDrawerProps>(), {
  visible: false,
  // `undefined`, not Vue's boolean `false`: absent means inherit from the stack (true alone).
  modal: undefined,
  persistent: false,
  noCloseButton: false,
  noHandle: false,
  noDrag: false,
  snapPoints: undefined,
  activeSnapPoint: undefined,
  backdropOpacity: 0.5,
  backdropBlur: "none",
  backdropColor: "black",
  // `undefined`, not Vue's boolean `false`: see CuiSlideover.
  initialFocus: undefined,
  returnFocus: undefined,
  hidden: false,
});

const emit = defineEmits<{
  "update:visible": [value: boolean];
  "update:activeSnapPoint": [value: CuiDrawerSnapPoint];
  close: [];
  /** The entry has finished and focus is in place. */
  "after-enter": [];
  /** The exit has finished and focus has been returned. */
  "after-leave": [];
}>();

const overlayRef = useTemplateRef<HTMLElement>("overlayEl");
const panelRef = useTemplateRef<HTMLElement>("panelEl");
const handleRef = useTemplateRef<HTMLElement>("handleEl");

const { isVisible, isAnimating, mounted, onAfterLeave, closeOverlay, onBackdropClick, onKeydown, join } = useOverlay({
  open: () => props.visible,
  dialogRef: panelRef,
  persistent: () => props.persistent,
  onUpdateOpen: (v) => emit("update:visible", v),
  onClose: () => emit("close"),
  rootRef: overlayRef,
  initialFocus: () => props.initialFocus,
  returnFocus: () => props.returnFocus,
  onOpened: () => emit("after-enter"),
  onClosed: () => emit("after-leave"),
  join: joinStack({
    modal: () => props.modal,
    backdrop: () => backdropOf(props),
  }),
});

watch(isVisible, (visible) => {
  if (visible) return;
  // A closed drawer opens at its first snap point again.
  localSnap.value = null;
  // Closed while `hidden`: v-show is already off, so no leave runs to report the close.
  if (props.hidden) onAfterLeave();
});

// --- Snap points ---------------------------------------------------------------------
// The panel is as tall as its tallest snap point and rests lower by the difference, so every
// stop is a plain offset from fully open: stops[0] = 0, ascending.
const viewport = useVisualViewport(() => mounted.value);
// With no window (server rendering) a fraction has nothing to be a fraction of: treated as 0.
const layoutHeight = viewport.layout;

function toPx(point: CuiDrawerSnapPoint): number {
  // A string is px only ("320px"); anything else (a %, rem) is no snap point.
  const n = typeof point === "number" ? point : /^\d+(\.\d+)?px$/.test(point.trim()) ? parseFloat(point) : 0;
  if (!Number.isFinite(n) || n <= 0) return 0;
  return typeof point === "number" && n <= 1 ? n * layoutHeight.value : n;
}

/** The points by height, tallest first: the index into `stops`. */
const points = computed(() =>
  (props.snapPoints ?? [])
    .map((value) => ({ value, px: toPx(value) }))
    .filter((p) => p.px > 0)
    .sort((a, b) => b.px - a.px),
);
const snapping = computed(() => points.value.length > 0);
const panelHeight = computed(() => points.value[0]?.px ?? 0);
const stops = computed(() => (snapping.value ? points.value.map((p) => panelHeight.value - p.px) : [0]));

// Uncontrolled, the sheet remembers where it was left.
const localSnap = ref<CuiDrawerSnapPoint | null>(null);
const activeValue = computed(() => props.activeSnapPoint ?? localSnap.value ?? props.snapPoints?.[0] ?? null);
const stopIndex = computed(() => {
  const i = points.value.findIndex((p) => p.value === activeValue.value);
  // A value that is none of the points rests fully open, and so does no snapping at all (-1 → 0).
  return Math.max(0, i);
});

function settle(index: number) {
  const point = points.value[index];
  if (!point) return;
  localSnap.value = point.value;
  if (point.value !== props.activeSnapPoint) emit("update:activeSnapPoint", point.value);
}

const keyboardOpen = computed(() => viewport.inset.value > 0);

// --- The gesture ----------------------------------------------------------------------
const gesture = useDragDismiss({
  panel: panelRef,
  edge: () => "bottom",
  // Not while it is leaving: a touch then would freeze the exit under the finger.
  enabled: () => !props.noDrag && isAnimating.value,
  dismissible: () => !props.persistent,
  handle: () => handleRef.value,
  // With the keyboard up the sheet shows as much as fits, at offset 0.
  stops: () => (keyboardOpen.value ? [0] : stops.value),
  stop: () => (keyboardOpen.value ? 0 : stopIndex.value),
  onSettle: settle,
  onDismiss: closeOverlay,
});

// --- Style ----------------------------------------------------------------------------
// The keyboard: a sheet at the bottom of the layout viewport is under it, so it is anchored
// to the visual viewport's bottom and held to the room left. Snap offsets stand down: the
// sheet shows as much as fits.
const panelVars = computed(() => {
  const vars: Record<string, string> = {};
  if (snapping.value) {
    vars["--_drawer-height"] = `${panelHeight.value}px`;
    // The tallest snap point is the sheet's height, whatever the viewport: no cap under it.
    vars["--_drawer-max-height"] = "none";
  }
  if (snapping.value && !keyboardOpen.value) vars["--_drawer-snap-offset"] = `${stops.value[stopIndex.value] ?? 0}px`;
  if (keyboardOpen.value) {
    vars["--_drawer-keyboard-inset"] = `${viewport.inset.value}px`;
    vars["--_drawer-max-height"] = `${viewport.height.value}px`;
  }
  return vars;
});

const panelClass = computed(() => ({ "cui-drawer__panel--visible": isAnimating.value }));

const titleId = useCuiId("drawer-title");
// The theme scope around the drawer, on the teleported overlay (#418).
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
        class="cui-drawer-overlay"
        :class="[themeScope, { 'cui-drawer-overlay--stacked': join.stacked }]"
        :style="{ position: 'fixed', inset: '0', zIndex: join.zIndex() }"
        @keydown="onKeydown"
      >
        <CuiBackdrop
          v-if="!join.stacked"
          data-cui-exit
          :visible="isAnimating"
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

        <div
          ref="panelEl"
          data-cui-exit
          class="cui-drawer__panel"
          :class="panelClass"
          :style="panelVars"
          role="dialog"
          :aria-modal="join.isModal() ? 'true' : 'false'"
          :aria-labelledby="title ? titleId : undefined"
          tabindex="-1"
          v-bind="$attrs"
          @pointerdown="gesture.onPointerdown"
          @click.capture="gesture.onClickCapture"
          @scroll.capture="gesture.onScrollCapture"
        >
          <!-- The grab handle: decorative, so a pointer can drag the sheet from it. Touch
               drags from anywhere, and the close button, Escape and the backdrop all close it. -->
          <div v-if="!noHandle" ref="handleEl" class="cui-drawer__handle" aria-hidden="true">
            <span class="cui-drawer__grip" />
          </div>

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
   panels beneath them. The root lets pointer events through; the panel takes them. The one
   backdrop is the stack's own (CuiSlideoverStack), not a panel's. */
.cui-drawer-overlay--stacked {
  pointer-events: none;
}
.cui-drawer-overlay--stacked .cui-drawer__panel {
  pointer-events: auto;
}

/* --- Panel --- */
/* Themeable: zero specificity, so a class forwarded onto the panel or a consumer's own
   `.cui-drawer__panel { … }` wins without `!important`. */
:where(.cui-drawer__panel) {
  width: var(--cui-drawer-width, 100%);
  height: var(--cui-drawer-height, var(--_drawer-height, auto));
  border-top-left-radius: var(--cui-drawer-radius, var(--cui-radius-lg, 0.5rem));
  border-top-right-radius: var(--cui-drawer-radius, var(--cui-radius-lg, 0.5rem));
  background: var(--cui-surface-base);
  box-shadow: var(--cui-shadow-lg);
}

.cui-drawer__panel {
  position: absolute;
  z-index: 2;
  left: 0;
  right: 0;
  bottom: var(--_drawer-keyboard-inset, 0px);
  margin-inline: auto;
  max-width: 100%;
  max-height: var(--_drawer-max-height, calc(100dvh - 2rem));
  display: flex;
  flex-direction: column;
  outline: none;
  overflow: hidden;
  /* A touch drag moves the sheet instead of panning the page; pinch-zoom stays. A scroll
     container inside keeps its own native panning (touch-action stops at it). */
  touch-action: pinch-zoom;
  /* Off-screen until visible. Slides out faster than it came in, with its backdrop (#269):
     a transition takes the duration of the state it moves to. */
  transform: translateY(100%);
  transition: transform var(--cui-duration-fast) var(--cui-ease-drawer);
}

/* Open: the iOS sheet curve over twice the slow token (500ms), matching a native sheet. The
   one exception to the 300ms ceiling on UI motion (#268): the sheet crosses most of the screen,
   and a shorter run reads as a snap. The exit stays fast. */
.cui-drawer__panel--visible {
  transform: translateY(var(--_drawer-snap-offset, 0px));
  transition-duration: calc(var(--cui-duration-slow) * 2);
}

/* No text selection while a pointer drags it. */
.cui-drawer__panel[data-cui-dragging] {
  user-select: none;
  -webkit-user-select: none;
}

/* --- Handle --- */
.cui-drawer__handle {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  padding-block: 0.5rem 0.25rem;
  cursor: grab;
}

.cui-drawer__panel[data-cui-dragging] .cui-drawer__handle {
  cursor: grabbing;
}

:where(.cui-drawer__grip) {
  width: 2.5rem;
  height: 0.25rem;
  border-radius: 9999px;
  background: var(--cui-border-strong);
}
.cui-drawer__grip {
  display: block;
}
</style>

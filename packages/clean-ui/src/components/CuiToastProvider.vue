<script setup lang="ts">
import { provide, toRef, computed } from "vue";
import CuiToast from "./CuiToast.vue";
import CuiButton from "./CuiButton.vue";
import { POPOVER_Z_INDEX } from "../utils/position";
import { useScopedTheme } from "../composables/useScopedTheme";
import {
  ToastContextKey,
  createToastState,
  type ToastAction,
  type ToastPosition,
  type ToastStackMode,
} from "./toast-context";

export interface CuiToastProviderProps {
  /** Position of the toast container */
  position?: ToastPosition;
  /** Stack mode: expanded (all visible) or collapsed (peek) */
  stackMode?: ToastStackMode;
  /** Maximum visible toasts */
  maxToasts?: number;
}

const props = withDefaults(defineProps<CuiToastProviderProps>(), {
  position: "bottom-center",
  stackMode: "expanded",
  maxToasts: 5,
});

const state = createToastState(
  toRef(props, "position"),
  toRef(props, "stackMode"),
  toRef(props, "maxToasts"),
);

provide(ToastContextKey, state);

// Position CSS
const containerStyle = computed(() => {
  const p = props.position;
  const style: Record<string, string> = {
    position: "fixed",
    zIndex: POPOVER_Z_INDEX, // above an open modal
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.5rem * var(--cui-density-scale, 1))",
    padding: "calc(1rem * var(--cui-density-scale, 1))",
    pointerEvents: "none",
    maxHeight: "100vh",
    overflow: "hidden",
  };

  if (p.includes("top")) {
    style.top = "0";
  } else {
    style.bottom = "0";
    style.flexDirection = "column-reverse";
  }

  if (p.includes("left")) {
    style.left = "0";
    style.alignItems = "flex-start";
  } else if (p.includes("right")) {
    style.right = "0";
    style.alignItems = "flex-end";
  } else {
    style.left = "50%";
    style.transform = "translateX(-50%)";
    style.alignItems = "center";
  }

  return style;
});

/**
 * A leaving toast is taken out of the flow (position: absolute, in its leave class) so the
 * rest can move into its place. In a flex container an absolute item would jump to the
 * start edge, so pin it where it is first: its offset in the container, and its width.
 */
function pinLeaving(el: Element) {
  const node = el as HTMLElement;
  moveFocusOutOf(node);
  node.style.top = `${node.offsetTop}px`;
  node.style.left = `${node.offsetLeft}px`;
  node.style.width = `${node.offsetWidth}px`;
}

// Focus in a toast that goes (dismissed, cleared, or pushed out by maxToasts) would fall to
// <body>, and the next Tab start over from the top of the page (#344, WCAG 2.4.3). It moves
// to the next toast instead, or the one before, as for any item removed from a list, or
// back to where it was before it came into the stack.
const TOAST_FOCUSABLE = 'button:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])';
let returnFocusTo: HTMLElement | null = null;

function onStackFocusin(e: FocusEvent) {
  const from = e.relatedTarget;
  if ((e.currentTarget as HTMLElement).contains(from as Node | null)) return;
  // Nothing was focused before (a click on the page, then Tab): nowhere to go back to.
  returnFocusTo = from instanceof HTMLElement ? from : null;
}

/** Focus `el`, and say whether it took: a hidden or disabled element silently refuses. */
function tryFocus(el: HTMLElement | null | undefined) {
  el?.focus({ preventScroll: true });
  return !!el && document.activeElement === el;
}

function moveFocusOutOf(leaving: HTMLElement) {
  if (!leaving.contains(document.activeElement)) return;
  const all = [...(leaving.parentElement?.children ?? [])] as HTMLElement[];
  const at = all.indexOf(leaving);
  const staying = (t: HTMLElement) => t !== leaving && !t.classList.contains("cui-toast-leave-active");
  const candidates = [...all.slice(at + 1), ...all.slice(0, at).reverse()].filter(staying);
  for (const toast of candidates) {
    if (tryFocus(toast.querySelector<HTMLElement>(TOAST_FOCUSABLE))) return;
  }
  const back = returnFocusTo;
  returnFocusTo = null;
  if (back?.isConnected) tryFocus(back);
}

function runAction(id: string, action: ToastAction) {
  action.onClick();
  if (action.dismissOnClick !== false) state.dismiss(id);
}

// A click anywhere on a collapsed toast dismisses it, except on one of its buttons: those
// do their own thing, and an action with `dismissOnClick: false` must leave it open (#345).
function onWrapperClick(e: MouseEvent, toast: { id: string; _collapsed: boolean }) {
  if (toast._collapsed && !(e.target as Element).closest(TOAST_FOCUSABLE)) state.dismiss(toast.id);
}

// Slide direction based on position
const slideFrom = computed(() => {
  const p = props.position;
  if (p.includes("left")) return "left";
  if (p.includes("right")) return "right";
  if (p.includes("top")) return "top";
  return "bottom";
});

// Collapsed mode: only show first toast fully, others peek
const visibleToasts = computed(() => {
  if (props.stackMode === "collapsed" && state.toasts.value.length > 1) {
    return state.toasts.value.map((t, i) => ({
      ...t,
      _collapsed: i < state.toasts.value.length - 1,
      _stackIndex: state.toasts.value.length - 1 - i,
    }));
  }
  return state.toasts.value.map((t) => ({ ...t, _collapsed: false, _stackIndex: 0 }));
});

// The theme scope around the provider, on the teleported stack (#418). A provider usually
// wraps the whole app, where there is none; one placed inside a scope carries it.
const themeScope = useScopedTheme(() => state.toasts.value.length > 0);
</script>

<template>
  <!-- App content -->
  <slot />

  <!-- Toast container -->
  <Teleport to="body">
    <!-- Arrivals slide in from the screen edge, leavers fade out, and the rest move into
         place (#263): a TransitionGroup, so a removed toast no longer jumps the stack. -->
    <TransitionGroup tag="div" name="cui-toast" :style="containerStyle" class="cui-toast-container" :class="themeScope" @before-leave="pinLeaving" @focusin="onStackFocusin">
      <div
        v-for="(toast, index) in visibleToasts"
        :key="toast.id"
        class="cui-toast-wrapper"
        :class="[`cui-toast-wrapper--slide-${slideFrom}`, { 'cui-toast-wrapper--collapsed': toast._collapsed }]"
        :style="{ pointerEvents: 'auto' }"
        @click="onWrapperClick($event, toast)"
      >
        <!-- The collapsed stack's peek, on an inner element: the wrapper's transform and
             opacity belong to the TransitionGroup, whose move and leave would overwrite or
             lose to them (#263). Emitted as private properties and applied by the stylesheet,
             which drops the peek while keyboard focus (:focus-visible) is inside, so a keyboard
             user's action or dismiss button is never clipped out of sight (#345). Not
             :focus-within: a mouse press focuses the button too, and the toast would grow out
             from under the pointer before the click lands. -->
        <div
          class="cui-toast-wrapper__peek"
          :style="toast._collapsed ? {
            '--_toast-peek-transform': `scale(${1 - toast._stackIndex * 0.05}) translateY(${toast._stackIndex * -8}px)`,
            '--_toast-peek-opacity': String(Math.max(0.4, 1 - toast._stackIndex * 0.2)),
          } : undefined"
        >
        <CuiToast
          :toast-id="toast.id"
          :title="toast.title"
          :description="toast.description"
          :color="toast.color"
          :variant="toast.variant"
          :dismissible="toast.dismissible"
          :auto-dismiss="toast.autoDismiss"
          :show-progress="toast.showProgress"
          :animation="toast.animation"
          :icon="toast.icon"
          :no-icon="toast.noIcon"
          :live="toast.live"
          :active="index === visibleToasts.length - 1"
          :pause-on-hover="toast.pauseOnHover"
          :pause-on-focus="toast.pauseOnFocus"
          :pause-when-inactive="toast.pauseWhenInactive"
          @dismiss="state.dismiss(toast.id)"
        >
          <!-- A real <button> inside the toast's live region, so role="status"/"alert" is
               unchanged (#345). Ghost: subtle-first, the toast already carries the colour.
               On a solid toast a ghost's role-coloured text would vanish into the fill; a
               solid button there is the same fill and text colour, so it still reads as
               a ghost at rest, and darkens through the role's -solid-hover slot. -->
          <template v-if="toast.action" #actions>
            <CuiButton
              class="cui-toast-action"
              size="sm"
              :variant="toast.variant === 'solid' ? 'solid' : 'ghost'"
              :color="toast.color"
              @click="runAction(toast.id, toast.action)"
            >
              {{ toast.action.label }}
            </CuiButton>
          </template>
        </CuiToast>
        </div>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<style scoped>
/* The collapsed stack's own scale and fade as toasts pile up. Its height (max-height)
   changes with no transition: a layout property, and the scale already carries the
   movement (#266). */
.cui-toast-wrapper__peek {
  transition: transform var(--cui-duration-slow) var(--cui-ease-out), opacity var(--cui-duration-slow) var(--cui-ease-out);
}

.cui-toast-wrapper--collapsed {
  cursor: pointer;
}

.cui-toast-wrapper--collapsed:not(:has(:focus-visible)) > .cui-toast-wrapper__peek {
  transform: var(--_toast-peek-transform);
  opacity: var(--_toast-peek-opacity);
  max-height: 3rem;
  overflow: hidden;
}
/* --- Enter, leave and move (#263) ---
   Arrive over `slow` from the screen edge they belong to; leave faster, fading where they
   are (pinned there by pinLeaving, out of the flow) while the rest slide into place. CSS
   mode is fine for a list: a keyed toast never re-enters, so nothing has to reverse. */
.cui-toast-enter-active,
.cui-toast-move {
  transition: transform var(--cui-duration-slow) var(--cui-ease-out), opacity var(--cui-duration-slow) var(--cui-ease-out);
}

.cui-toast-leave-active {
  position: absolute;
  transition: transform var(--cui-duration-fast) var(--cui-ease-out), opacity var(--cui-duration-fast) var(--cui-ease-out);
  pointer-events: none;
}

.cui-toast-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.cui-toast-enter-from { opacity: 0; }
.cui-toast-enter-from.cui-toast-wrapper--slide-top { transform: translateY(-1rem); }
.cui-toast-enter-from.cui-toast-wrapper--slide-bottom { transform: translateY(1rem); }
.cui-toast-enter-from.cui-toast-wrapper--slide-left { transform: translateX(-2rem); }
.cui-toast-enter-from.cui-toast-wrapper--slide-right { transform: translateX(2rem); }
</style>

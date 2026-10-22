import { ref, watch, onMounted, onUnmounted, nextTick, type Ref, type ShallowRef } from "vue";
import { restoreKeyOf, returnFocus } from "../utils/focusRestore";
import { lockBodyScroll, unlockBodyScroll } from "../utils/scrollLock";
import { useLayerStack } from "./useLayerStack";
import { usePresence } from "./usePresence";
import { warnOnce } from "../utils/devWarn";
import { motionDuration, type MotionDuration } from "../utils/motion";

export interface UseOverlayOptions {
  /** Reactive open prop from the consumer */
  open: () => boolean;
  /** Ref to the dialog/panel element for focus trap */
  dialogRef: Ref<HTMLElement | undefined> | ShallowRef<HTMLElement | null> | Readonly<ShallowRef<HTMLElement | null>>;
  /** Whether closing via Escape/backdrop is blocked */
  persistent: () => boolean;
  /**
   * @deprecated Has no effect: overlays always stack, and the shared layer stack closes only
   * the topmost on Escape (#285). It never did anything — it only cleared a set nothing read.
   * Removed in 2.0.
   */
  allowNested?: () => boolean;
  /** The component using it, for the deprecation warning — "CuiModal". Defaults to "useOverlay". */
  name?: string;
  /**
   * @deprecated With `exit: "timer"` only, which 2.0 drops: use `exit: "transition"`.
   * How long the exit animation runs before the overlay is removed: a motion token's name
   * (#261), read from the dialog element when it closes so a container's override counts,
   * or a fixed number of ms. Defaults to `"base"`.
   */
  animationDuration?: MotionDuration | number;
  /**
   * How the overlay knows its exit has finished (#263). `"timer"` (the default, kept for
   * existing callers; deprecated, and `"transition"` becomes the default in 2.0) waits
   * `animationDuration`. `"transition"` waits for the returned `onAfterLeave()`, called from
   * a `<Transition>`'s `after-leave`: the panel is rendered `v-if` mounted and `v-show`
   * `isVisible`, so a re-open mid-exit reverses rather than restarting, and nothing waits on
   * a hand-copied duration. CuiModal and CuiSlideover use it.
   */
  exit?: "timer" | "transition";
  /** Called to emit update:open */
  onUpdateOpen: (value: boolean) => void;
  /** Called to emit close */
  onClose: () => void;
}

export function useOverlay(options: UseOverlayOptions) {
  const {
    open: getOpen,
    dialogRef,
    persistent: getPersistent,
    animationDuration = "base",
    exit = "timer",
    onUpdateOpen,
    onClose,
  } = options;

  if (options.allowNested !== undefined) {
    warnOnce(
      `[clean-ui] ${options.name ?? "useOverlay"}: \`allowNested\` is deprecated and has no effect — overlays always stack, and Escape closes only the topmost (#285). Remove it; it goes in 2.0.`,
    );
  }

  const isVisible = ref(false);
  const isAnimating = ref(false);
  const previousFocus = ref<HTMLElement | null>(null);
  // The opener's restore key, if it carries one: what brings it back if it has unmounted by
  // the time this closes (a virtualised grid row, #232).
  let previousFocusKey: string | null = null;
  // Open from openOverlay() until closeOverlay() starts the exit, so Escape goes to the
  // layer beneath while this one animates out.
  const isOpen = ref(false);

  // The scroll lock is reference-counted globally, so this instance must
  // release exactly what it took. close() can run without a preceding open
  // (a `visible` flag set false while already closed) and unmount races the
  // exit-animation timeout, so both paths go through this guard.
  let holdsScrollLock = false;

  function acquireScrollLock() {
    if (holdsScrollLock) return;
    holdsScrollLock = true;
    lockBodyScroll();
  }

  function releaseScrollLock() {
    if (!holdsScrollLock) return;
    holdsScrollLock = false;
    unlockBodyScroll();
  }

  function openOverlay() {
    isOpen.value = true;
    // Re-opened mid-exit, focus is still in the dialog: the opener it returns to is the first.
    if (!dialogRef.value?.contains(document.activeElement)) {
      previousFocus.value = document.activeElement as HTMLElement;
      previousFocusKey = restoreKeyOf(previousFocus.value);
    }
    isVisible.value = true;

    acquireScrollLock();

    // nextTick alone schedules a microtask, which runs before the browser
    // paints — so the element mounts (off-screen transform) and flips to its
    // final transform in the same frame, and the enter transition never fires.
    // requestAnimationFrame defers the flip until after a paint, giving the
    // compositor a rendered off-screen frame to transition from.
    nextTick(() => {
      requestAnimationFrame(() => {
        isAnimating.value = true;
        dialogRef.value?.focus();
      });
    });
  }

  /** The exit has played: report the close, give the page back, return focus. */
  function finishClose() {
    onUpdateOpen(false);
    onClose();

    releaseScrollLock();

    // Return focus — to the opener, or, if it has unmounted, through its restore key.
    returnFocus(previousFocus.value, previousFocusKey);
  }

  function closeOverlay() {
    isAnimating.value = false;
    isOpen.value = false;

    if (exit === "transition") {
      // v-show hides it, and its <Transition> plays the exit, then calls onAfterLeave.
      isVisible.value = false;
      return;
    }

    // Wait for exit animation
    setTimeout(() => {
      isVisible.value = false;
      finishClose();
    }, typeof animationDuration === "number" ? animationDuration : motionDuration(animationDuration, dialogRef.value));
  }

  /**
   * For `exit: "transition"`: the `<Transition>`'s `after-leave`. Mounted until then, as
   * `mounted`. A leave that a re-open cancelled never calls it.
   */
  const { present: mounted, onAfterLeave: unmount } = usePresence(() => isVisible.value);
  function onAfterLeave() {
    // Once per close: unmounting it runs the leave hooks again, with nothing to wait for.
    if (isVisible.value || !mounted.value) return;
    unmount();
    finishClose();
  }

  function requestClose() {
    if (getPersistent()) return;
    closeOverlay();
  }

  function onBackdropClick() {
    requestClose();
  }

  // Escape comes from the shared layer stack, so only the topmost overlay closes (#278).
  // A persistent overlay still takes the Escape and declines it.
  useLayerStack({ active: isOpen, onEscape: requestClose, modal: true });

  function onKeydown(e: KeyboardEvent) {
    // Focus trap
    if (e.key === "Tab" && dialogRef.value) {
      const focusable = dialogRef.value.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
  }

  // Watch open prop
  watch(getOpen, (newOpen) => {
    if (newOpen) {
      openOverlay();
    } else {
      closeOverlay();
    }
  });

  onMounted(() => {
    if (getOpen()) openOverlay();
  });

  onUnmounted(() => {
    releaseScrollLock();
  });

  return {
    isVisible,
    isAnimating,
    mounted,
    onAfterLeave,
    openOverlay,
    closeOverlay,
    requestClose,
    onBackdropClick,
    onKeydown,
  };
}

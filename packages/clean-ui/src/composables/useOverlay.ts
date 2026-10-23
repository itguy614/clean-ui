import { ref, watch, onMounted, onUnmounted, nextTick, type Ref, type ShallowRef } from "vue";
import { restoreKeyOf, returnFocus } from "../utils/focusRestore";
import { lockBodyScroll, unlockBodyScroll } from "../utils/scrollLock";
import { useLayerStack } from "./useLayerStack";
import { usePresence } from "./usePresence";
import { warnOnce } from "../utils/devWarn";
import { motionDuration, type MotionDuration } from "../utils/motion";
import { tabbableIn } from "../utils/focusable";

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

  let enterFrame: number | null = null;

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
      // Closed again before this tick: there is no entry to start.
      if (!isOpen.value) return;
      enterFrame = requestAnimationFrame(() => {
        enterFrame = null;
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
    // Already closing, or closed: once is enough. Without this the consumer's v-model echo
    // of the close, `open` turning false, started a second close and reported it twice (#339).
    if (!isOpen.value) return;
    // Closed within a frame of opening: the entry hasn't flipped yet, and mustn't now.
    if (enterFrame !== null) {
      cancelAnimationFrame(enterFrame);
      enterFrame = null;
    }
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

  // Focus trap: Tab and Shift+Tab wrap inside the dialog (#339).
  function onKeydown(e: KeyboardEvent) {
    const dialog = dialogRef.value;
    if (e.key !== "Tab" || !dialog) return;
    const items = tabbableIn(dialog);
    // Nothing to tab to: focus stays on the dialog rather than leaving it.
    if (!items.length) {
      e.preventDefault();
      dialog.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    // On the dialog itself (where it opens), or somehow outside it: Shift+Tab would leave.
    const atStart = active === first || active === dialog || !dialog.contains(active);
    if (e.shiftKey && atStart) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
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

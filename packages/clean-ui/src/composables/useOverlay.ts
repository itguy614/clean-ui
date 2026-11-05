import { ref, watch, onMounted, onUnmounted, nextTick, type Ref, type ShallowRef } from "vue";
import { focusTook, resolveFocusTarget, restoreKeyOf, returnFocus } from "../utils/focusRestore";
import { lockBodyScroll, unlockBodyScroll } from "../utils/scrollLock";
import { useLayerStack } from "./useLayerStack";
import { usePresence } from "./usePresence";
import { __DEV__, warnOnce } from "../utils/devWarn";
// Module-scoped: the bundler replaces `process.env.NODE_ENV`, and Node's types stay out of the build.
declare const process: { env: { NODE_ENV?: string } };
import { afterAnimations, motionDuration, type MotionDuration } from "../utils/motion";
import type { CuiFocusTarget } from "../types/common";
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
  /**
   * The element whose animations, with those of its `[data-cui-exit]` descendants, make up
   * the entry `onOpened` waits for — the overlay root holding the backdrop and the panel.
   * Defaults to `dialogRef`.
   */
  rootRef?: Ref<HTMLElement | undefined> | ShallowRef<HTMLElement | null> | Readonly<ShallowRef<HTMLElement | null>>;
  /**
   * Element focused on open, in place of the dialog (#374). A selector is scoped to the
   * dialog, and an element outside it is ignored. It wins over a field the content focused
   * on mount; naming nothing it can focus, the default applies.
   */
  initialFocus?: () => CuiFocusTarget | undefined;
  /**
   * Element focused once closed, in place of the opener (#374): a selector is looked up in
   * the document, a function is called then. `false` leaves focus alone; naming nothing it
   * can focus (gone, hidden, disabled, or inside the closing dialog), focus returns to the
   * opener.
   */
  returnFocus?: () => CuiFocusTarget | false | undefined;
  /** Called once the entry has finished and focus is in place (`after-enter`). */
  onOpened?: () => void;
  /** Called once the exit has finished and focus has been returned (`after-leave`). */
  onClosed?: () => void;
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
    rootRef = dialogRef,
    initialFocus: getInitialFocus,
    returnFocus: getReturnFocus,
    onOpened,
    onClosed,
  } = options;

  if (__DEV__ && process.env.NODE_ENV !== "production" && options.allowNested !== undefined) {
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
  // Bumped as each entry starts, and by every close and unmount, so an entry's end reports
  // only if nothing has happened since it began: closed mid-entry, it never "opened".
  let entry = 0;
  /** `exit: "timer"`'s pending close, cancelled by a re-open mid-exit (#339). */
  let exitTimer: ReturnType<typeof setTimeout> | null = null;

  function openOverlay() {
    // Re-opened mid-exit: the old timer would still hide it and report a close, and the
    // consumer's echo of that close would start another.
    if (exitTimer !== null) {
      clearTimeout(exitTimer);
      exitTimer = null;
    }
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
        focusInitial();
        // The flip renders on the next tick; its transitions exist from then.
        const current = ++entry;
        nextTick(() => {
          const done = () => current === entry && onOpened?.();
          if (rootRef.value) afterAnimations(rootRef.value, done);
          else done();
        });
      });
    });
  }

  /**
   * Focus on open: an explicit `initialFocus` wins — the consumer named it. Otherwise
   * content that focused its own field on mount (a URL dialog's input, #420) keeps it: this
   * frame comes after the content's own nextTick, and would otherwise steal focus back.
   * Failing both, the dialog itself. Focus never leaves the dialog for an element outside it.
   */
  function focusInitial() {
    const dialog = dialogRef.value;
    const target = resolveFocusTarget(getInitialFocus?.(), dialog);
    if (target && dialog?.contains(target) && focusTook(target)) return;
    if (!dialog?.contains(document.activeElement)) dialog?.focus();
  }

  /** The exit has played: report the close, give the page back, return focus. */
  function finishClose() {
    onUpdateOpen(false);
    onClose();

    releaseScrollLock();

    // Return focus — to `returnFocus` if it names an element that takes it (resolved now,
    // after the `close` handlers, so it can pick one they rendered; the closing dialog is
    // hidden by now, so nothing in it can); else to the opener or, if it has unmounted,
    // through its restore key. `false` leaves it where it is.
    const option = getReturnFocus?.();
    if (option !== false && !focusTook(resolveFocusTarget(option, document))) {
      returnFocus(previousFocus.value, previousFocusKey);
    }
    onClosed?.();
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
    entry++;

    if (exit === "transition") {
      // v-show hides it, and its <Transition> plays the exit, then calls onAfterLeave.
      isVisible.value = false;
      return;
    }

    // Wait for exit animation
    exitTimer = setTimeout(() => {
      exitTimer = null;
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
    entry++;
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

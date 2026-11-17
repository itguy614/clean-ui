import { computed, ref, watch, onMounted, onScopeDispose, onUnmounted, nextTick, type Ref, type ShallowRef } from "vue";
import { focusTook, resolveFocusTarget, restoreKeyOf, returnFocus } from "../utils/focusRestore";
import { lockBodyScroll, unlockBodyScroll } from "../utils/scrollLock";
import { useLayerStack } from "./useLayerStack";
import { useOverlayStackContext, type OverlayStackEntry } from "./overlay-stack-context";
import { OVERLAY_Z_INDEX } from "../utils/position";
import { usePresence } from "./usePresence";
import { afterAnimations } from "../utils/motion";
import type { CuiFocusTarget } from "../types/common";
import { tabbableIn } from "../utils/focusable";

export interface UseOverlayOptions {
  /** Reactive open prop from the consumer */
  open: () => boolean;
  /** Ref to the dialog/panel element for focus trap */
  dialogRef: Ref<HTMLElement | undefined> | ShallowRef<HTMLElement | null> | Readonly<ShallowRef<HTMLElement | null>>;
  /** Whether closing via Escape/backdrop is blocked */
  persistent: () => boolean;
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
  /**
   * Whether the overlay is modal. `undefined` inherits the stack's `modal` (true with no stack).
   * A co-active one (`false`) leaves the overlays beneath it interactive when it sits in a
   * stack, and never traps focus (#41).
   */
  modal?: () => boolean | undefined;
  /** The backdrop props this overlay asks for, drawn by the stack when it sits in one (#41). */
  backdrop?: () => Record<string, unknown>;
  /** The edge the overlay docks to, for a stack that checks its panels agree (#41). None by default. */
  side?: () => string;
}

export function useOverlay(options: UseOverlayOptions) {
  const {
    open: getOpen,
    dialogRef,
    persistent: getPersistent,
    onUpdateOpen,
    onClose,
    rootRef = dialogRef,
    initialFocus: getInitialFocus,
    returnFocus: getReturnFocus,
    onOpened,
    onClosed,
    modal: getModal = () => undefined,
    side: getSide = () => "",
    backdrop: getBackdrop,
  } = options;

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

  // `finishing`: closed, and the exit has not been reported yet. `kids`: what the overlays
  // nested in this one (#41) report when they close with it, run before this one's own report,
  // so a parent never reports before its children and focus lands on the parent's opener last.
  let finishing = false;
  let kids: (() => void)[] = [];

  let enterFrame: number | null = null;
  // Bumped as each entry starts, and by every close and unmount, so an entry's end reports
  // only if nothing has happened since it began: closed mid-entry, it never "opened".
  let entry = 0;

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
    if (!finishing) return;
    finishing = false;
    // Children report first, so their `close` precedes the parent's, whichever exit ended first.
    kids.splice(0).forEach((finish) => finish());
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
    // Overlays declared inside this one's content are its children (#41): they close first,
    // in the same tick, so the exits read as one motion and the stack never sees a half state.
    kids = closeNested();
    finishing = true;
    // Closed within a frame of opening: the entry hasn't flipped yet, and mustn't now.
    if (enterFrame !== null) {
      cancelAnimationFrame(enterFrame);
      enterFrame = null;
    }
    isAnimating.value = false;
    isOpen.value = false;
    entry++;

    // v-show hides it, and its <Transition> plays the exit, then calls onAfterLeave.
    isVisible.value = false;
  }

  /**
   * The `<Transition>`'s `after-leave` (the exit is a transition, never a timer). Mounted
   * until then, as `mounted`. A leave that a re-open cancelled never calls it.
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
    if (stack) stack.closeTop();
    else requestClose();
  }

  // Inside a stack (#41) the overlay joins the shared coordinator while open: it supplies
  // depth, z-order, the one backdrop and `inert`, and routes Escape and backdrop clicks. With
  // no stack this is a bare inject returning null, and nothing below changes.
  const stack = useOverlayStackContext();
  /** Its own `modal` if set, else the stack's, else true. */
  const isModal = () => getModal() ?? stack?.defaultModal() ?? true;
  let stackEntry: OverlayStackEntry | null = null;
  if (stack) {
    stackEntry = { modal: isModal, side: getSide, backdrop: getBackdrop, panel: () => dialogRef.value, root: () => rootRef.value, requestClose };
    const joined = stackEntry;
    watch(isOpen, (now) => (now ? stack.register(joined) : stack.unregister(joined)), { flush: "sync" });
    onScopeDispose(() => stack.unregister(joined));
  }

  // Escape comes from the shared layer stack, so only the topmost overlay closes (#278).
  // A persistent overlay still takes the Escape and declines it. In a stack the coordinator
  // picks which panel: the topmost active one, or the focused one in a co-active group.
  const { closeNested } = useLayerStack({
    active: isOpen,
    onEscape: stack ? () => stack.escape() : requestClose,
    modal: true,
    onParentClose: () => (closeOverlay(), finishClose),
  });

  /** The overlay root's `z-index`: one step above the overlay beneath it in a stack. */
  const zIndex = computed(() => (stack && stackEntry ? stack.zIndex(stackEntry) : OVERLAY_Z_INDEX));

  // Focus trap: Tab and Shift+Tab wrap inside the dialog (#339). A co-active overlay lets
  // focus move on to its siblings.
  function onKeydown(e: KeyboardEvent) {
    const dialog = dialogRef.value;
    if (e.key !== "Tab" || !dialog || !isModal()) return;
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
    zIndex,
    /** Whether the overlay sits in a stack: its root then lets pointer events through. */
    stacked: !!stack,
    /** Whether the dialog is modal after inheriting from the stack (`aria-modal`). */
    isModal: computed(isModal),
  };
}

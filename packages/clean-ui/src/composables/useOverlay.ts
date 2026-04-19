import { ref, watch, onMounted, onUnmounted, nextTick, type Ref, type ShallowRef } from "vue";

// Global set of active overlays shared across all instances
const globalActiveOverlays = new Set<symbol>();

export interface UseOverlayOptions {
  /** Reactive open prop from the consumer */
  open: () => boolean;
  /** Ref to the dialog/panel element for focus trap */
  dialogRef: Ref<HTMLElement | undefined> | ShallowRef<HTMLElement | null> | Readonly<ShallowRef<HTMLElement | null>>;
  /** Whether closing via Escape/backdrop is blocked */
  persistent: () => boolean;
  /** Allow opening on top of another overlay */
  allowNested: () => boolean;
  /** Exit animation duration in ms */
  animationDuration?: number;
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
    allowNested: getAllowNested,
    animationDuration = 200,
    onUpdateOpen,
    onClose,
  } = options;

  const overlayId = Symbol("overlay");
  const isVisible = ref(false);
  const isAnimating = ref(false);
  const previousFocus = ref<HTMLElement | null>(null);

  function openOverlay() {
    // One-at-a-time check
    if (!getAllowNested() && globalActiveOverlays.size > 0) {
      globalActiveOverlays.clear();
    }

    globalActiveOverlays.add(overlayId);
    previousFocus.value = document.activeElement as HTMLElement;
    isVisible.value = true;

    // Lock body scroll
    document.body.style.overflow = "hidden";

    nextTick(() => {
      isAnimating.value = true;
      dialogRef.value?.focus();
    });
  }

  function closeOverlay() {
    isAnimating.value = false;
    globalActiveOverlays.delete(overlayId);

    // Wait for exit animation
    setTimeout(() => {
      isVisible.value = false;
      onUpdateOpen(false);
      onClose();

      // Restore body scroll if no other overlays
      if (globalActiveOverlays.size === 0) {
        document.body.style.overflow = "";
      }

      // Return focus
      previousFocus.value?.focus();
    }, animationDuration);
  }

  function requestClose() {
    if (getPersistent()) return;
    closeOverlay();
  }

  function onBackdropClick() {
    requestClose();
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      requestClose();
    }

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
    globalActiveOverlays.delete(overlayId);
    if (globalActiveOverlays.size === 0) {
      document.body.style.overflow = "";
    }
  });

  return {
    isVisible,
    isAnimating,
    openOverlay,
    closeOverlay,
    requestClose,
    onBackdropClick,
    onKeydown,
  };
}

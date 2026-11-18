import { onScopeDispose, watch } from "vue";
import { overlayZIndex } from "../utils/overlayLayer";
import { closeNestedLayers } from "./useLayerStack";
import { useOverlayStackContext, type OverlayStackEntry } from "./overlay-stack-context";
import type { OverlayJoinCore } from "./useOverlay";

export interface JoinOptions {
  /** Its own `modal`; `undefined` inherits the stack's (true with no stack). */
  modal: () => boolean | undefined;
  /** The edge the overlay docks to, for a stack that checks its panels agree. None: a sheet. */
  side?: () => string;
  /** Its `hidden` prop: open but not shown, so the stack leaves it out of its layout. */
  hidden?: () => boolean;
  /** The backdrop props it asks for, drawn by the stack when it sits in one. */
  backdrop?: () => Record<string, unknown>;
}

/**
 * What CuiSlideover and CuiDrawer add to `useOverlay` (#41), and CuiModal does not, so a modal
 * (and the editor built on it) carries none of it. It does two things:
 *
 * - **Joins a stack** while open, if there is one: depth, z-order, `inert` and the one shared
 *   backdrop, and routing of Escape and backdrop clicks to the right panel. With no stack this is
 *   one optional inject returning null.
 * - **Closes the overlays nested in it**: one declared inside another's content is its child, by
 *   component tree (the Escape stack's `inModal` chain), and closes with it, newest first, in the
 *   same tick. Their reports run before the parent's, so focus lands on the parent's opener last.
 *   A modal does not do this: a slideover declared in a modal's content stays until the modal's
 *   content unmounts.
 *
 * Pass the result as `useOverlay`'s `join`; it comes back as `join` in the return value.
 */
export function joinStack(options: JoinOptions) {
  return (core: OverlayJoinCore) => {
    const stack = useOverlayStackContext();
    /** Its own `modal` if set, else the stack's, else true. */
    const isModal = () => options.modal() ?? stack?.defaultModal() ?? true;
    const entry: OverlayStackEntry = {
      modal: isModal,
      side: options.side ?? (() => ""),
      backdrop: options.backdrop,
      hidden: options.hidden,
      panel: () => core.dialogRef.value,
      root: () => core.rootRef.value,
      requestClose: core.requestClose,
      step: () => core.zStep.value,
    };
    if (stack) {
      watch(core.isOpen, (now) => (now ? stack.register(entry) : stack.unregister(entry)), { flush: "sync" });
      onScopeDispose(() => stack.unregister(entry));
    }
    let kids: (() => void)[] = [];
    return {
      /** Whether it sits in a stack: its root then lets pointer events through. */
      stacked: !!stack,
      /** The overlay root's `z-index`: its step, above every overlay open before it (#541). */
      zIndex: () => overlayZIndex(core.zStep.value),
      isModal,
      /**
       * The backdrop a drag of this overlay fades (#526). In a stack the backdrop is the
       * stack's, one for the group: it fades only for the one panel shown there, since a drag of
       * a panel above others would dim the page behind them too. `null`: leave it. `undefined`:
       * no stack, so the overlay's own.
       */
      fadeTarget: () => {
        if (!stack) return undefined;
        // A hidden panel is open but not on screen (#529): it is not one the page is dimmed behind.
        const shown = stack.entries.filter((e) => !e.hidden?.());
        return shown.length === 1 && shown[0] === entry ? stack.backdropEl.value : null;
      },
      onEscape: stack ? () => stack.escape() : undefined,
      // Children close first, in the same tick, so the exits read as one motion and a stack
      // never sees a half state.
      beforeClose: () => void (kids = closeNestedLayers(core.layer)),
      // Children report first, so their `close` precedes the parent's, whichever exit ended first.
      beforeFinish: () => kids.splice(0).forEach((finish) => finish()),
      onParentClose: () => (core.close(), core.finish),
    };
  };
}

/** The backdrop props a slideover or drawer asks of the stack, from its own `backdrop*` props. */
export function backdropOf(p: {
  backdropOpacity?: number;
  backdropBlur?: string;
  backdropColor?: string;
  backdropImage?: string;
  backdropGradient?: string;
  backdropFrom?: string;
  backdropVia?: string;
  backdropTo?: string;
  backdropAngle?: number;
  backdropSmooth?: boolean;
}): Record<string, unknown> {
  return {
    opacity: p.backdropOpacity,
    blur: p.backdropBlur,
    color: p.backdropColor,
    image: p.backdropImage,
    gradient: p.backdropGradient,
    from: p.backdropFrom,
    via: p.backdropVia,
    to: p.backdropTo,
    angle: p.backdropAngle,
    smooth: p.backdropSmooth,
  };
}

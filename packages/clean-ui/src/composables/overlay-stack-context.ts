import { inject, type InjectionKey, type ShallowRef } from "vue";

/**
 * What an overlay (CuiSlideover, CuiDrawer) tells the stack about itself when it opens. Every
 * member is a getter, so the stack always reads the overlay's current props and elements.
 */
export interface OverlayStackEntry {
  /** A modal panel makes everything beneath it inert; a co-active one (`false`) does not. */
  modal: () => boolean;
  /** The edge the panel docks to ("left", "right", "top", "bottom"), or "" for one with none (a drawer sheet). */
  side: () => string;
  /** The dialog element, where focus lives. */
  panel: () => HTMLElement | null | undefined;
  /** The teleported overlay root holding the panel and its backdrop: what `inert` goes on. */
  root: () => HTMLElement | null | undefined;
  /** The backdrop props (opacity, blur, color, image, gradient...) this panel asks for. */
  backdrop?: () => Record<string, unknown>;
  /** Close this panel, unless it is `persistent`. */
  requestClose: () => void;
}

/** The shared coordinator behind a stack of overlays (#41). Entries are in open order. */
export interface OverlayStackContext {
  /** The open overlays, bottom first. Reactive. */
  readonly entries: readonly OverlayStackEntry[];
  register: (entry: OverlayStackEntry) => void;
  unregister: (entry: OverlayStackEntry) => void;
  /** The stack's `modal`: what an overlay that sets none of its own inherits. */
  defaultModal: () => boolean;
  /** The CSS `z-index` of the entry's overlay root: one step above the entry beneath it. */
  zIndex: (entry: OverlayStackEntry) => string;
  /**
   * The panel whose backdrop props (opacity, blur, gradient) the one shared backdrop takes: the
   * lowest active one. The backdrop itself is drawn once by the stack, not by any panel.
   */
  backdropEntry: () => OverlayStackEntry | undefined;
  /** The element of the one shared backdrop, set by the stack while it draws one: what a drag fades (#526). */
  readonly backdropEl: ShallowRef<HTMLElement | null>;
  /** The bottom panel: the backdrop's layer is just behind its root, whoever is active. */
  bottomEntry: () => OverlayStackEntry | undefined;
  /** Backdrop click: closes the topmost panel, if it is not `persistent`. */
  closeTop: () => void;
  /** Escape: closes the topmost active panel, or the focused one in a co-active group. */
  escape: () => void;
}

export const OverlayStackKey: InjectionKey<OverlayStackContext> = Symbol("cui-overlay-stack");

/**
 * The stack the calling overlay sits in, or `null` outside one. Unlike most `useXContext()`
 * hooks it does not throw: an overlay with no stack is the normal case, and it must cost
 * nothing, so this is a bare optional inject.
 */
export function useOverlayStackContext(): OverlayStackContext | null {
  return inject(OverlayStackKey, null);
}

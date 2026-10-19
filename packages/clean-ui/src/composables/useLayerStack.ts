import { onScopeDispose, watch, type WatchSource } from "vue";

/**
 * The shared Escape stack for overlays (#278): modals, slideovers, popovers and tooltips.
 *
 * Every open layer registers here, in the order it opened, and one document keydown
 * listener — attached only while any layer is open — hands Escape to the **topmost**
 * (most recently opened) layer alone, then stops the event. A tooltip opened inside a
 * modal closes first; one left showing beneath a modal opened later does not take the
 * modal's Escape.
 *
 * A layer that does nothing with the Escape (a `persistent` modal) still consumes it, so
 * the key goes nowhere rather than closing the layer beneath.
 *
 * The listener runs in the bubble phase and ignores an Escape that something inside the
 * page already handled (`defaultPrevented`): an open select or combobox popup inside a
 * modal closes on its own and the modal stays open.
 */
type Layer = () => void;

const stack: Layer[] = [];

function onDocumentKeydown(e: KeyboardEvent) {
  if (e.key !== "Escape" || e.isComposing || e.defaultPrevented) return;
  const top = stack.at(-1);
  if (!top) return;
  e.preventDefault();
  e.stopPropagation();
  top();
}

function register(layer: Layer) {
  stack.push(layer);
  if (stack.length === 1) document.addEventListener("keydown", onDocumentKeydown);
}

function unregister(layer: Layer) {
  const index = stack.indexOf(layer);
  if (index === -1) return;
  stack.splice(index, 1);
  if (stack.length === 0) document.removeEventListener("keydown", onDocumentKeydown);
}

export interface UseLayerStackOptions {
  /** Whether the layer is open, and so takes part in the stack. */
  active: WatchSource<boolean>;
  /** Called on Escape while this is the topmost layer. */
  onEscape: () => void;
}

/** Registers the calling component as a layer while `active` is true. Call in setup. */
export function useLayerStack({ active, onEscape }: UseLayerStackOptions): void {
  if (typeof document === "undefined") return;
  // Its own function per call, so two layers sharing a handler stay distinct entries.
  const layer: Layer = () => onEscape();
  // Sync, so a layer that closes on one Escape has left the stack before the next arrives.
  watch(active, (open) => (open ? register(layer) : unregister(layer)), { immediate: true, flush: "sync" });
  onScopeDispose(() => unregister(layer));
}

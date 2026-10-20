import { inject, onScopeDispose, provide, watch, type InjectionKey, type WatchSource } from "vue";

/**
 * The shared Escape stack for overlays (#278): modals, slideovers, popovers, tooltips and
 * dropdowns.
 *
 * Every open layer registers here, and one document keydown listener — attached only
 * while any layer is open — hands Escape to the **topmost** layer alone, then stops the
 * event. Layers stack in the order they opened, with one exception: a layer that opens
 * **outside** the topmost modal goes beneath it. A tooltip whose show delay runs out
 * after its button opened a modal appears under the backdrop, and must not take the
 * modal's Escape. "Outside" means the component tree, not the DOM — a tooltip inside a
 * popover inside a modal is teleported to <body> but still belongs to the modal.
 *
 * A layer that does nothing with the Escape (a `persistent` modal) still consumes it, so
 * the key goes nowhere rather than closing the layer beneath.
 *
 * The listener runs in the bubble phase and ignores an Escape that something inside the
 * page already handled (`defaultPrevented`): an open select or combobox popup inside a
 * modal closes on its own and the modal stays open.
 */
interface Layer {
  onEscape: () => void;
  modal: boolean;
  /** The nearest enclosing modal layer in the component tree. */
  inModal: Layer | null;
}

const ModalLayerKey: InjectionKey<Layer> = Symbol("cui-modal-layer");

const stack: Layer[] = [];

function belongsTo(layer: Layer, modal: Layer) {
  for (let m = layer.inModal; m; m = m.inModal) if (m === modal) return true;
  return false;
}

function topModalIndex() {
  for (let i = stack.length - 1; i >= 0; i--) if (stack[i].modal) return i;
  return -1;
}

function onDocumentKeydown(e: KeyboardEvent) {
  if (e.key !== "Escape" || e.isComposing || e.defaultPrevented) return;
  const top = stack.at(-1);
  if (!top) return;
  e.preventDefault();
  e.stopPropagation();
  top.onEscape();
}

function register(layer: Layer) {
  const topModal = topModalIndex();
  if (!layer.modal && topModal !== -1 && !belongsTo(layer, stack[topModal])) stack.splice(topModal, 0, layer);
  else stack.push(layer);
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
  /** A modal layer (Modal, Slideover): a layer opened outside it later goes beneath it. */
  modal?: boolean;
}

/** Registers the calling component as a layer while `active` is true. Call in setup. */
export function useLayerStack({ active, onEscape, modal = false }: UseLayerStackOptions): void {
  const layer: Layer = { onEscape, modal, inModal: inject(ModalLayerKey, null) };
  if (modal) provide(ModalLayerKey, layer);

  if (typeof document === "undefined") return;
  // Sync, so a layer that closes on one Escape has left the stack before the next arrives.
  watch(active, (open) => (open ? register(layer) : unregister(layer)), { immediate: true, flush: "sync" });
  onScopeDispose(() => unregister(layer));
}

import { onScopeDispose, provide, shallowReactive, watchPostEffect } from "vue";
import { __DEV__, warnOnce } from "../utils/devWarn";
import { OverlayStackKey, type OverlayStackContext, type OverlayStackEntry } from "./overlay-stack-context";

// Module-scoped, so the library doesn't pull Node's global types into its own build.
declare const process: { env: { NODE_ENV?: string } };

/** Layers above the bottom overlay stay below popovers (`--cui-z-overlay` + 8). */
const MAX_Z_STEP = 7;

/**
 * Where the active set starts. Walk down from the top: the top panel is always active, and so
 * is each one beneath it while the one above was co-active (`modal` false). The walk stops at
 * the first modal panel, which is active itself. Everything beneath that index is inert.
 *
 * `1 modal, 2 co-active, 3 co-active` → 0 (all three).  `1 modal, 2 co-active, 3 modal` → 2.
 */
export function activeStart(modals: readonly boolean[]): number {
  for (let i = modals.length - 1; i >= 0; i--) if (modals[i]) return i;
  return 0;
}

function mark(el: HTMLElement) {
  el.setAttribute("inert", "");
  el.setAttribute("aria-hidden", "true");
}

function unmark(el: HTMLElement) {
  el.removeAttribute("inert");
  el.removeAttribute("aria-hidden");
}

/**
 * The overlay-agnostic core of a stack of overlays (#41). Call in the setup of a wrapper
 * (CuiSlideoverStack); overlays beneath it join through `useOverlayStackContext()`.
 *
 * It owns what is common to every kind of stacked panel and nothing visual: the open order,
 * the z-order, which panel draws the one shared backdrop, `inert` and `aria-hidden` on the
 * panels beneath the active set, and routing Escape and backdrop clicks. The Escape stack
 * (`useLayerStack`) and the reference-counted scroll lock stay where they are: the overlays
 * still register with both, so the page locks once and unlocks when the last one closes.
 */
export function useOverlayStackProvider(options: { modal?: () => boolean } = {}): OverlayStackContext {
  const entries = shallowReactive<OverlayStackEntry[]>([]);

  const start = () => activeStart(entries.map((e) => e.modal()));
  const topEntry = () => entries[entries.length - 1];

  function register(entry: OverlayStackEntry) {
    if (entries.includes(entry)) return;
    // An overlay with no edge of its own (a drawer sheet) joins without taking a side.
    const side = entry.side();
    const first = entries.find((e) => e.side())?.side();
    if (__DEV__ && process.env.NODE_ENV !== "production" && side && first && first !== side) {
      warnOnce(
        "[clean-ui] CuiSlideoverStack: panels on different sides (" +
          first + " and " + side +
          "). A stack is same-side in v1: depth, z-order, the shared backdrop and inert still apply, " +
          "but the attach and peek layout only arranges panels on the first panel's side.",
      );
    }
    entries.push(entry);
  }

  function unregister(entry: OverlayStackEntry) {
    const i = entries.indexOf(entry);
    if (i !== -1) entries.splice(i, 1);
  }

  const depth = (entry: OverlayStackEntry) => entries.indexOf(entry);
  const isActive = (entry: OverlayStackEntry) => {
    const i = depth(entry);
    return i === -1 || i >= start();
  };

  const context: OverlayStackContext = {
    entries,
    defaultModal: () => options.modal?.() ?? true,
    register,
    unregister,
    depth,
    isActive,
    zIndex(entry) {
      const step = Math.min(Math.max(depth(entry), 0), MAX_Z_STEP);
      return step ? `calc(var(--cui-z-overlay, 9990) + ${step})` : "var(--cui-z-overlay, 9990)";
    },
    backdropEntry: () => entries[start()],
    closeTop() {
      topEntry()?.requestClose();
    },
    escape() {
      const top = topEntry();
      if (!top) return;
      // In a co-active group focus can sit in a lower active panel: that is the one the user
      // is working in, so that is the one Escape closes.
      const focused = document.activeElement;
      const from = start();
      for (let i = entries.length - 1; i >= from; i--) {
        if (focused && entries[i].panel()?.contains(focused)) {
          entries[i].requestClose();
          return;
        }
      }
      top.requestClose();
    },
  };

  // Everything beneath the active set is out of reach: no pointer, no focus, no screen reader.
  let marked = new Set<HTMLElement>();
  const stop = watchPostEffect(() => {
    const from = start();
    const next = new Set<HTMLElement>();
    entries.forEach((entry, i) => {
      const root = entry.root();
      if (root && i < from) next.add(root);
    });
    for (const el of marked) if (!next.has(el)) unmark(el);
    for (const el of next) mark(el);
    marked = next;
  });
  onScopeDispose(() => {
    stop();
    for (const el of marked) unmark(el);
    marked.clear();
  });

  provide(OverlayStackKey, context);
  return context;
}

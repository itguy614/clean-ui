import { onScopeDispose, provide, shallowReactive, watchPostEffect } from "vue";
import { __DEV__, warnOnce } from "../utils/devWarn";
import { resolveColor } from "../utils/color";
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
  // `inert` alone also removes it from the accessibility tree; `aria-hidden` on a root that
  // still holds focus (the opener) makes the browser warn.
  el.setAttribute("inert", "");
}

function unmark(el: HTMLElement) {
  el.removeAttribute("inert");
}

/**
 * The overlay-agnostic core of a stack of overlays (#41). Call in the setup of a wrapper
 * (CuiSlideoverStack); overlays beneath it join through `useOverlayStackContext()`.
 *
 * It owns what is common to every kind of stacked panel and nothing visual: the open order,
 * the z-order, which panel draws the one shared backdrop, `inert` on the
 * panels beneath the active set, and routing Escape and backdrop clicks. The Escape stack
 * (`useLayerStack`) and the reference-counted scroll lock stay where they are: the overlays
 * still register with both, so the page locks once and unlocks when the last one closes.
 */
export function useOverlayStackProvider(options: { modal?: () => boolean } = {}): OverlayStackContext {
  const entries = shallowReactive<OverlayStackEntry[]>([]);

  // A hidden panel is not on screen, so it neither makes what is beneath it inert nor is dimmed
  // itself: the active set is worked out over the shown panels, as an index into `entries`. With
  // none shown the first entry stays the backdrop's owner, so the shared backdrop does not dip.
  const start = () => {
    const shown = entries.map((_, i) => i).filter((i) => !entries[i].hidden?.());
    return shown.length ? shown[activeStart(shown.map((i) => entries[i].modal()))] : 0;
  };
  // Escape and a backdrop click reach the topmost panel on screen: a hidden one cannot be closed
  // from where the user is looking. With none shown, the last one stands.
  const topEntry = () => entries.filter((e) => !e.hidden?.()).pop() ?? entries[entries.length - 1];

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

  const context: OverlayStackContext = {
    entries,
    defaultModal: () => options.modal?.() ?? true,
    register,
    unregister,
    zIndex(entry) {
      const step = Math.min(Math.max(depth(entry), 0), MAX_Z_STEP);
      return step ? `calc(var(--cui-z-overlay, 9990) + ${step})` : "var(--cui-z-overlay, 9990)";
    },
    backdropEntry: () => entries[start()],
    bottomEntry: () => entries[0],
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
  // It is also dimmed, as the one backdrop would dim it, by the panel's own scrim: the backdrop
  // stays behind the bottom panel and never changes layer, and the scrim fades in or out when a
  // panel becomes covered or uncovered, so the dimming is a ramp, not a step.
  let marked = new Set<HTMLElement>();
  let covered = new Set<HTMLElement>();
  const uncover = (el: HTMLElement) => {
    el.removeAttribute("data-cui-covered");
    el.style.removeProperty("--_stack-dim");
    el.style.removeProperty("--_stack-scrim");
  };
  watchPostEffect(() => {
    const from = start();
    const look = entries[from]?.backdrop?.() ?? {};
    const next = new Set<HTMLElement>();
    const nextCovered = new Set<HTMLElement>();
    entries.forEach((entry, i) => {
      const root = entry.root();
      const panel = entry.panel();
      if (root && i < from) next.add(root);
      if (panel && i < from && !entry.hidden?.()) nextCovered.add(panel);
    });
    for (const el of marked) if (!next.has(el)) unmark(el);
    for (const el of next) mark(el);
    for (const el of covered) if (!nextCovered.has(el)) uncover(el);
    for (const el of nextCovered) {
      el.setAttribute("data-cui-covered", "");
      el.style.setProperty("--_stack-dim", String(look.opacity ?? 0.5));
      el.style.setProperty("--_stack-scrim", resolveColor(String(look.color ?? "black")));
    }
    marked = next;
    covered = nextCovered;
  });
  onScopeDispose(() => {
    for (const el of marked) unmark(el);
    for (const el of covered) uncover(el);
  });

  provide(OverlayStackKey, context);
  return context;
}

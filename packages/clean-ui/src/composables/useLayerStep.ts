import { inject, onScopeDispose, provide, ref, watch, type Ref } from "vue";
import { giveBackStep, inChildLayer, LayerHostKey, takeLayerStep, type LayerToken } from "../utils/overlayLayer";

/**
 * The z-index step of a panel anchored to a trigger (#541): taken when it opens, so it is above
 * its own overlay and everything opened before it, and given back once its exit has finished
 * (`present` turning false). `dismiss` is its own close: an overlay that opens over it calls it.
 * Returns the step as a ref; see `overlayZIndex` for the CSS. Call in setup. A panel that nests
 * others (a popover holding a select) hands over its element with `el` when it is a nested panel
 * itself, and asks `hosts(target)` whether a press landed in a panel it opened.
 */
export function useLayerStep(
  open: () => boolean,
  present: Ref<boolean>,
  dismiss?: () => void,
  el?: () => Element | null | undefined,
): Ref<number> & { hosts: (target: Node) => boolean } {
  const step = ref(0);
  let held: LayerToken | undefined;
  // What is declared inside this panel is its child: it stays open under an overlay that child opens.
  const host = inject(LayerHostKey, undefined);
  provide(LayerHostKey, () => held);
  const release = () => {
    if (held) giveBackStep(held);
    held = undefined;
  };
  // Sync, so the step is there before the panel renders. Re-opened mid-exit it is the newest.
  watch(
    open,
    (now) => {
      // Closed before it ever showed (opened and closed in one tick): no exit will give the step back.
      if (!now) return present.value || release();
      release();
      // Only an open panel closes: one already leaving has nothing to dismiss.
      held = takeLayerStep(dismiss && (() => open() && dismiss()), host?.(), el);
      step.value = held.step;
    },
    { flush: "sync", immediate: true },
  );
  watch(present, (now) => now || release(), { flush: "sync" });
  onScopeDispose(release);
  return Object.assign(step, { hosts: (target: Node) => inChildLayer(held, target) });
}

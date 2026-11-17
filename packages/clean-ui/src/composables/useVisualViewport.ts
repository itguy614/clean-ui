import { onScopeDispose, ref, watch } from "vue";
import { useEventListener } from "./useEventListener";

/**
 * The visual viewport, for a panel pinned to the bottom of the screen (#268). Internal.
 *
 * A soft keyboard shrinks the *visual* viewport, not the layout one, and a browser that
 * scrolls the page to reveal a focused field pushes a `position: fixed` sheet up with it.
 * Reading `visualViewport` instead gives the room that is actually left (`height`) and how
 * far the keyboard covers the bottom of the layout viewport (`inset`, 0 with none), for the
 * sheet to size and anchor itself by. Listens only while `active`, and falls back to
 * `innerHeight` and an inset of 0 where there is no `visualViewport`, or no window.
 */
export function useVisualViewport(active: () => boolean) {
  const height = ref(typeof window === "undefined" ? 0 : window.innerHeight);
  /** The layout viewport's height: what a fraction of "the viewport" is a fraction of. */
  const layout = ref(typeof window === "undefined" ? 0 : window.innerHeight);
  const inset = ref(0);

  function read() {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    layout.value = window.innerHeight;
    height.value = vv ? vv.height : window.innerHeight;
    // Below the visual viewport's bottom edge, down to the layout viewport's.
    inset.value = vv ? Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)) : 0;
  }

  useEventListener("window", "resize", read, { enabled: active });

  let target: VisualViewport | null = null;
  function detach() {
    target?.removeEventListener("resize", read);
    target?.removeEventListener("scroll", read);
    target = null;
  }
  watch(
    active,
    (on) => {
      detach();
      if (!on || typeof window === "undefined") return;
      read();
      target = window.visualViewport ?? null;
      target?.addEventListener("resize", read);
      target?.addEventListener("scroll", read);
    },
    { immediate: true },
  );
  onScopeDispose(detach);

  return { height, inset, layout };
}

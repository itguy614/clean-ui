import { onScopeDispose, readonly, ref } from "vue";
import { useEventListener } from "./useEventListener";

/**
 * One pointer drag at a time, followed on the document so it keeps tracking off the element
 * that started it (#246, #275). It follows only the pointer that pressed — a second finger or
 * a stray mouse neither moves nor ends it — and ends on that pointer's `pointerup` or
 * `pointercancel` (a touch the browser takes over for scrolling never sends a pointerup).
 * Ending removes every listener at once, and a drag still running when the component
 * unmounts is ended too. The surface being dragged should set `touch-action: none`, or a
 * touch drag pans the page instead. Only a primary press starts one: a right-click opens the
 * context menu, which can swallow the release, and a middle-click starts autoscroll.
 *
 * Internal. Call in setup; `start(e, move)` from the surface's `pointerdown`.
 */
export function usePointerDrag() {
  const active = ref(false);
  let pointerId: number | undefined;
  let onMove: ((e: PointerEvent) => void) | null = null;

  function end() {
    active.value = false;
    onMove = null;
  }

  /**
   * Follow `e`'s pointer, calling `move` for each of its moves, and end any drag already in
   * progress. Returns false, starting nothing, for a press of any but the primary button.
   */
  function start(e: PointerEvent, move: (e: PointerEvent) => void) {
    if (e.button > 0) return false;
    pointerId = e.pointerId;
    onMove = move;
    active.value = true;
    return true;
  }

  // The listeners follow `active` on Vue's next flush, a microtask, so they are in place
  // before the pointer's next event and gone before the one after its end. Until then
  // `onMove` is already null, so nothing is moved in between.
  const own = (e: PointerEvent) => e.pointerId === pointerId;
  useEventListener("document", "pointermove", (e) => { if (own(e)) onMove?.(e); }, { enabled: active });
  useEventListener("document", ["pointerup", "pointercancel"], (e) => { if (own(e)) end(); }, { enabled: active });
  onScopeDispose(end);

  return { start, end, active: readonly(active) };
}

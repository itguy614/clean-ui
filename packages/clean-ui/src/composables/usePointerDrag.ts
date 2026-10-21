import { onScopeDispose, readonly, ref } from "vue";
import { useEventListener } from "./useEventListener";

export interface PointerDragHandlers {
  /** Each move of the pointer that started the drag. */
  move: (e: PointerEvent) => void;
  /** The drag ended: its pointer was released or cancelled, `end()` was called, or the scope ended. */
  end?: () => void;
}

/**
 * One pointer drag at a time, followed on the document so it keeps tracking off the element
 * that started it (#246, #275). It follows only the pointer that pressed — a second finger or
 * a stray mouse neither moves nor ends it — and ends on that pointer's `pointerup` or
 * `pointercancel` (a touch the browser takes over for scrolling never sends a pointerup).
 * Ending removes every listener at once, and a drag still running when the component
 * unmounts is ended too. The surface being dragged should set `touch-action: none`, or a
 * touch drag pans the page instead.
 *
 * Internal. Call in setup; `start(e, handlers)` from the surface's `pointerdown`.
 */
export function usePointerDrag() {
  const active = ref(false);
  let pointerId: number | undefined;
  let handlers: PointerDragHandlers | null = null;

  function end() {
    if (!active.value) return;
    const done = handlers;
    active.value = false;
    handlers = null;
    done?.end?.();
  }

  /** Begin following `e`'s pointer, ending any drag already in progress. */
  function start(e: PointerEvent, next: PointerDragHandlers) {
    end();
    pointerId = e.pointerId;
    handlers = next;
    active.value = true;
  }

  // The listeners follow `active` on Vue's next flush, a microtask, so they are in place
  // before the pointer's next event and gone before the one after its end. Until then
  // `handlers` is already null, so nothing is moved in between.
  const own = (e: PointerEvent) => e.pointerId === pointerId;
  useEventListener("document", "pointermove", (e) => { if (own(e)) handlers?.move(e); }, { enabled: active });
  useEventListener("document", ["pointerup", "pointercancel"], (e) => { if (own(e)) end(); }, { enabled: active });
  onScopeDispose(end);

  return { start, end, active: readonly(active) };
}

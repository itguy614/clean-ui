import { warnOnce } from "../utils/devWarn";
import { getCurrentScope, onScopeDispose, toValue, watch, type MaybeRefOrGetter } from "vue";

export interface UseEventListenerOptions {
  /** Attach only while this is true — a closed panel holds no global listeners (#203). */
  enabled?: MaybeRefOrGetter<boolean>;
  capture?: boolean;
}

type Handler<M, K extends keyof M> = (e: M[K]) => void;

/**
 * Adds listeners to `window` or `document` and removes them — the same function, the same
 * capture flag — when the component unmounts, so they cannot leak (#202). With `enabled`,
 * they are attached only while that is true. Call in setup — outside a scope it adds
 * nothing, since nothing could remove it.
 *
 * The target is named, not passed: `window` doesn't exist during server rendering, and
 * evaluating it as an argument would throw before any guard in here could run.
 */
export function useEventListener<K extends keyof WindowEventMap>(
  target: "window",
  type: K | K[],
  handler: Handler<WindowEventMap, K>,
  options?: UseEventListenerOptions,
): void;
export function useEventListener<K extends keyof DocumentEventMap>(
  target: "document",
  type: K | K[],
  handler: Handler<DocumentEventMap, K>,
  options?: UseEventListenerOptions,
): void;
export function useEventListener(
  target: "window" | "document",
  type: string | string[],
  handler: (e: Event) => void,
  { enabled = true, capture = false }: UseEventListenerOptions = {},
): void {
  if (typeof window === "undefined") return;
  // Outside a component or effect scope (a store, after an await) nothing could ever
  // remove the listener, so none is added.
  if (!getCurrentScope()) {
    warnOnce(`[clean-ui] useEventListener("${target}", …) was called outside a component setup, so no listener was added.`);
    return;
  }
  const el: EventTarget = target === "window" ? window : document;
  const types = Array.isArray(type) ? type : [type];
  let attached = false;
  const set = (on: boolean) => {
    if (on === attached) return;
    attached = on;
    for (const t of types) {
      if (on) el.addEventListener(t, handler, { capture });
      else el.removeEventListener(t, handler, { capture });
    }
  };
  watch(() => toValue(enabled), set, { immediate: true });
  onScopeDispose(() => set(false));
}

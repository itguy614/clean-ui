import { onScopeDispose, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from "vue";
import { useEventListener } from "./useEventListener";

export interface UseClickOutsideOptions {
  /**
   * Listen only while this is true — pass the panel's open state, so a closed control
   * holds no document listener (#203).
   */
  enabled?: MaybeRefOrGetter<boolean>;
}

/**
 * Calls the handler when a press lands outside the target element(s).
 * Supports multiple elements (e.g., trigger + teleported menu).
 */
export function useClickOutside(
  targets: Ref<HTMLElement | null | undefined>[] | (() => (HTMLElement | null | undefined)[]),
  handler: () => void,
  options: UseClickOutsideOptions = {},
) {
  // Armed a task after `enabled` turns on, not at once: a panel opened from a mousedown
  // handler would otherwise attach its listener mid-dispatch and receive that same press
  // as it bubbles to the document — closing the instant it opened.
  const armed = ref(false);
  let armTimer: ReturnType<typeof setTimeout> | undefined;
  if (options.enabled !== undefined) {
    watch(
      () => toValue(options.enabled),
      (on) => {
        clearTimeout(armTimer);
        if (on) armTimer = setTimeout(() => (armed.value = true));
        else armed.value = false;
      },
      { immediate: true },
    );
    onScopeDispose(() => clearTimeout(armTimer));
  }
  useEventListener(
    "document",
    "mousedown",
    (e) => {
      const elements = typeof targets === "function" ? targets() : targets.map((t) => t.value);
      if (!elements.some((el) => el?.contains(e.target as Node))) handler();
    },
    { enabled: options.enabled === undefined ? true : armed },
  );
}

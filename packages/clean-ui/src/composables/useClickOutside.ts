import { type MaybeRefOrGetter, type Ref } from "vue";
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
  useEventListener(
    "document",
    "mousedown",
    (e) => {
      const elements = typeof targets === "function" ? targets() : targets.map((t) => t.value);
      if (!elements.some((el) => el?.contains(e.target as Node))) handler();
    },
    options,
  );
}

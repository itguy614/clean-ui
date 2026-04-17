import { onMounted, onUnmounted, type Ref } from "vue";

/**
 * Calls the handler when a click occurs outside the target element(s).
 * Supports multiple elements (e.g., trigger + teleported menu).
 */
export function useClickOutside(
  targets: Ref<HTMLElement | null>[] | (() => (HTMLElement | null)[]),
  handler: () => void,
) {
  function onMouseDown(e: MouseEvent) {
    const elements = typeof targets === "function" ? targets() : targets.map((t) => t.value);
    const clickedInside = elements.some((el) => el?.contains(e.target as Node));
    if (!clickedInside) handler();
  }

  onMounted(() => {
    document.addEventListener("mousedown", onMouseDown);
  });

  onUnmounted(() => {
    document.removeEventListener("mousedown", onMouseDown);
  });
}

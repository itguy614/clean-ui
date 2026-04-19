import { ref } from "vue";

/**
 * Tracks scroll position and exposes booleans for whether content
 * overflows in each direction. Use with shadow overlay elements.
 */
export function useScrollShadows() {
  const canScrollUp = ref(false);
  const canScrollDown = ref(false);
  const canScrollLeft = ref(false);
  const canScrollRight = ref(false);

  function update(el: HTMLElement) {
    const threshold = 4;
    canScrollUp.value = el.scrollTop > threshold;
    canScrollDown.value = el.scrollHeight - el.scrollTop - el.clientHeight > threshold;
    canScrollLeft.value = el.scrollLeft > threshold;
    canScrollRight.value = el.scrollWidth - el.scrollLeft - el.clientWidth > threshold;
  }

  function onScroll(e: Event) {
    update(e.target as HTMLElement);
  }

  function onMount(el: unknown) {
    if (!el) return;
    requestAnimationFrame(() => update(el as HTMLElement));
  }

  return {
    canScrollUp,
    canScrollDown,
    canScrollLeft,
    canScrollRight,
    onScroll,
    onMount,
    update,
  };
}

// Use a semantic shadow color that works in both light and dark mode
// --cui-scroll-shadow resolves to black in light mode, white in dark mode
const shadowColor = "var(--cui-scroll-shadow, rgba(0,0,0,0.08))";
const edgeColor = "var(--cui-border)";

/** Inline style for a top edge shadow */
export const scrollShadowTopStyle = {
  position: "absolute" as const,
  top: "0",
  left: "0",
  right: "0",
  height: "20px",
  pointerEvents: "none" as const,
  zIndex: "5",
  borderTop: `1px solid ${edgeColor}`,
  background: `linear-gradient(to bottom, ${shadowColor}, transparent)`,
};

/** Inline style for a bottom edge shadow */
export const scrollShadowBottomStyle = {
  position: "absolute" as const,
  bottom: "0",
  left: "0",
  right: "0",
  height: "20px",
  pointerEvents: "none" as const,
  zIndex: "5",
  borderBottom: `1px solid ${edgeColor}`,
  background: `linear-gradient(to top, ${shadowColor}, transparent)`,
};

/** Inline style for a right edge shadow */
export const scrollShadowRightStyle = {
  position: "absolute" as const,
  right: "0",
  top: "0",
  bottom: "0",
  width: "20px",
  pointerEvents: "none" as const,
  zIndex: "20",
  borderRight: `1px solid ${edgeColor}`,
  background: `linear-gradient(to left, ${shadowColor}, transparent)`,
};

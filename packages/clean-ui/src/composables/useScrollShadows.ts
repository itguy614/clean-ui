import { ref } from "vue";

/**
 * Tracks scroll position and exposes booleans for whether content
 * overflows in each direction. Use with fade overlay elements.
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

// Fade-to-background gradient — text dissolves into the surface color.
// Works in both light and dark mode via --cui-surface-base.
const fadeTo = "var(--cui-surface-base, white)";

/** Inline style for a top edge fade */
export const scrollShadowTopStyle = {
  position: "absolute" as const,
  top: "0",
  left: "0",
  right: "0",
  height: "36px",
  pointerEvents: "none" as const,
  zIndex: "5",
  background: `linear-gradient(to bottom, ${fadeTo}, transparent)`,
};

/** Inline style for a bottom edge fade */
export const scrollShadowBottomStyle = {
  position: "absolute" as const,
  bottom: "0",
  left: "0",
  right: "0",
  height: "36px",
  pointerEvents: "none" as const,
  zIndex: "5",
  background: `linear-gradient(to top, ${fadeTo}, transparent)`,
};

/** Inline style for a right edge fade */
export const scrollShadowRightStyle = {
  position: "absolute" as const,
  right: "0",
  top: "0",
  bottom: "0",
  width: "36px",
  pointerEvents: "none" as const,
  zIndex: "20",
  background: `linear-gradient(to left, ${fadeTo}, transparent)`,
};

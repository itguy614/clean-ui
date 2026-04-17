<script setup lang="ts">
import { computed } from "vue";
import { useBreakpoint } from "../composables/useBreakpoint";
import { resolveResponsive, spacingToCss, CONTAINER_WIDTHS } from "../utils/responsive";
import type { ResponsiveValue, TailwindSpacing } from "../types/grid";

export type ContainerSize = "sm" | "md" | "lg" | "xl" | "2xl" | "full";

export interface CuiContainerProps {
  /** Max-width size (sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px, full: 100%) */
  maxWidth?: ResponsiveValue<ContainerSize>;
  /** Horizontal padding (Tailwind spacing scale) */
  px?: ResponsiveValue<TailwindSpacing>;
  /** Vertical padding (Tailwind spacing scale) */
  py?: ResponsiveValue<TailwindSpacing>;
  /** Center the container */
  centered?: boolean;
}

const props = withDefaults(defineProps<CuiContainerProps>(), {
  maxWidth: "2xl",
  px: "4",
  centered: true,
});

const { breakpoint } = useBreakpoint();

const containerStyle = computed(() => {
  const bp = breakpoint.value;
  const mw = resolveResponsive(props.maxWidth, "2xl" as ContainerSize, bp);
  const px = resolveResponsive(props.px, "4" as TailwindSpacing, bp);
  const py = resolveResponsive(props.py, undefined, bp);

  const style: Record<string, string> = {
    width: "100%",
    maxWidth: CONTAINER_WIDTHS[mw] ?? "1536px",
    paddingLeft: spacingToCss(px),
    paddingRight: spacingToCss(px),
  };

  if (props.centered) {
    style.marginLeft = "auto";
    style.marginRight = "auto";
  }

  if (py) {
    style.paddingTop = spacingToCss(py);
    style.paddingBottom = spacingToCss(py);
  }

  return style;
});
</script>

<template>
  <div class="cui-container" :style="containerStyle">
    <slot />
  </div>
</template>

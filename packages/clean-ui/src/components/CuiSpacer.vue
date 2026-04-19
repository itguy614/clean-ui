<script setup lang="ts">
import { computed } from "vue";
import { useBreakpoint } from "../composables/useBreakpoint";
import { resolveResponsive, spacingToCss } from "../utils/responsive";
import type { ResponsiveValue, TailwindSpacing } from "../types/grid";

export interface CuiSpacerProps {
  /** Fixed size (Tailwind spacing scale). If not provided, uses flex-grow to fill available space */
  size?: ResponsiveValue<TailwindSpacing>;
  /** Direction: horizontal (width) or vertical (height) */
  direction?: "horizontal" | "vertical";
  /** Hide the component */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiSpacerProps>(), {
  direction: "horizontal",
  hidden: false,
});

const { breakpoint } = useBreakpoint();

const spacerStyle = computed(() => {
  const bp = breakpoint.value;
  const size = resolveResponsive(props.size, undefined, bp);
  const style: Record<string, string> = {};

  if (size) {
    const cssSize = spacingToCss(size);
    if (props.direction === "horizontal") {
      style.width = cssSize;
    } else {
      style.height = cssSize;
    }
  } else {
    style.flexGrow = "1";
    if (props.direction === "horizontal") {
      style.width = "0";
    } else {
      style.height = "0";
    }
  }

  return style;
});
</script>

<template>
  <div v-show="!hidden" class="cui-spacer" :style="spacerStyle" aria-hidden="true" />
</template>

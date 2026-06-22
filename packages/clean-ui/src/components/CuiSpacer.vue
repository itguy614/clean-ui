<script setup lang="ts">
import { computed } from "vue";
import { useBreakpoint } from "../composables/useBreakpoint";
import { resolveResponsive, spacingToCss } from "../utils/responsive";
import type { ResponsiveValue, TailwindSpacing } from "../types/grid";
import type { CuiOrientation, HideableProps } from "../types/common";

export interface CuiSpacerProps extends HideableProps {
  /** Fixed size (Tailwind spacing scale). If not provided, uses flex-grow to fill available space */
  size?: ResponsiveValue<TailwindSpacing>;
  /** Orientation: horizontal (width) or vertical (height) */
  orientation?: CuiOrientation;
}

const props = withDefaults(defineProps<CuiSpacerProps>(), {
  orientation: "horizontal",
  hidden: false,
});

const { breakpoint } = useBreakpoint();

const spacerStyle = computed(() => {
  const bp = breakpoint.value;
  const size = resolveResponsive(props.size, undefined, bp);
  const style: Record<string, string> = {};

  if (size) {
    const cssSize = spacingToCss(size);
    if (props.orientation === "horizontal") {
      style.width = cssSize;
    } else {
      style.height = cssSize;
    }
  } else {
    style.flexGrow = "1";
    if (props.orientation === "horizontal") {
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

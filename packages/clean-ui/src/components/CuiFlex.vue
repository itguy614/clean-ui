<script setup lang="ts">
import { computed, watch } from "vue";
import { useFlexContext } from "../composables/useLayoutContext";
import { useBreakpoint } from "../composables/useBreakpoint";
import { resolveResponsive, spacingToCss } from "../utils/responsive";
import type {
  FlexDirection,
  FlexWrap,
  ResponsiveValue,
  TailwindSpacing,
} from "../types/grid";

export interface CuiFlexProps {
  /** Flex direction */
  direction?: ResponsiveValue<FlexDirection>;
  /** Flex wrap behavior */
  wrap?: ResponsiveValue<FlexWrap>;
  /** Gap between flex items (Tailwind spacing scale) */
  gap?: ResponsiveValue<TailwindSpacing>;
  /** Row gap (for wrapped flex containers) */
  rowGap?: ResponsiveValue<TailwindSpacing>;
  /** Column gap */
  colGap?: ResponsiveValue<TailwindSpacing>;
  /** Enable debug mode to visualize flex structure */
  debug?: boolean;
}

const DIRECTION_CSS: Record<FlexDirection, string> = {
  row: "row",
  "row-reverse": "row-reverse",
  col: "column",
  "col-reverse": "column-reverse",
};

const props = withDefaults(defineProps<CuiFlexProps>(), {
  direction: "row",
  wrap: "wrap",
  debug: false,
});

const { context } = useFlexContext();
const { breakpoint } = useBreakpoint();

watch(
  () => props.debug,
  (val) => {
    context.value.debug = val;
  },
  { immediate: true },
);

const flexStyle = computed(() => {
  const bp = breakpoint.value;
  const dir = resolveResponsive(props.direction, "row" as FlexDirection, bp);
  const wrap = resolveResponsive(props.wrap, "wrap" as FlexWrap, bp);
  const gap = resolveResponsive(props.gap, undefined, bp);
  const rGap = resolveResponsive(props.rowGap, undefined, bp);
  const cGap = resolveResponsive(props.colGap, undefined, bp);

  const style: Record<string, string> = {
    display: "flex",
    flexDirection: DIRECTION_CSS[dir] ?? "row",
    flexWrap: wrap,
  };

  if (rGap || cGap) {
    if (rGap) style.rowGap = spacingToCss(rGap);
    if (cGap) style.columnGap = spacingToCss(cGap);
  } else if (gap) {
    style.gap = spacingToCss(gap);
  }

  return style;
});
</script>

<template>
  <div class="cui-flex" :style="flexStyle">
    <slot />
    <div
      v-if="context.debug"
      class="cui-flex__debug-overlay"
      :style="{ zIndex: 9999 - context.depth }"
    >
      <div class="cui-flex__debug-label">
        Flex (depth: {{ context.depth }})
      </div>
    </div>
  </div>
</template>

<style scoped>
.cui-flex {
  position: relative;
}

.cui-flex__debug-overlay {
  pointer-events: none;
  position: absolute;
  inset: 0;
  border: 2px dashed oklch(0.6 0.2 145);
  background: oklch(0.6 0.2 145 / 5%);
}

.cui-flex__debug-label {
  position: absolute;
  left: 0;
  top: 0;
  background: oklch(0.6 0.2 145);
  color: white;
  padding: 0.125rem 0.25rem;
  font-size: 0.75rem;
  line-height: 1rem;
}

.cui-flex:has(> .cui-flex__debug-overlay) > :not(.cui-flex__debug-overlay) {
  outline: 1px dashed oklch(0.6 0.2 145 / 30%);
  outline-offset: -1px;
}
</style>

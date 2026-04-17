<script setup lang="ts">
import { computed, watch } from "vue";
import { useGridContext } from "../composables/useLayoutContext";
import { useBreakpoint } from "../composables/useBreakpoint";
import { resolveResponsive, spacingToCss } from "../utils/responsive";
import type {
  GridColumns,
  GridRows,
  ResponsiveValue,
  TailwindSpacing,
} from "../types/grid";

export interface CuiGridProps {
  /** Number of columns (1-12) or responsive object */
  cols?: ResponsiveValue<GridColumns>;
  /** Number of rows (optional) */
  rows?: ResponsiveValue<GridRows>;
  /** Gap between grid items (Tailwind spacing scale) */
  gap?: ResponsiveValue<TailwindSpacing>;
  /** Row gap (overrides gap for rows) */
  rowGap?: ResponsiveValue<TailwindSpacing>;
  /** Column gap (overrides gap for columns) */
  colGap?: ResponsiveValue<TailwindSpacing>;
  /** Enable debug mode to visualize grid structure */
  debug?: boolean;
}

const props = withDefaults(defineProps<CuiGridProps>(), {
  cols: 1,
  debug: false,
});

const { context } = useGridContext();
const { breakpoint } = useBreakpoint();

watch(
  () => props.debug,
  (val) => {
    context.value.debug = val;
  },
  { immediate: true },
);

const gridStyle = computed(() => {
  const bp = breakpoint.value;
  const cols = resolveResponsive(props.cols, 1, bp);
  const gap = resolveResponsive(props.gap, undefined, bp);
  const rGap = resolveResponsive(props.rowGap, undefined, bp);
  const cGap = resolveResponsive(props.colGap, undefined, bp);
  const rows = resolveResponsive(props.rows, undefined, bp);

  const style: Record<string, string> = {
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
  };

  if (rows) {
    style.gridTemplateRows = `repeat(${rows}, minmax(0, 1fr))`;
  }

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
  <div class="cui-grid" :style="gridStyle">
    <slot />
    <div
      v-if="context.debug"
      class="cui-grid__debug-overlay"
      :style="{ zIndex: 9999 - context.depth }"
    >
      <div class="cui-grid__debug-label">
        Grid (depth: {{ context.depth }})
      </div>
    </div>
  </div>
</template>

<style scoped>
.cui-grid {
  position: relative;
}

.cui-grid__debug-overlay {
  pointer-events: none;
  position: absolute;
  inset: 0;
  border: 2px dashed oklch(0.55 0.18 250);
  background: oklch(0.55 0.18 250 / 5%);
}

.cui-grid__debug-label {
  position: absolute;
  left: 0;
  top: 0;
  background: oklch(0.55 0.18 250);
  color: white;
  padding: 0.125rem 0.25rem;
  font-size: 0.75rem;
  line-height: 1rem;
}

.cui-grid:has(> .cui-grid__debug-overlay) > :not(.cui-grid__debug-overlay) {
  outline: 1px dashed oklch(0.55 0.18 250 / 30%);
  outline-offset: -1px;
}
</style>

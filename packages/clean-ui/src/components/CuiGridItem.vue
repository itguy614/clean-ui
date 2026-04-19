<script setup lang="ts">
import { computed } from "vue";
import { useBreakpoint } from "../composables/useBreakpoint";
import { resolveResponsive } from "../utils/responsive";
import type { GridSpan, ResponsiveValue } from "../types/grid";

export interface CuiGridItemProps {
  /** Number of columns to span */
  colSpan?: ResponsiveValue<GridSpan>;
  /** Number of rows to span */
  rowSpan?: ResponsiveValue<GridSpan>;
  /** Hide the component */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiGridItemProps>(), {
  hidden: false,
});
const { breakpoint } = useBreakpoint();

const itemStyle = computed(() => {
  const bp = breakpoint.value;
  const style: Record<string, string> = {};

  const col = resolveResponsive(props.colSpan, undefined, bp);
  if (col !== undefined) {
    style.gridColumn = col === "full" ? "1 / -1" : `span ${col} / span ${col}`;
  }

  const row = resolveResponsive(props.rowSpan, undefined, bp);
  if (row !== undefined) {
    style.gridRow = row === "full" ? "1 / -1" : `span ${row} / span ${row}`;
  }

  return style;
});
</script>

<template>
  <div v-show="!hidden" class="cui-grid-item" :style="itemStyle">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, provide, ref } from "vue";
import { TableContextKey } from "./table-context";
import type { SizeableProps, HideableProps } from "../types/common";
import { clampSize } from "../utils/sizing";
import { useScrollShadows, scrollShadowBottomStyle, scrollShadowRightStyle } from "../composables/useScrollShadows";

export interface CuiTableProps extends HideableProps, SizeableProps {
  /** Alternating row backgrounds */
  striped?: boolean;
  /** Row hover highlight */
  hoverable?: boolean;
  /** Borders between all cells */
  bordered?: boolean;
  /** Sticky thead */
  stickyHeader?: boolean;
  /** table-layout: fixed for consistent column widths */
  fixedLayout?: boolean;
  /** Max height — enables vertical scrolling (e.g., "400px") */
  maxHeight?: string;
  /** Min width — forces horizontal scrolling when content overflows (e.g., "1200px") */
  minWidth?: string;
  /**
   * Total row count for windowed/virtualized tables. Sets `aria-rowcount` on the
   * `<table>` so assistive tech reports the real total even when only a subset of
   * rows is in the DOM. Omit for non-virtualized tables (native semantics suffice).
   */
  ariaRowcount?: number;
}

const props = withDefaults(defineProps<CuiTableProps>(), {
  size: "md",
  striped: false,
  hoverable: false,
  bordered: false,
  stickyHeader: false,
  fixedLayout: false,
  hidden: false,
});

const SUPPORTED_SIZES = ["sm", "md", "lg"] as const;
const clampedSize = computed(() => clampSize(props.size, SUPPORTED_SIZES));

provide(TableContextKey, {
  size: clampedSize,
  stickyHeader: computed(() => props.stickyHeader),
});

const tableClasses = computed(() => [
  "cui-table",
  `cui-table--${clampedSize.value}`,
  {
    "cui-table--striped": props.striped,
    "cui-table--hoverable": props.hoverable,
    "cui-table--bordered": props.bordered,
    "cui-table--sticky-header": props.stickyHeader,
    "cui-table--fixed": props.fixedLayout,
  },
]);

const wrapperStyle = computed(() => {
  if (!props.maxHeight && !props.minWidth) return undefined;
  const s: Record<string, string> = { overflow: "auto", position: "relative" };
  if (props.maxHeight) s.maxHeight = props.maxHeight;
  return s;
});

const tableStyle = computed(() => ({
  borderCollapse: "separate" as const,
  borderSpacing: "0",
  minWidth: props.minWidth || undefined,
}));

const { canScrollRight, canScrollDown, onScroll, onMount: onWrapperRef } = useScrollShadows();

const scrollWrapper = ref<HTMLElement | null>(null);

function setWrapperRef(el: any) {
  scrollWrapper.value = el as HTMLElement | null;
  onWrapperRef(el as HTMLElement | null);
}

defineExpose({ scrollWrapper });

</script>

<template>
  <!-- Scroll wrapper when maxHeight or minWidth is set -->
  <div v-if="maxHeight || minWidth" v-show="!hidden" style="position: relative;">
    <div
      :ref="setWrapperRef"
      class="cui-table-wrapper"
      :style="wrapperStyle"
      @scroll="onScroll"
    >
      <table :class="tableClasses" :style="tableStyle" :aria-rowcount="ariaRowcount">
        <slot />
      </table>
    </div>

    <div v-if="canScrollRight" :style="scrollShadowRightStyle" />
    <div v-if="canScrollDown" :style="scrollShadowBottomStyle" />
  </div>

  <!-- Bare table -->
  <table v-else v-show="!hidden" :class="tableClasses" style="border-collapse: separate; border-spacing: 0;" :aria-rowcount="ariaRowcount">
    <slot />
  </table>
</template>

<style>
/* Unscoped — BEM prefix `.cui-table` provides isolation */

.cui-table-wrapper {
  position: relative;
}

.cui-table {
  width: 100%;
  border-collapse: separate !important;
  border-spacing: 0;
  font-size: 0.875rem;
  color: var(--cui-text-body);
}

.cui-table--fixed {
  table-layout: fixed;
}

/* --- Size: sm --- */
.cui-table--sm {
  font-size: 0.8125rem;
}

.cui-table--sm th,
.cui-table--sm td {
  padding: calc(0.375rem * var(--cui-density-scale, 1)) calc(0.5rem * var(--cui-density-scale, 1));
}

/* --- Size: md (default) --- */
.cui-table--md th,
.cui-table--md td {
  padding: calc(0.625rem * var(--cui-density-scale, 1)) calc(0.75rem * var(--cui-density-scale, 1));
}

/* --- Size: lg --- */
.cui-table--lg {
  font-size: 0.9375rem;
}

.cui-table--lg th,
.cui-table--lg td {
  padding: calc(0.75rem * var(--cui-density-scale, 1)) calc(1rem * var(--cui-density-scale, 1));
}

/* --- Head row styling --- */
.cui-table thead th {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--cui-text-secondary);
  background: var(--color-surface-50);
  border-bottom: 1px solid var(--cui-border);
  text-align: left;
}

:where(.dark, .dark *) .cui-table thead th {
  background: var(--color-surface-800);
}

/* --- Body row dividers (on cells, not rows, for border-separate compat) --- */
.cui-table tbody td {
  border-bottom: 1px solid var(--cui-border);
}

.cui-table tbody tr:last-child td {
  border-bottom: none;
}

/* --- Striped --- */
.cui-table--striped tbody tr:nth-child(even) {
  background: var(--color-surface-50);
}

:where(.dark, .dark *) .cui-table--striped tbody tr:nth-child(even) {
  background: color-mix(in srgb, var(--color-surface-800) 50%, transparent);
}

/* --- Hoverable --- */
.cui-table--hoverable tbody tr:hover {
  background: var(--color-surface-100);
}

:where(.dark, .dark *) .cui-table--hoverable tbody tr:hover {
  background: color-mix(in srgb, var(--color-surface-700) 50%, transparent);
}

/* --- Bordered --- */
.cui-table--bordered {
  border: 1px solid var(--cui-border);
}

.cui-table--bordered th,
.cui-table--bordered td {
  border: 1px solid var(--cui-border);
}

/* --- Sticky header (CSS fallback) --- */
.cui-table--sticky-header thead th {
  position: sticky !important;
  top: 0 !important;
  /* z-index intentionally NOT !important: a cell that is BOTH a sticky header
     and a sticky column (the top-left "corner") needs to layer above its
     neighbours, which it does by setting a higher z-index inline. */
  z-index: 10;
  background: var(--color-surface-50) !important;
}

:where(.dark, .dark *) .cui-table--sticky-header thead th {
  background: var(--color-surface-800) !important;
}

/* --- Selected row --- */
.cui-table tr.cui-table-row--selected {
  background: var(--cui-primary-bg) !important;
}

/* --- Foot --- */
.cui-table tfoot td,
.cui-table tfoot th {
  font-weight: 600;
  border-top: 2px solid var(--cui-border);
  color: var(--cui-text-body);
}
</style>

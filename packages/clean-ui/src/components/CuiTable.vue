<script setup lang="ts">
import { computed, provide, toRef } from "vue";
import { TableContextKey, type TableSize } from "./table-context";
import { useScrollShadows, scrollShadowBottomStyle, scrollShadowRightStyle } from "../composables/useScrollShadows";

export interface CuiTableProps {
  /** Cell padding scale */
  size?: TableSize;
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
  /** Hide the component */
  hidden?: boolean;
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

provide(TableContextKey, {
  size: toRef(props, "size"),
  stickyHeader: toRef(props, "stickyHeader"),
});

const tableClasses = computed(() => [
  "cui-table",
  `cui-table--${props.size}`,
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

</script>

<template>
  <!-- Scroll wrapper when maxHeight or minWidth is set -->
  <div v-if="maxHeight || minWidth" v-show="!hidden" style="position: relative;">
    <div
      :ref="onWrapperRef"
      class="cui-table-wrapper"
      :style="wrapperStyle"
      @scroll="onScroll"
    >
      <table :class="tableClasses" :style="tableStyle">
        <slot />
      </table>
    </div>

    <div v-if="canScrollRight" :style="scrollShadowRightStyle" />
    <div v-if="canScrollDown" :style="scrollShadowBottomStyle" />
  </div>

  <!-- Bare table -->
  <table v-else v-show="!hidden" :class="tableClasses" style="border-collapse: separate; border-spacing: 0;">
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
  padding: 0.375rem 0.5rem;
}

/* --- Size: md (default) --- */
.cui-table--md th,
.cui-table--md td {
  padding: 0.625rem 0.75rem;
}

/* --- Size: lg --- */
.cui-table--lg {
  font-size: 0.9375rem;
}

.cui-table--lg th,
.cui-table--lg td {
  padding: 0.75rem 1rem;
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
  z-index: 10 !important;
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

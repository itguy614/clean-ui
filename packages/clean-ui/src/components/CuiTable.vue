<script setup lang="ts">
import { computed, provide, ref, watch, onMounted, onBeforeUnmount } from "vue";
import { TableContextKey } from "./table-context";
import type { SizeableProps, HideableProps } from "../types/common";
import { clampSize } from "../utils/sizing";
import { useScrollShadows, scrollShadowBottomStyle, scrollShadowRightStyle } from "../composables/useScrollShadows";
import { useMessages } from "../composables/useMessages";
import { warnOnce } from "../utils/devWarn";

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

const tableStyle = computed(() => ({
  borderCollapse: "separate" as const,
  borderSpacing: "0",
  minWidth: props.minWidth || undefined,
}));

const { canScrollRight, canScrollDown, onScroll: onShadowScroll, update } = useScrollShadows();

const scrollWrapper = ref<HTMLElement | null>(null);
const tableEl = ref<HTMLElement | null>(null);

// --- Overflow containment ---
// The wrapper is always rendered, but it only becomes a scroll container when it
// has to. `overflow-x: auto` forces overflow-y to compute to `auto` as well, which
// would re-parent a sticky <thead> to this wrapper's scrollport — as tall as the
// content, so the header would never actually stick during page scroll. Staying
// `visible` while the table fits keeps that case behaving natively.
const isOverflowingX = ref(false);

const scrollable = computed(() => !!props.maxHeight || isOverflowingX.value);

const wrapperStyle = computed(() => {
  const s: Record<string, string> = { position: "relative" };
  if (props.maxHeight) {
    s.overflow = "auto";
    s.maxHeight = props.maxHeight;
  } else if (isOverflowingX.value) {
    s.overflowX = "auto";
  }
  return s;
});

function measure() {
  const wrap = scrollWrapper.value;
  const table = tableEl.value;
  if (!wrap || !table) return;

  // Measured off the table, not the wrapper: an `overflow: visible` wrapper
  // doesn't reliably report overflowing content in its own scrollWidth.
  isOverflowingX.value = Math.max(table.scrollWidth, table.offsetWidth) - wrap.clientWidth > 1;
  update(wrap);

  if (isOverflowingX.value && props.stickyHeader && !props.maxHeight) {
    warnOnce(
      "[clean-ui] CuiTable: stickyHeader with a horizontally overflowing table needs " +
        "maxHeight. The scroll container required to contain the overflow also becomes " +
        "the sticky header's scrollport, so the header can't stick to the viewport.",
    );
  }
}

let resizeObserver: ResizeObserver | undefined;

onMounted(() => {
  requestAnimationFrame(measure);
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(measure);
    // Both: the wrapper for viewport changes, the table for content changes
    if (scrollWrapper.value) resizeObserver.observe(scrollWrapper.value);
    if (tableEl.value) resizeObserver.observe(tableEl.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = undefined;
});

watch(() => [props.minWidth, props.maxHeight, props.fixedLayout], measure, { flush: "post" });

const messages = useMessages();

defineExpose({ scrollWrapper, measure });

</script>

<template>
  <!-- The wrapper always renders; it only becomes a scroll container when the
       table overflows (or maxHeight is set). See `wrapperStyle` above. -->
  <div v-show="!hidden" style="position: relative;">
    <div
      ref="scrollWrapper"
      class="cui-table-wrapper"
      :style="wrapperStyle"
      :role="scrollable ? 'region' : undefined"
      :tabindex="scrollable ? 0 : undefined"
      :aria-label="scrollable ? messages.table.scrollRegionLabel : undefined"
      @scroll="onShadowScroll"
    >
      <table ref="tableEl" :class="tableClasses" :style="tableStyle" :aria-rowcount="ariaRowcount">
        <slot />
      </table>
    </div>

    <div v-if="scrollable && canScrollRight" :style="scrollShadowRightStyle" />
    <div v-if="scrollable && canScrollDown" :style="scrollShadowBottomStyle" />
  </div>
</template>

<style>
/* Unscoped — BEM prefix `.cui-table` provides isolation */

.cui-table-wrapper {
  position: relative;
}

/* The wrapper is a tab stop only while it scrolls (WCAG 2.1.1 — scrollable
   regions must be keyboard-reachable), so give it a visible focus ring. */
.cui-table-wrapper:focus-visible {
  outline: 2px solid var(--cui-primary-focus-ring);
  outline-offset: 2px;
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
  background: var(--cui-table-head-bg, var(--color-surface-50));
  border-bottom: 1px solid var(--cui-border);
  text-align: left;
}

:where(.dark, .dark *) .cui-table thead th {
  background: var(--cui-table-head-bg, var(--color-surface-800));
}

/* A cell can still opt out of header semantics with an explicit `header={false}`
   inside a <thead>, so keep the divider on td head cells too. */
.cui-table thead td {
  border-bottom: 1px solid var(--cui-border);
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
  /* Token, not a raw scale step: CuiDataGrid pins its own header cells inline
     with the same token, and this !important would otherwise clobber a
     consumer's --cui-table-head-bg override on every sticky grid. */
  background: var(--cui-table-head-bg, var(--color-surface-50)) !important;
}

:where(.dark, .dark *) .cui-table--sticky-header thead th {
  background: var(--cui-table-head-bg, var(--color-surface-800)) !important;
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

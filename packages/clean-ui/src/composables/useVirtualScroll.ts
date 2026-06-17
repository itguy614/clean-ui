/**
 * useVirtualScroll
 *
 * Zero-dependency row virtualizer for CuiDataGridTable.
 *
 * Strategy: fixed row height (either measured from the first rendered row or
 * supplied via `rowHeight`). On scroll we compute the visible window and return
 * only the rows that fall inside it, plus top/bottom padding spacers so the
 * scrollbar thumb size and position stay accurate.
 *
 * Why fixed-height?  Variable-height virtualizers require a ResizeObserver per
 * row and a position cache — a lot of complexity for a data-grid where rows are
 * almost always uniform.  We measure one row and use that value for the whole
 * list, which covers 99% of real-world use.
 *
 * Usage:
 *   const vScroll = useVirtualScroll(rows, { containerRef, rowHeight: 40 })
 *   // bind :ref="vScroll.containerRef" on the scroll element
 *   // render vScroll.paddingTop spacer, then vScroll.visibleRows, then vScroll.paddingBottom spacer
 */

import { ref, computed, watch, onBeforeUnmount, type Ref } from "vue";

export interface UseVirtualScrollOptions {
  /** Estimated row height in px (auto-measured if omitted) */
  rowHeight?: number;
  /** Number of extra rows to render above and below the viewport */
  overscan?: number;
  /** The element that scrolls — usually the maxHeight wrapper div */
  containerRef: Ref<HTMLElement | null>;
}

export interface VirtualScrollResult<T> {
  /** Slice of rows currently in the render window */
  visibleRows: Ref<T[]>;
  /** Index of the first rendered row within the full dataset (for aria-rowindex) */
  firstVisibleIndex: Ref<number>;
  /** px to pad above visible rows (replaces the skipped top rows) */
  paddingTop: Ref<number>;
  /** px to pad below visible rows (replaces the skipped bottom rows) */
  paddingBottom: Ref<number>;
  /** Call once after the first row is mounted to auto-measure row height */
  measureRow: (el: HTMLElement | null) => void;
  /** Measured (or provided) row height — exposed for debugging */
  resolvedRowHeight: Ref<number>;
}

const DEFAULT_ROW_HEIGHT = 41;   // sensible fallback (md size row ≈ 41px)
const DEFAULT_OVERSCAN   = 5;    // rows above + below viewport

export function useVirtualScroll<T>(
  rows: Ref<T[]>,
  options: UseVirtualScrollOptions,
): VirtualScrollResult<T> {
  const { containerRef, rowHeight, overscan = DEFAULT_OVERSCAN } = options;

  // --- State ---
  const scrollTop         = ref(0);
  const viewportHeight    = ref(0);
  const resolvedRowHeight = ref(rowHeight ?? DEFAULT_ROW_HEIGHT);
  let   measured          = !!rowHeight; // skip measurement if caller provided it

  // --- Derived window ---
  const firstVisibleIndex = computed(() => {
    const rh = resolvedRowHeight.value;
    if (rh <= 0) return 0;
    return Math.max(0, Math.floor(scrollTop.value / rh) - overscan);
  });

  const lastVisibleIndex = computed(() => {
    const rh = resolvedRowHeight.value;
    if (rh <= 0) return rows.value.length - 1;
    const visible = Math.ceil(viewportHeight.value / rh);
    return Math.min(
      rows.value.length - 1,
      Math.floor(scrollTop.value / rh) + visible + overscan,
    );
  });

  const visibleRows = computed<T[]>(() =>
    rows.value.slice(firstVisibleIndex.value, lastVisibleIndex.value + 1),
  );

  const paddingTop = computed(() =>
    firstVisibleIndex.value * resolvedRowHeight.value,
  );

  const paddingBottom = computed(() => {
    const skippedBottom = rows.value.length - 1 - lastVisibleIndex.value;
    return Math.max(0, skippedBottom * resolvedRowHeight.value);
  });

  // --- Scroll & resize handlers ---
  let rafId: number | null = null;

  function handleScroll() {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      const el = containerRef.value;
      if (!el) return;
      scrollTop.value = el.scrollTop;
    });
  }

  function updateViewportHeight() {
    const el = containerRef.value;
    if (!el) return;
    viewportHeight.value = el.clientHeight;
  }

  // ResizeObserver keeps viewportHeight accurate if the container is resized
  let ro: ResizeObserver | null = null;

  function attachListeners(el: HTMLElement) {
    el.addEventListener("scroll", handleScroll, { passive: true });
    updateViewportHeight();
    ro = new ResizeObserver(updateViewportHeight);
    ro.observe(el);
  }

  function detachListeners(el: HTMLElement) {
    el.removeEventListener("scroll", handleScroll);
    ro?.disconnect();
    ro = null;
  }

  // Watch the containerRef — it may be set after mount (e.g. v-if), swapped,
  // or torn down. This single source of truth attaches/detaches listeners;
  // `immediate` covers the already-present case without a separate onMounted
  // (which would double-attach and leak a ResizeObserver).
  watch(
    containerRef,
    (el, prev) => {
      if (prev) detachListeners(prev);
      if (el)  attachListeners(el);
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    if (containerRef.value) detachListeners(containerRef.value);
  });

  // --- Row measurement ---
  // Called via :ref on the first <tr> rendered by the table body.
  // We only measure once; after that the value is stable.
  function measureRow(el: HTMLElement | null) {
    if (!el || measured) return;
    const h = el.getBoundingClientRect().height;
    if (h > 0) {
      resolvedRowHeight.value = h;
      measured = true;
    }
  }

  return {
    visibleRows,
    firstVisibleIndex,
    paddingTop,
    paddingBottom,
    measureRow,
    resolvedRowHeight,
  };
}

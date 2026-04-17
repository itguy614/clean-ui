<script setup lang="ts">
import { computed } from "vue";
import CuiIcon from "./CuiIcon.vue";
import CuiSelect from "./CuiSelect.vue";
import type { ButtonColor } from "./CuiButton.vue";

export interface LaravelPaginatorMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export type PaginationSize = "sm" | "md";

export interface CuiPaginationProps {
  /** Laravel paginator meta object */
  meta?: LaravelPaginatorMeta;
  /** Current page (override or standalone) */
  currentPage?: number;
  /** Total pages (override or standalone) */
  totalPages?: number;
  /** Items per page (override or standalone) */
  perPage?: number;
  /** Total item count (override or standalone) */
  total?: number;
  /** Options for per-page selector */
  perPageOptions?: number[];
  /** Hide the per-page selector */
  hidePerPage?: boolean;
  /** Hide the "Showing X to Y of Z" info text */
  hideInfo?: boolean;
  /** Color role for active page */
  color?: ButtonColor;
  /** Size */
  size?: PaginationSize;
  /** Max page buttons to show before truncating */
  maxButtons?: number;
}

const props = withDefaults(defineProps<CuiPaginationProps>(), {
  perPageOptions: () => [10, 15, 25, 50, 100],
  hidePerPage: false,
  hideInfo: false,
  color: "primary",
  size: "md",
  maxButtons: 5,
});

const emit = defineEmits<{
  "update:currentPage": [value: number];
  "update:perPage": [value: number];
}>();

// Resolve values from meta or individual props
const page = computed(() => props.currentPage ?? props.meta?.current_page ?? 1);
const pages = computed(() => props.totalPages ?? props.meta?.last_page ?? 1);
const itemsPerPage = computed(() => props.perPage ?? props.meta?.per_page ?? 15);
const totalItems = computed(() => props.total ?? props.meta?.total ?? 0);

const from = computed(() => {
  if (props.meta?.from != null) return props.meta.from;
  if (totalItems.value === 0) return 0;
  return (page.value - 1) * itemsPerPage.value + 1;
});

const to = computed(() => {
  if (props.meta?.to != null) return props.meta.to;
  return Math.min(page.value * itemsPerPage.value, totalItems.value);
});

const isFirst = computed(() => page.value <= 1);
const isLast = computed(() => page.value >= pages.value);

// Generate page numbers with ellipsis
const pageNumbers = computed(() => {
  const total = pages.value;
  const current = page.value;
  const max = props.maxButtons;

  if (total <= max + 2) {
    // Show all pages
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const items: (number | "ellipsis")[] = [];
  const half = Math.floor(max / 2);

  let start = Math.max(2, current - half);
  let end = Math.min(total - 1, current + half);

  // Adjust if near the beginning
  if (current <= half + 1) {
    end = max;
  }

  // Adjust if near the end
  if (current >= total - half) {
    start = total - max + 1;
  }

  // Always show first page
  items.push(1);

  // Ellipsis after first
  if (start > 2) {
    items.push("ellipsis");
  }

  // Middle pages
  for (let i = start; i <= end; i++) {
    items.push(i);
  }

  // Ellipsis before last
  if (end < total - 1) {
    items.push("ellipsis");
  }

  // Always show last page
  if (total > 1) {
    items.push(total);
  }

  return items;
});

function goTo(p: number) {
  if (p < 1 || p > pages.value || p === page.value) return;
  emit("update:currentPage", p);
}

function onPerPageChange(val: string | number | null | Array<string | number>) {
  if (val != null && !Array.isArray(val)) {
    emit("update:perPage", Number(val));
    // Reset to page 1 when changing per-page
    emit("update:currentPage", 1);
  }
}

// Per-page select options
const perPageSelectOptions = computed(() =>
  props.perPageOptions.map((n) => ({ value: n, label: `${n} / page` })),
);
</script>

<template>
  <div
    class="cui-pagination"
    :class="`cui-pagination--${size}`"
  >
    <!-- Info text -->
    <div v-if="!hideInfo && totalItems > 0" class="cui-pagination__info">
      Showing {{ from }} to {{ to }} of {{ totalItems }} results
    </div>

    <div class="cui-pagination__controls">
      <!-- Per-page selector -->
      <div v-if="!hidePerPage" class="cui-pagination__per-page">
        <CuiSelect
          :model-value="itemsPerPage"
          :options="perPageSelectOptions"
          :size="size === 'sm' ? 'xs' : 'sm'"
          @update:model-value="onPerPageChange"
        />
      </div>

      <!-- Page buttons -->
      <nav class="cui-pagination__nav" aria-label="Pagination">
        <!-- Previous -->
        <button
          class="cui-pagination__btn cui-pagination__btn--nav"
          :class="{ 'cui-pagination__btn--disabled': isFirst }"
          :disabled="isFirst"
          aria-label="Previous page"
          @click="goTo(page - 1)"
        >
          <CuiIcon name="caret-left" :size="size === 'sm' ? '0.75rem' : '1rem'" />
        </button>

        <!-- Page numbers -->
        <template v-for="(p, idx) in pageNumbers" :key="idx">
          <span v-if="p === 'ellipsis'" class="cui-pagination__ellipsis">...</span>
          <button
            v-else
            class="cui-pagination__btn"
            :class="{
              'cui-pagination__btn--active': p === page,
            }"
            :style="p === page ? {
              background: `var(--cui-${color}-bg)`,
              color: `var(--cui-${color})`,
              borderColor: `var(--cui-${color}-border)`,
              fontWeight: '600',
            } : {}"
            :aria-label="`Page ${p}`"
            :aria-current="p === page ? 'page' : undefined"
            @click="goTo(p)"
          >
            {{ p }}
          </button>
        </template>

        <!-- Next -->
        <button
          class="cui-pagination__btn cui-pagination__btn--nav"
          :class="{ 'cui-pagination__btn--disabled': isLast }"
          :disabled="isLast"
          aria-label="Next page"
          @click="goTo(page + 1)"
        >
          <CuiIcon name="caret-right" :size="size === 'sm' ? '0.75rem' : '1rem'" />
        </button>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.cui-pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.cui-pagination__info {
  font-size: 0.8125rem;
  color: var(--cui-text-secondary);
  white-space: nowrap;
}

.cui-pagination--sm .cui-pagination__info {
  font-size: 0.75rem;
}

.cui-pagination__controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.cui-pagination__per-page {
  flex-shrink: 0;
}

/* --- Nav --- */
.cui-pagination__nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* --- Page buttons --- */
.cui-pagination__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  height: 2rem;
  padding: 0 0.5rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--cui-text-body);
  background: transparent;
  border: 1px solid var(--cui-border);
  border-radius: var(--cui-button-radius, 0.375rem);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  user-select: none;
}

.cui-pagination--sm .cui-pagination__btn {
  min-width: 1.625rem;
  height: 1.625rem;
  padding: 0 0.375rem;
  font-size: 0.75rem;
}

.cui-pagination__btn:hover:not(:disabled):not(.cui-pagination__btn--active) {
  background: var(--color-surface-100);
  border-color: var(--color-surface-300);
}

:where(.dark, .dark *) .cui-pagination__btn:hover:not(:disabled):not(.cui-pagination__btn--active) {
  background: var(--color-surface-800);
  border-color: var(--color-surface-600);
}

.cui-pagination__btn:focus-visible {
  outline: 2px solid var(--cui-primary-focus-ring);
  outline-offset: 1px;
}

.cui-pagination__btn--active {
  border-color: transparent;
  cursor: default;
}

.cui-pagination__btn--nav {
  border: none;
  background: none;
  color: var(--cui-text-secondary);
}

.cui-pagination__btn--nav:hover:not(:disabled) {
  color: var(--cui-text-body);
  background: var(--color-surface-100);
}

:where(.dark, .dark *) .cui-pagination__btn--nav:hover:not(:disabled) {
  background: var(--color-surface-800);
}

.cui-pagination__btn--disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* --- Ellipsis --- */
.cui-pagination__ellipsis {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 2rem;
  font-size: 0.8125rem;
  color: var(--cui-text-tertiary);
  user-select: none;
}

.cui-pagination--sm .cui-pagination__ellipsis {
  min-width: 1.25rem;
  height: 1.625rem;
  font-size: 0.75rem;
}
</style>

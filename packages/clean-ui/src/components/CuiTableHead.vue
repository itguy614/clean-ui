<script setup lang="ts">
import { computed, provide, inject } from "vue";
import { TableContextKey, TableSectionContextKey } from "./table-context";
import type { HideableProps } from "../types/common";

export interface CuiTableHeadProps extends HideableProps {
}

withDefaults(defineProps<CuiTableHeadProps>(), {
  hidden: false,
});

provide(TableSectionContextKey, { isHead: true });

const table = inject(TableContextKey, undefined);

const headStyle = computed(() => {
  if (!table?.stickyHeader.value) return undefined;
  return {
    position: "sticky" as const,
    top: "0",
    zIndex: 2,
    background: "var(--cui-table-head-bg, var(--color-surface-50))",
  };
});
</script>

<template>
  <thead v-show="!hidden" :style="headStyle">
    <slot />
  </thead>
</template>

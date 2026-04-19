<script setup lang="ts">
import { computed, provide, inject } from "vue";
import { TableContextKey, TableSectionContextKey } from "./table-context";

export interface CuiTableHeadProps {
  /** Hide the component */
  hidden?: boolean;
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
    zIndex: 10,
    background: "var(--cui-table-head-bg, var(--color-surface-50))",
  };
});
</script>

<template>
  <thead v-show="!hidden" :style="headStyle">
    <slot />
  </thead>
</template>

<script setup lang="ts">
import { provide } from "vue";
import { TableSectionContextKey } from "./table-context";

export interface CuiTableFootProps {
  /** Hide the component */
  hidden?: boolean;
}

withDefaults(defineProps<CuiTableFootProps>(), {
  hidden: false,
});

provide(TableSectionContextKey, { isHead: false });
</script>

<template>
  <tfoot v-show="!hidden">
    <slot />
  </tfoot>
</template>

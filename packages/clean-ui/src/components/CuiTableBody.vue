<script setup lang="ts">
import { provide } from "vue";
import { TableSectionContextKey } from "./table-context";

export interface CuiTableBodyProps {
  /** Hide the component */
  hidden?: boolean;
}

withDefaults(defineProps<CuiTableBodyProps>(), {
  hidden: false,
});

provide(TableSectionContextKey, { isHead: false });
</script>

<template>
  <tbody v-show="!hidden">
    <slot />
  </tbody>
</template>

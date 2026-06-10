<script setup lang="ts">
import { provide } from "vue";
import { TableSectionContextKey } from "./table-context";
import type { HideableProps } from "../types/common";

export interface CuiTableFootProps extends HideableProps {
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

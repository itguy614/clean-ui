<script setup lang="ts">
import { provide } from "vue";
import { TableSectionContextKey } from "./table-context";
import type { HideableProps } from "../types/common";

export interface CuiTableBodyProps extends HideableProps {}

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

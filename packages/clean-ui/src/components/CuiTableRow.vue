<script setup lang="ts">
import { ref } from "vue";
import type { HideableProps } from "../types/common";

export interface CuiTableRowProps extends HideableProps {
  /** Highlight row with primary-bg tint */
  selected?: boolean;
}

withDefaults(defineProps<CuiTableRowProps>(), {
  selected: false,
  hidden: false,
});

const rowEl = ref<HTMLElement | null>(null);

defineExpose({ rowEl });
</script>

<template>
  <tr ref="rowEl" v-show="!hidden" :class="{ 'cui-table-row--selected': selected }">
    <slot />
  </tr>
</template>

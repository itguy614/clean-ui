<script setup lang="ts">
import type { HideableProps } from "../types/common";

export interface CuiTableRowProps extends HideableProps {
  /** Highlight row with primary-bg tint */
  selected?: boolean;
}

withDefaults(defineProps<CuiTableRowProps>(), {
  selected: false,
  hidden: false,
});
</script>

<template>
  <tr v-show="!hidden" :class="{ 'cui-table-row--selected': selected }">
    <slot />
  </tr>
</template>

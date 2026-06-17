<script setup lang="ts">
import { ref } from "vue";

export interface CuiTableRowProps {
  /** Highlight row with primary-bg tint */
  selected?: boolean;
  /** Hide the component */
  hidden?: boolean;
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

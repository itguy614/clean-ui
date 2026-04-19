<script setup lang="ts">
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
</script>

<template>
  <tr v-show="!hidden" :class="{ 'cui-table-row--selected': selected }">
    <slot />
  </tr>
</template>

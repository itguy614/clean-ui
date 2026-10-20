<script setup lang="ts">
/**
 * A status row inside CuiListboxPanel (#212): loading, no results, a hint. Internal — not
 * exported, not registered. Presentational, since a listbox holds only options; the
 * component's live region is what announces the state.
 */
</script>

<template>
  <div role="presentation" class="cui-listbox-status"><slot /></div>
</template>

<style scoped>
/* --- Themeable: zero specificity, so a consumer's own rule wins (see CuiButton.vue) --- */
:where(.cui-listbox-status) {
  padding: calc(0.75rem * var(--cui-density-scale, 1));
  font-size: 0.8125rem;
  color: var(--cui-text-tertiary);
}

/* --- Structural --- */
.cui-listbox-status {
  text-align: center;
}
</style>

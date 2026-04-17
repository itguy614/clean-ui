<script setup lang="ts">
export interface CuiModalBodyProps {
  /** Remove default padding */
  noPadding?: boolean;
}

withDefaults(defineProps<CuiModalBodyProps>(), {
  noPadding: false,
});
</script>

<template>
  <div class="cui-modal-body" :class="{ 'cui-modal-body--no-padding': noPadding }">
    <slot />
  </div>
</template>

<style scoped>
.cui-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
}

.cui-modal-body--no-padding {
  padding: 0;
}
</style>

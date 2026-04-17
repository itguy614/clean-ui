<script setup lang="ts">
export interface CuiCardBodyProps {
  /** Remove default padding */
  noPadding?: boolean;
}

withDefaults(defineProps<CuiCardBodyProps>(), {
  noPadding: false,
});
</script>

<template>
  <div class="cui-card-body" :class="{ 'cui-card-body--no-padding': noPadding }">
    <slot />
  </div>
</template>

<style scoped>
.cui-card-body {
  padding: 0.875rem 1rem;
}

.cui-card-body--no-padding {
  padding: 0;
}
</style>

<script setup lang="ts">
export interface CuiModalFooterProps {
  /** Align footer content */
  align?: "left" | "right" | "center" | "between";
}

withDefaults(defineProps<CuiModalFooterProps>(), {
  align: "right",
});
</script>

<template>
  <div class="cui-modal-footer" :class="`cui-modal-footer--${align}`">
    <slot />
  </div>
</template>

<style scoped>
.cui-modal-footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.25rem;
  border-top: 1px solid var(--cui-border);
  flex-shrink: 0;
}

.cui-modal-footer--left {
  justify-content: flex-start;
}

.cui-modal-footer--right {
  justify-content: flex-end;
}

.cui-modal-footer--center {
  justify-content: center;
}

.cui-modal-footer--between {
  justify-content: space-between;
}
</style>

<script setup lang="ts">
export interface CuiCardFooterProps {
  /** Align footer content */
  align?: "left" | "right" | "center" | "between";
}

withDefaults(defineProps<CuiCardFooterProps>(), {
  align: "right",
});
</script>

<template>
  <div class="cui-card-footer" :class="`cui-card-footer--${align}`">
    <slot />
  </div>
</template>

<style scoped>
.cui-card-footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border-top: 1px solid var(--cui-border);
}

.cui-card-footer--left {
  justify-content: flex-start;
}

.cui-card-footer--right {
  justify-content: flex-end;
}

.cui-card-footer--center {
  justify-content: center;
}

.cui-card-footer--between {
  justify-content: space-between;
}
</style>

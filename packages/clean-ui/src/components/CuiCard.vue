<script setup lang="ts">
export type CardVariant = "default" | "outline" | "ghost";

export interface CuiCardProps {
  /** Visual style */
  variant?: CardVariant;
}

withDefaults(defineProps<CuiCardProps>(), {
  variant: "default",
});
</script>

<template>
  <div
    class="cui-card"
    :class="`cui-card--${variant}`"
  >
    <slot />
  </div>
</template>

<style scoped>
.cui-card {
  border-radius: var(--cui-button-radius, 0.375rem);
  overflow: hidden;
  background: var(--cui-surface-base);
}

/* Default: border + shadow */
.cui-card--default {
  border: 1px solid var(--cui-border);
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.06);
}

:where(.dark, .dark *) .cui-card--default {
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.2);
}

/* Outline: border only */
.cui-card--outline {
  border: 1px solid var(--cui-border);
}

/* Ghost: no border, no shadow */
.cui-card--ghost {
  border: none;
  background: transparent;
}
</style>

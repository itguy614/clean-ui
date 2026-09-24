<script setup lang="ts">
import type { HideableProps, TitleAsProps } from "../types/common";

export interface CuiCardHeaderProps extends HideableProps, TitleAsProps {
  /** Convenience: title text */
  title?: string;
  /** Convenience: subtitle text */
  subtitle?: string;
}

withDefaults(defineProps<CuiCardHeaderProps>(), {
  hidden: false,
  titleAs: "h3",
});
</script>

<template>
  <div class="cui-card-header" v-show="!hidden">
    <div class="cui-card-header__content">
      <slot>
        <component :is="titleAs" v-if="title" class="cui-card-header__title">{{ title }}</component>
        <div v-if="subtitle" class="cui-card-header__subtitle">{{ subtitle }}</div>
      </slot>
    </div>
    <div v-if="$slots.actions" class="cui-card-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
/* The inner elements had no classes at all, so there was nothing for a consumer to select
   even after the root gained one — every override had to be threaded through a wrapper
   class plus `!important` (#115). */
:where(.cui-card-header) {
  padding: var(
    --cui-card-header-padding,
    calc(1rem * var(--cui-density-scale, 1)) calc(1.125rem * var(--cui-density-scale, 1))
      calc(0.375rem * var(--cui-density-scale, 1))
  );
  gap: var(--cui-card-header-gap, calc(0.75rem * var(--cui-density-scale, 1)));
}

:where(.cui-card-header__title) {
  font-size: var(--cui-card-title-font-size, 1.0625rem);
  color: var(--cui-card-title-color, var(--cui-text-emphasis));
  font-weight: var(--cui-card-title-font-weight, 600);
  line-height: 1.4;
}

:where(.cui-card-header__subtitle) {
  font-size: var(--cui-card-subtitle-font-size, 0.8125rem);
  color: var(--cui-card-subtitle-color, var(--cui-text-secondary));
  margin-top: calc(0.125rem * var(--cui-density-scale, 1));
}

:where(.cui-card-header__actions) {
  gap: var(--cui-card-header-actions-gap, calc(0.5rem * var(--cui-density-scale, 1)));
}

/* Structural */
.cui-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.cui-card-header__content {
  flex: 1;
  min-width: 0;
}

.cui-card-header__actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
</style>

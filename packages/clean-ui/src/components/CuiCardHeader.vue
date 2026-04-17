<script setup lang="ts">
export interface CuiCardHeaderProps {
  /** Convenience: title text */
  title?: string;
  /** Convenience: subtitle text */
  subtitle?: string;
}

defineProps<CuiCardHeaderProps>();
</script>

<template>
  <div class="cui-card-header">
    <div class="cui-card-header__content">
      <slot>
        <div v-if="title" class="cui-card-header__title">{{ title }}</div>
        <div v-if="subtitle" class="cui-card-header__subtitle">{{ subtitle }}</div>
      </slot>
    </div>
    <div v-if="$slots.actions" class="cui-card-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.cui-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--cui-border);
}

.cui-card-header__content {
  flex: 1;
  min-width: 0;
}

.cui-card-header__title {
  font-size: 1.0625rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--cui-text-emphasis);
}

.cui-card-header__subtitle {
  font-size: 0.8125rem;
  color: var(--cui-text-secondary);
  margin-top: 0.125rem;
}

.cui-card-header__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}
</style>

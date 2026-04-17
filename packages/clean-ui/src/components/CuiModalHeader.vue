<script setup lang="ts">
import CuiIcon from "./CuiIcon.vue";

export interface CuiModalHeaderProps {
  /** Convenience: title text */
  title?: string;
  /** Hide the close button */
  noCloseButton?: boolean;
}

const props = withDefaults(defineProps<CuiModalHeaderProps>(), {
  noCloseButton: false,
});

const emit = defineEmits<{
  close: [];
}>();
</script>

<template>
  <div class="cui-modal-header">
    <div class="cui-modal-header__content">
      <slot>
        <h2 v-if="title" class="cui-modal-header__title">{{ title }}</h2>
      </slot>
    </div>
    <div v-if="$slots.actions" class="cui-modal-header__actions">
      <slot name="actions" />
    </div>
    <button
      v-if="!noCloseButton"
      type="button"
      class="cui-modal-header__close"
      aria-label="Close"
      @click="emit('close')"
    >
      <CuiIcon name="x" size="1rem" />
    </button>
  </div>
</template>

<style scoped>
.cui-modal-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--cui-border);
  flex-shrink: 0;
}

.cui-modal-header__content {
  flex: 1;
  min-width: 0;
}

.cui-modal-header__title {
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--cui-text-emphasis);
  margin: 0;
}

.cui-modal-header__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.cui-modal-header__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--cui-text-secondary);
  padding: 0;
  border-radius: 0.25rem;
  transition: color 0.15s ease, background 0.15s ease;
  flex-shrink: 0;
}

.cui-modal-header__close:hover {
  color: var(--cui-text-body);
  background: var(--color-surface-100);
}

:where(.dark, .dark *) .cui-modal-header__close:hover {
  background: var(--color-surface-800);
}
</style>

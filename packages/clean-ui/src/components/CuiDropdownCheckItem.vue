<script setup lang="ts">
import { inject } from "vue";
import CuiIcon from "./CuiIcon.vue";
import { DropdownContextKey } from "./dropdown-context";

export interface CuiDropdownCheckItemProps {
  /** v-model boolean */
  modelValue?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

const props = withDefaults(defineProps<CuiDropdownCheckItemProps>(), {
  modelValue: false,
  disabled: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const ctx = inject(DropdownContextKey);

function toggle() {
  if (props.disabled) return;
  emit("update:modelValue", !props.modelValue);
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    toggle();
  }
}
</script>

<template>
  <div
    class="cui-dropdown-check-item"
    :class="{ 'cui-dropdown-check-item--disabled': disabled }"
    role="menuitemcheckbox"
    :aria-checked="modelValue"
    :aria-disabled="disabled || undefined"
    :tabindex="disabled ? -1 : 0"
    @click="toggle"
    @keydown="onKeydown"
  >
    <span class="cui-dropdown-check-item__check">
      <CuiIcon v-if="modelValue" name="check" size="0.875rem" weight="bold" />
    </span>
    <span class="cui-dropdown-check-item__label"><slot /></span>
  </div>
</template>

<style scoped>
.cui-dropdown-check-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.625rem;
  border-radius: 0.25rem;
  font-size: 0.8125rem;
  color: var(--cui-text-body);
  cursor: pointer;
  outline: none;
  transition: background 0.1s ease;
}

.cui-dropdown-check-item:hover,
.cui-dropdown-check-item:focus-visible {
  background: var(--color-surface-100);
}

:where(.dark, .dark *) .cui-dropdown-check-item:hover,
:where(.dark, .dark *) .cui-dropdown-check-item:focus-visible {
  background: var(--color-surface-800);
}

.cui-dropdown-check-item--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.cui-dropdown-check-item__check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  color: var(--cui-primary);
}

.cui-dropdown-check-item__label {
  flex: 1;
  line-height: 1.4;
}
</style>

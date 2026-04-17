<script setup lang="ts">
import { inject } from "vue";
import { DropdownContextKey } from "./dropdown-context";

export interface CuiDropdownItemProps {
  /** Keyboard shortcut hint (displayed right-aligned) */
  shortcut?: string;
  /** Description text below the label */
  description?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Close menu on select (default true) */
  closeOnSelect?: boolean;
}

const props = withDefaults(defineProps<CuiDropdownItemProps>(), {
  disabled: false,
  closeOnSelect: true,
});

const emit = defineEmits<{
  select: [];
}>();

const ctx = inject(DropdownContextKey);

function onSelect() {
  if (props.disabled) return;
  emit("select");
  if (props.closeOnSelect) ctx?.closeAll();
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    onSelect();
  }
}
</script>

<template>
  <div
    class="cui-dropdown-item"
    :class="{ 'cui-dropdown-item--disabled': disabled }"
    role="menuitem"
    :aria-disabled="disabled || undefined"
    :tabindex="disabled ? -1 : 0"
    @click="onSelect"
    @keydown="onKeydown"
  >
    <span v-if="$slots.icon" class="cui-dropdown-item__icon">
      <slot name="icon" />
    </span>
    <span class="cui-dropdown-item__body">
      <span class="cui-dropdown-item__label"><slot /></span>
      <span v-if="description" class="cui-dropdown-item__desc">{{ description }}</span>
    </span>
    <span v-if="shortcut" class="cui-dropdown-item__shortcut">{{ shortcut }}</span>
  </div>
</template>

<style scoped>
.cui-dropdown-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem 0.625rem;
  border-radius: 0.25rem;
  font-size: 0.8125rem;
  color: var(--cui-text-body);
  cursor: pointer;
  outline: none;
  transition: background 0.1s ease;
}

.cui-dropdown-item:hover,
.cui-dropdown-item:focus-visible {
  background: var(--color-surface-100);
}

:where(.dark, .dark *) .cui-dropdown-item:hover,
:where(.dark, .dark *) .cui-dropdown-item:focus-visible {
  background: var(--color-surface-800);
}

.cui-dropdown-item--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.cui-dropdown-item--disabled:hover {
  background: transparent;
}

.cui-dropdown-item__icon {
  display: flex;
  flex-shrink: 0;
  color: var(--cui-text-secondary);
  margin-top: 0.0625rem;
}

.cui-dropdown-item__body {
  flex: 1;
  min-width: 0;
}

.cui-dropdown-item__label {
  display: block;
  line-height: 1.4;
}

.cui-dropdown-item__desc {
  display: block;
  font-size: 0.75rem;
  color: var(--cui-text-secondary);
  line-height: 1.3;
  margin-top: 0.125rem;
}

.cui-dropdown-item__shortcut {
  flex-shrink: 0;
  font-size: 0.6875rem;
  color: var(--cui-text-tertiary);
  font-family: var(--cui-font-mono, monospace);
  margin-top: 0.0625rem;
}
</style>

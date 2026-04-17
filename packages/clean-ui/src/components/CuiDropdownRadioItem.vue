<script setup lang="ts">
import { inject, computed } from "vue";
import CuiIcon from "./CuiIcon.vue";
import { DropdownRadioKey } from "./dropdown-context";

export interface CuiDropdownRadioItemProps {
  /** Value for this radio item */
  value: string | number;
  /** Disabled state */
  disabled?: boolean;
}

const props = withDefaults(defineProps<CuiDropdownRadioItemProps>(), {
  disabled: false,
});

const group = inject(DropdownRadioKey);
const isSelected = computed(() => group?.modelValue.value === props.value);

function select() {
  if (props.disabled) return;
  group?.select(props.value);
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    select();
  }
}
</script>

<template>
  <div
    class="cui-dropdown-radio-item"
    :class="{ 'cui-dropdown-radio-item--disabled': disabled }"
    role="menuitemradio"
    :aria-checked="isSelected"
    :aria-disabled="disabled || undefined"
    :tabindex="disabled ? -1 : 0"
    @click="select"
    @keydown="onKeydown"
  >
    <span class="cui-dropdown-radio-item__check">
      <CuiIcon v-if="isSelected" name="circle" size="0.5rem" weight="fill" />
    </span>
    <span class="cui-dropdown-radio-item__label"><slot /></span>
  </div>
</template>

<style scoped>
.cui-dropdown-radio-item {
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

.cui-dropdown-radio-item:hover,
.cui-dropdown-radio-item:focus-visible {
  background: var(--color-surface-100);
}

:where(.dark, .dark *) .cui-dropdown-radio-item:hover,
:where(.dark, .dark *) .cui-dropdown-radio-item:focus-visible {
  background: var(--color-surface-800);
}

.cui-dropdown-radio-item--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.cui-dropdown-radio-item__check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  color: var(--cui-primary);
}

.cui-dropdown-radio-item__label {
  flex: 1;
  line-height: 1.4;
}
</style>

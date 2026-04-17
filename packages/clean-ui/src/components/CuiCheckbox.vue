<script setup lang="ts">
import { computed, inject, ref } from "vue";
import { CheckboxGroupKey, type MultiSelectGroupContext } from "./multi-select-group-context";
import CuiIcon from "./CuiIcon.vue";
import type { ButtonColor } from "./CuiButton.vue";

export interface CuiCheckboxProps {
  /** The value this checkbox represents (group mode) */
  value?: string | number;
  /** v-model binding (standalone boolean mode) */
  modelValue?: boolean;
  /** Label text (or use default slot) */
  label?: string;
  /** Description text (or use #description slot) */
  description?: string;
  /** Color role — overrides group color */
  color?: ButtonColor;
  /** Indeterminate state (visual only, e.g. "select all" partial) */
  indeterminate?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Readonly state */
  readonly?: boolean;
}

const props = withDefaults(defineProps<CuiCheckboxProps>(), {
  indeterminate: false,
  disabled: false,
  readonly: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const group = inject<MultiSelectGroupContext | null>(CheckboxGroupKey, null);

const isChecked = computed(() => {
  if (group && props.value !== undefined) {
    return group.modelValue.value.includes(props.value);
  }
  return props.modelValue === true;
});

const isDisabled = computed(() => {
  if (group?.disabled.value) return true;
  return props.disabled;
});

const isReadonly = computed(() => {
  if (group?.readonly.value) return true;
  return props.readonly;
});

const resolvedColor = computed(() => {
  return props.color ?? group?.color.value ?? "primary";
});

const elRef = ref<HTMLElement>();

function toggle() {
  if (isDisabled.value || isReadonly.value) return;
  if (group && props.value !== undefined) {
    group.toggle(props.value);
  } else {
    emit("update:modelValue", !props.modelValue);
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    toggle();
  }
}

defineExpose({ el: elRef, focus: () => elRef.value?.focus() });
</script>

<template>
  <label
    ref="elRef"
    class="cui-checkbox"
    :style="{ '--_check-focus-ring': `var(--cui-${resolvedColor}-focus-ring)` }"
    :class="{
      'cui-checkbox--checked': isChecked,
      'cui-checkbox--indeterminate': indeterminate && !isChecked,
      'cui-checkbox--disabled': isDisabled,
      'cui-checkbox--readonly': isReadonly,
    }"
    role="checkbox"
    :aria-checked="indeterminate && !isChecked ? 'mixed' : isChecked"
    :aria-disabled="isDisabled || isReadonly || undefined"
    :tabindex="isDisabled ? -1 : 0"
    @click="toggle"
    @keydown="onKeydown"
  >
    <!-- Hidden native input -->
    <input
      type="checkbox"
      :value="value !== undefined ? String(value) : undefined"
      :checked="isChecked"
      :indeterminate="indeterminate && !isChecked"
      :disabled="isDisabled"
      :readonly="isReadonly"
      tabindex="-1"
      aria-hidden="true"
      class="cui-checkbox__input"
      @click.stop.prevent
    />

    <!-- Visual indicator -->
    <span
      class="cui-checkbox__indicator"
      :style="{
        '--_check-color': `var(--cui-${resolvedColor})`,
        '--_check-border': isChecked || (indeterminate && !isChecked) ? `var(--cui-${resolvedColor})` : `var(--color-surface-400)`,
        '--_check-bg': isChecked || (indeterminate && !isChecked) ? `var(--cui-${resolvedColor}-bg)` : 'transparent',
      }"
    >
      <!-- Checkmark -->
      <CuiIcon v-if="isChecked" name="check" weight="bold" size="0.875rem" :color="`var(--cui-${resolvedColor})`" class="cui-checkbox__icon" />
      <!-- Indeterminate dash -->
      <CuiIcon v-else-if="indeterminate" name="minus" weight="bold" size="0.875rem" :color="`var(--cui-${resolvedColor})`" class="cui-checkbox__icon" />
    </span>

    <!-- Label + description -->
    <span class="cui-checkbox__label-wrap">
      <span class="cui-checkbox__label">
        <slot>{{ label }}</slot>
      </span>
      <span v-if="description || $slots.description" class="cui-checkbox__description">
        <slot name="description">{{ description }}</slot>
      </span>
    </span>
  </label>
</template>

<style scoped>
.cui-checkbox {
  display: inline-flex;
  align-items: flex-start;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
  position: relative;
}

.cui-checkbox--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cui-checkbox--readonly {
  cursor: default;
}

.cui-checkbox__input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* --- Indicator box --- */
.cui-checkbox__indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
  border-radius: 0.25rem;
  border: 2px solid var(--_check-border);
  background: var(--_check-bg);
  transition: border-color 0.15s ease, background 0.15s ease;
  margin-top: 0.125rem;
}

.cui-checkbox:hover:not(.cui-checkbox--disabled):not(.cui-checkbox--readonly) .cui-checkbox__indicator {
  border-color: var(--_check-color);
}

.cui-checkbox:focus-visible {
  outline: 2px solid var(--_check-focus-ring);
  outline-offset: 2px;
  border-radius: 0.25rem;
}

/* --- Icon --- */
.cui-checkbox__icon {
  animation: cui-check-pop 0.15s ease;
}

@keyframes cui-check-pop {
  0% { transform: scale(0); }
  60% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

/* --- Label --- */
.cui-checkbox__label-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.cui-checkbox__label {
  font-size: 1rem;
  line-height: 1.5;
  color: var(--cui-text-body);
}

.cui-checkbox__description {
  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--cui-text-secondary);
}
</style>

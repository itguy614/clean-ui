<script setup lang="ts">
import { computed } from "vue";

export type LabelPosition = "top" | "left";

export interface CuiFormFieldProps {
  /** Label text */
  label?: string;
  /** Label position */
  labelPosition?: LabelPosition;
  /** HTML for attribute — ties label to a control by id */
  for?: string;
  /** Mark field as required */
  required?: boolean;
  /** Custom required indicator text (replaces asterisk) */
  requiredText?: string;
  /** Help text below the control */
  helpText?: string;
  /** Show error state (left accent bar) */
  error?: boolean;
  /** Error message below the control (replaces help text when shown) */
  errorMessage?: string;
  /** Disabled state — passed through slot props to the control */
  disabled?: boolean;
}

const props = withDefaults(defineProps<CuiFormFieldProps>(), {
  labelPosition: "top",
  required: false,
  error: false,
  disabled: false,
});

const showError = computed(() => props.error && props.errorMessage);

// Auto-generate a stable id once (not a computed — Math.random() must not re-run on re-render)
const fieldId = props.for ?? `cui-field-${Math.random().toString(36).slice(2, 8)}`;
</script>

<template>
  <div
    class="cui-form-field"
    :class="[
      `cui-form-field--${labelPosition}`,
      { 'cui-form-field--error': error },
    ]"
  >
    <!-- Label -->
    <label
      v-if="label"
      :for="fieldId"
      class="cui-form-field__label"
    >
      <span>{{ label }}</span>
      <span v-if="required && !requiredText" class="cui-form-field__required" aria-hidden="true">*</span>
      <span v-else-if="required && requiredText" class="cui-form-field__required-text">{{ requiredText }}</span>
    </label>

    <!-- Control + footer -->
    <div class="cui-form-field__body">
      <!-- Control slot -->
      <div class="cui-form-field__control">
        <slot :id="fieldId" :error="error" :disabled="disabled" />
      </div>

      <!-- Footer: help text or error message -->
      <div v-if="showError" class="cui-form-field__error">
        {{ errorMessage }}
      </div>
      <div v-else-if="helpText" class="cui-form-field__help">
        {{ helpText }}
      </div>
    </div>
  </div>
</template>

<style scoped>
/* --- Base layout --- */
.cui-form-field {
  display: flex;
  border-left: 3px solid transparent;
  padding-left: 0.75rem;
}

.cui-form-field--top {
  flex-direction: column;
  gap: 0.375rem;
}

.cui-form-field--left {
  flex-direction: row;
  align-items: flex-start;
  gap: 1rem;
}

/* --- Error accent bar --- */
.cui-form-field--error {
  border-left-color: var(--cui-error);
}

/* --- Label --- */
.cui-form-field__label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--cui-text-body);
  line-height: 1.4;
}

.cui-form-field--left .cui-form-field__label {
  min-width: 8rem;
  padding-top: 0.5rem; /* align with input text */
  flex-shrink: 0;
}

.cui-form-field__required {
  color: var(--cui-error);
  font-weight: 600;
}

.cui-form-field__required-text {
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--cui-error);
  padding: 0.0625rem 0.375rem;
  border-radius: 0.25rem;
  background: var(--cui-error-bg);
}

/* --- Body (control + footer) --- */
.cui-form-field__body {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  flex: 1;
  min-width: 0;
}

.cui-form-field__control {
  display: flex;
  flex-direction: column;
}

/* --- Help text --- */
.cui-form-field__help {
  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--cui-text-secondary);
}

/* --- Error message --- */
.cui-form-field__error {
  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--cui-error);
}
</style>

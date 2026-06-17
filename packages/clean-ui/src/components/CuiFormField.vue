<script setup lang="ts">
import { computed, inject, onBeforeUnmount } from "vue";
import type { HideableProps, DisableableProps } from "../types/common";
import { FormContextKey } from "./form-context";

export type LabelPosition = "top" | "left";

export interface CuiFormFieldProps extends HideableProps, DisableableProps {
  /** Label text */
  label?: string;
  /** Label position */
  labelPosition?: LabelPosition;
  /** HTML for attribute — ties label to a control by id */
  for?: string;
  /**
   * Field name. When set AND nested in a `CuiForm`, the field binds its value
   * and error to the form automatically (see the scoped-slot bindings). Omit it
   * to use the field standalone with manual `error` / `errorMessage` props.
   */
  name?: string;
  /** Mark field as required */
  required?: boolean;
  /** Custom required indicator text (replaces asterisk) */
  requiredText?: string;
  /** Help text below the control */
  helpText?: string;
  /** Show error state (standalone mode; ignored when form-bound) */
  error?: boolean;
  /** Error message below the control (standalone mode; ignored when form-bound) */
  errorMessage?: string;
}

const props = withDefaults(defineProps<CuiFormFieldProps>(), {
  labelPosition: "top",
  required: false,
  error: false,
  disabled: false,
  hidden: false,
});

// Optional form context — null when used standalone (no hard dependency).
const form = inject(FormContextKey, null);
const formBound = computed(() => !!props.name && !!form);

// Resolved error/message: from the form when bound, else from props.
const resolvedError = computed(() =>
  formBound.value ? !!form!.errors.value[props.name!] : !!props.error,
);
const resolvedMessage = computed(() =>
  formBound.value ? form!.errors.value[props.name!] : props.errorMessage,
);
const showError = computed(() => resolvedError.value && resolvedMessage.value);

const isDisabled = computed(() => props.disabled || (form?.disabled.value ?? false));

// Auto-generate a stable id once (not a computed — Math.random() must not re-run on re-render)
const fieldId = props.for ?? `cui-field-${Math.random().toString(36).slice(2, 8)}`;

// Bindings handed to the default slot. `v-bind="f"` on a field component wires
// v-model + error in one shot. Standalone mode omits the model bindings.
const slotBindings = computed(() => {
  const base: Record<string, unknown> = {
    id: fieldId,
    error: resolvedError.value,
    disabled: isDisabled.value,
  };
  if (formBound.value) {
    base.modelValue = form!.getValue(props.name!);
    base["onUpdate:modelValue"] = (value: unknown) => form!.setValue(props.name!, value);
    base.readonly = form!.readonly.value;
  }
  return base;
});

// Clear this field's error from the form when it unmounts (e.g. conditionally
// shown fields) so stale errors don't linger in the aggregated map.
onBeforeUnmount(() => {
  if (props.name && form) form.unregisterField(props.name);
});
</script>

<template>
  <div
    v-show="!hidden"
    class="cui-form-field"
    :class="[
      `cui-form-field--${labelPosition}`,
      { 'cui-form-field--error': resolvedError },
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
        <slot v-bind="slotBindings" />
      </div>

      <!-- Footer: help text or error message -->
      <div v-if="showError" class="cui-form-field__error">
        {{ resolvedMessage }}
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

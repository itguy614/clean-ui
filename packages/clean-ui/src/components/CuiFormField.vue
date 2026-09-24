<script setup lang="ts">
import { useMessages } from "../composables/useMessages";
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
// Ids for the label and the help/error text, so the control can point at them.
// `for`/`id` alone is not enough: it only forms an association with *labelable*
// elements, which leaves a control like CuiSelect — whose focusable surface is a
// `div[role="combobox"]` — with no accessible name at all (#78).
const messages = useMessages();
const labelId = `${fieldId}-label`;
const descriptionId = `${fieldId}-description`;

// Bindings handed to the default slot. `v-bind="f"` on a field component wires
// v-model + error in one shot. Standalone mode omits the model bindings.
const slotBindings = computed(() => {
  const base: Record<string, unknown> = {
    id: fieldId,
    error: resolvedError.value,
    disabled: isDisabled.value,
  };
  if (props.label) base.ariaLabelledby = labelId;
  // Only when there is something to describe — a dangling aria-describedby
  // pointing at an element that isn't rendered is worse than none.
  if (showError.value || props.helpText) base.ariaDescribedby = descriptionId;
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
      :id="labelId"
      :for="fieldId"
      class="cui-form-field__label"
    >
      <span>{{ label }}</span>
      <span v-if="required && !requiredText" class="cui-form-field__required" aria-hidden="true">*</span>
      <!-- The asterisk is decorative and aria-hidden, so required-ness reached no one. The
           label is what `aria-labelledby` points at, so saying it here reaches every control,
           including the ones with no `required` prop of their own (#175). -->
      <span v-if="required && !requiredText" class="cui-form-field__required-sr">{{ messages.formField.required }}</span>
      <span v-else-if="required && requiredText" class="cui-form-field__required-text">{{ requiredText }}</span>
    </label>

    <!-- Control + footer -->
    <div class="cui-form-field__body">
      <!-- Control slot -->
      <div class="cui-form-field__control">
        <slot v-bind="slotBindings" />
      </div>

      <!-- Footer: help text or error message -->
      <div v-if="showError" class="cui-form-field__error" :id="descriptionId">
        {{ resolvedMessage }}
      </div>
      <div v-else-if="helpText" class="cui-form-field__help" :id="descriptionId">
        {{ helpText }}
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Visually hidden, still announced. Not `display: none`, which would drop it from the
   accessibility tree along with the announcement. */
.cui-form-field__required-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

/* --- Base layout --- */
.cui-form-field {
  display: flex;
}

.cui-form-field--top {
  flex-direction: column;
  gap: calc(0.375rem * var(--cui-density-scale, 1));
}

.cui-form-field--left {
  flex-direction: row;
  align-items: flex-start;
  gap: calc(1rem * var(--cui-density-scale, 1));
}

/* --- Label --- */
.cui-form-field__label {
  display: flex;
  align-items: center;
  gap: calc(0.25rem * var(--cui-density-scale, 1));
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--cui-text-body);
  line-height: 1.4;
}

.cui-form-field--left .cui-form-field__label {
  min-width: 8rem;
  padding-top: calc(0.5rem * var(--cui-density-scale, 1)); /* align with input text */
  flex-shrink: 0;
}

/* The label is a flex row, so its height is whatever its tallest child is — and that must
   not depend on whether the field happens to be required, or a required field's control
   sits lower than the optional one beside it (#134).

   `line-height: inherit` on the markers, not a height on the label: the label already
   declares `line-height: 1.4`, but inheritance loses to any rule that matches the child
   directly, and the docs' prose styles set spans to 1.5. That made the marker's line box
   21px against the label text's 19.6px, and no height on the label can cap a child that
   is taller than it. Forcing the child to take the parent's computed value is what
   actually closes it. */
.cui-form-field__required {
  color: var(--cui-error);
  font-weight: 600;
  line-height: inherit;
}

.cui-form-field__required-text {
  line-height: inherit;
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--cui-error);
  padding: calc(0.0625rem * var(--cui-density-scale, 1)) calc(0.375rem * var(--cui-density-scale, 1));
  border-radius: 0.25rem;
  background: var(--cui-error-bg);
}

/* --- Body (control + footer) --- */
.cui-form-field__body {
  display: flex;
  flex-direction: column;
  gap: calc(0.375rem * var(--cui-density-scale, 1));
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

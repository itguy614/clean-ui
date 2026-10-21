<script setup lang="ts">
import { toRef } from "vue";
import { useFieldDescribedBy } from "../composables/useFieldDescribedBy";
import { useAutoOrientation } from "../composables/useAutoOrientation";
import { CheckboxGroupKey, useMultiSelectGroupProvider, type MultiSelectGroupProps } from "./multi-select-group-context";

/** Every prop is shared with CuiToggleGroup (#206). */
export interface CuiCheckboxGroupProps extends MultiSelectGroupProps {}

const props = withDefaults(defineProps<CuiCheckboxGroupProps>(), {
  modelValue: () => [],
  color: "primary",
  orientation: "auto",
  disabled: false,
  readonly: false,
  error: false,
  hidden: false,
});

// Link our own error message into aria-describedby (#175).
const { errorId, describedBy } = useFieldDescribedBy(props);

const emit = defineEmits<{
  "update:modelValue": [value: Array<string | number>];
}>();

const resolvedDirection = useAutoOrientation(() => props.orientation);

useMultiSelectGroupProvider(
  CheckboxGroupKey,
  {
    modelValue: toRef(props, "modelValue"),
    color: toRef(props, "color"),
    disabled: toRef(props, "disabled"),
    readonly: toRef(props, "readonly"),
  },
  emit,
);
</script>

<template>
  <div
    v-show="!hidden"
    role="group"
    :id="id"
    :aria-labelledby="ariaLabelledby"
    :aria-describedby="describedBy"
    :aria-required="ariaRequired || undefined"
    :aria-label="ariaLabelledby ? undefined : label"
    :aria-invalid="error || undefined"
    class="cui-checkbox-group cui-control-group"
    :class="[
      `cui-checkbox-group--${resolvedDirection} cui-control-group--${resolvedDirection}`,
      { 'cui-checkbox-group--error cui-control-group--error': error },
    ]"
  >
    <div class="cui-checkbox-group__options cui-control-group__options">
      <slot />
    </div>
    <div v-if="error && errorMessage" :id="errorId" class="cui-checkbox-group__error cui-field-error">
      {{ errorMessage }}
    </div>
  </div>
</template>

<!-- Layout and the error container: the shared .cui-control-group rules in main.css (#206). -->

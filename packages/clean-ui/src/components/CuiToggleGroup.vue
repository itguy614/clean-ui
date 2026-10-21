<script setup lang="ts">
import { toRef } from "vue";
import { useFieldDescribedBy } from "../composables/useFieldDescribedBy";
import { useAutoOrientation } from "../composables/useAutoOrientation";
import { ToggleGroupKey, useMultiSelectGroupProvider, type MultiSelectGroupProps } from "./multi-select-group-context";

/** Every prop is shared with CuiCheckboxGroup (#206). */
export interface CuiToggleGroupProps extends MultiSelectGroupProps {}

const props = withDefaults(defineProps<CuiToggleGroupProps>(), {
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
  ToggleGroupKey,
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
    class="cui-toggle-group cui-control-group"
    :class="[
      `cui-toggle-group--${resolvedDirection} cui-control-group--${resolvedDirection}`,
      { 'cui-toggle-group--error cui-control-group--error': error },
    ]"
  >
    <div class="cui-toggle-group__options cui-control-group__options">
      <slot />
    </div>
    <div v-if="error && errorMessage" :id="errorId" class="cui-toggle-group__error cui-control-group__error cui-field-error">
      {{ errorMessage }}
    </div>
  </div>
</template>

<!-- Layout and the error container: the shared .cui-control-group rules in main.css (#206). -->

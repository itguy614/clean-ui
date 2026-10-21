<script setup lang="ts">
import { computed, provide, toRef } from "vue";
import { useCuiId } from "../composables/useCuiId";
import type { CuiAutoOrientation, HideableProps, ColorableProps, SizeableProps, DisableableProps, AriaLabelableProps } from "../types/common";
import { useFieldDescribedBy } from "../composables/useFieldDescribedBy";
import { useAutoOrientation } from "../composables/useAutoOrientation";
import CuiButtonGroup from "./CuiButtonGroup.vue";
import { RadioGroupKey, type RadioGroupVariant } from "./radio-context";

export interface CuiRadioGroupProps extends AriaLabelableProps, HideableProps, ColorableProps, SizeableProps, DisableableProps {
  /** Selected value */
  modelValue?: string | number | boolean;
  /** Shared name attribute for all radios */
  name?: string;
  /** Layout orientation — auto: horizontal for ≤2 options, vertical for 3+ */
  orientation?: CuiAutoOrientation;
  /** Visual variant — "default" for classic radios, "buttons" for button group */
  variant?: RadioGroupVariant;
  /** Make all radios readonly */
  readonly?: boolean;
  /** Show error state */
  error?: boolean;
  /** Error message displayed below the group */
  errorMessage?: string;
  /** Accessible label for the group */
  label?: string;
}

const props = withDefaults(defineProps<CuiRadioGroupProps>(), {
  color: "primary",
  orientation: "auto",
  variant: "default",
  size: "md",
  disabled: false,
  readonly: false,
  error: false,
  hidden: false,
});

// Link our own error message into aria-describedby (#175).
const { errorId, describedBy } = useFieldDescribedBy(props);

const emit = defineEmits<{
  "update:modelValue": [value: string | number | boolean];
}>();

const generatedName = useCuiId("radio");
const groupName = computed(() => props.name ?? generatedName);

// Unused by the button variant, which is a segmented row whatever the orientation.
const resolvedDirection = useAutoOrientation(() => props.orientation);

provide(RadioGroupKey, {
  modelValue: toRef(props, "modelValue"),
  name: groupName.value,
  color: toRef(props, "color"),
  disabled: toRef(props, "disabled"),
  readonly: toRef(props, "readonly"),
  variant: toRef(props, "variant"),
  size: toRef(props, "size"),
  select(value: string | number | boolean) {
    if (props.disabled || props.readonly) return;
    emit("update:modelValue", value);
  },
});

function onKeydown(e: KeyboardEvent) {
  if (props.disabled || props.readonly) return;

  const group = e.currentTarget as HTMLElement;
  const selector = props.variant === "buttons"
    ? 'button.cui-radio-button:not(:disabled)'
    : '[role="radio"]:not([aria-disabled="true"])';
  const radios = Array.from(group.querySelectorAll<HTMLElement>(selector));
  const currentIndex = radios.findIndex((el) => el === document.activeElement);

  let nextIndex = -1;

  if (e.key === "ArrowDown" || e.key === "ArrowRight") {
    e.preventDefault();
    nextIndex = currentIndex < radios.length - 1 ? currentIndex + 1 : 0;
  } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
    e.preventDefault();
    nextIndex = currentIndex > 0 ? currentIndex - 1 : radios.length - 1;
  }

  if (nextIndex >= 0) {
    radios[nextIndex].focus();
    radios[nextIndex].click();
  }
}
</script>

<template>
  <div
    v-show="!hidden"
    role="radiogroup"
    :id="id"
    :aria-labelledby="ariaLabelledby"
    :aria-describedby="describedBy"
    :aria-required="ariaRequired || undefined"
    :aria-label="ariaLabelledby ? undefined : label"
    :aria-invalid="error || undefined"
    class="cui-radio-group cui-control-group"
    :class="[
      variant !== 'buttons' ? `cui-radio-group--${resolvedDirection} cui-control-group--${resolvedDirection}` : '',
      { 'cui-radio-group--error cui-control-group--error': error },
      { 'cui-radio-group--buttons': variant === 'buttons' },
    ]"
    @keydown="onKeydown"
  >
    <div class="cui-radio-group__options cui-control-group__options">
      <!-- Button variant wraps in CuiButtonGroup for proper radius merging -->
      <CuiButtonGroup v-if="variant === 'buttons'">
        <slot />
      </CuiButtonGroup>
      <template v-else>
        <slot />
      </template>
    </div>
    <div v-if="error && errorMessage" :id="errorId" class="cui-radio-group__error cui-field-error">
      {{ errorMessage }}
    </div>
  </div>
</template>

<!-- Layout and the error container: the shared .cui-control-group rules in main.css (#206).
     Only the button variant's segmented layout is the radio group's own. -->
<style scoped>
/* Button variant: segmented control, hug content rather than stretch */
.cui-radio-group--buttons .cui-radio-group__options {
  gap: 0;
  display: inline-flex;
  flex-wrap: nowrap;
  align-self: flex-start;
}
</style>

<script setup lang="ts">
import { computed, onMounted, onUpdated, provide, toRef, useTemplateRef, watch } from "vue";
import { useCuiId } from "../composables/useCuiId";
import type { CuiAutoOrientation, HideableProps, ColorableProps, SizeableProps, DisableableProps, AriaLabelableProps } from "../types/common";
import { useFieldDescribedBy } from "../composables/useFieldDescribedBy";
import { useAutoOrientation } from "../composables/useAutoOrientation";
import { useRovingFocus } from "../composables/useRovingFocus";
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

// One tab stop (#231), the ARIA radiogroup pattern: the checked radio, else the first
// enabled one. The radios are slot content, so the stop is written onto them as an
// attribute (`manageTabindex`). Arrows wrap, and both axes move whatever the layout.
const groupRef = useTemplateRef<HTMLElement>("groupRef");
const roving = useRovingFocus({
  container: groupRef,
  itemSelector: '[role="radio"]',
  orientation: "both",
  wrap: true,
  manageTabindex: true,
});

// The stop follows the selection, however it changed.
function syncStopToChecked() {
  const radios = Array.from(groupRef.value?.querySelectorAll<HTMLElement>('[role="radio"]') ?? []);
  const checked = radios.findIndex((el) => el.getAttribute("aria-checked") === "true");
  if (checked !== -1) roving.activeIndex.value = checked;
}
onMounted(syncStopToChecked);
onUpdated(syncStopToChecked);
watch(() => props.modelValue, syncStopToChecked, { flush: "post" });

// Selection follows focus. A readonly group moves focus but selects nothing (`select`
// refuses), and a disabled one has no available radio to move to.
function onKeydown(e: KeyboardEvent) {
  const from = document.activeElement;
  roving.onKeydown(e);
  const to = document.activeElement;
  if (e.defaultPrevented && to !== from && (to as HTMLElement | null)?.getAttribute("role") === "radio") {
    (to as HTMLElement).click();
    // Clicking a label hands focus to its (hidden) input; keep it on the radio.
    (to as HTMLElement).focus();
  }
}
</script>

<template>
  <div
    v-show="!hidden"
    ref="groupRef"
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
    @focusin="roving.onFocusin"
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
    <div v-if="error && errorMessage" :id="errorId" class="cui-radio-group__error cui-control-group__error cui-field-error">
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

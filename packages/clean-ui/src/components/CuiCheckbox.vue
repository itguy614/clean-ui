<script setup lang="ts">
import { computed, ref } from "vue";
import { useChoiceLabelling } from "../composables/useChoiceLabelling";
import { CheckboxGroupKey, useOptionalMultiSelectGroupContext } from "./multi-select-group-context";
import CuiIcon from "./CuiIcon.vue";
import type { HideableProps, ColorableProps, DisableableProps, FormControlProps, NativeControlProps } from "../types/common";

export interface CuiCheckboxProps
  extends NativeControlProps,
    HideableProps,
    ColorableProps,
    DisableableProps,
    Pick<FormControlProps, "label" | "description" | "readonly"> {
  /** The value this checkbox represents (group mode) */
  value?: string | number;
  /** v-model binding (standalone boolean mode) */
  modelValue?: boolean;
  /** Indeterminate state (visual only, e.g. "select all" partial) */
  indeterminate?: boolean;
  /** Hide the component */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiCheckboxProps>(), {
  indeterminate: false,
  disabled: false,
  readonly: false,
  hidden: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const group = useOptionalMultiSelectGroupContext(CheckboxGroupKey);

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

// Named by the label, described by the description, not both as one name (#183).
const choice = useChoiceLabelling(props);
</script>

<template>
  <label
    ref="elRef"
    v-show="!hidden"
    class="cui-checkbox"
    :style="{ '--_checkbox-focus-ring': `var(--cui-${resolvedColor}-focus-ring)` }"
    :class="{
      'cui-checkbox--checked': isChecked,
      'cui-checkbox--indeterminate': indeterminate && !isChecked,
      'cui-checkbox--disabled': isDisabled,
      'cui-checkbox--readonly': isReadonly,
    }"
    :id="id"
    role="checkbox"
    :aria-describedby="choice.describedBy()"
    :aria-required="ariaRequired || undefined"
    :aria-labelledby="choice.labelledBy()"
    :aria-checked="indeterminate && !isChecked ? 'mixed' : isChecked"
    :aria-disabled="isDisabled || isReadonly || undefined"
    :tabindex="isDisabled ? -1 : 0"
    @click="toggle"
    @keydown="onKeydown"
  >
    <!-- Hidden native input -->
    <input
      :name="name"
      :autocomplete="autocomplete"
      type="checkbox"
      :value="value !== undefined ? String(value) : undefined"
      :checked="isChecked"
      :indeterminate="indeterminate && !isChecked"
      :disabled="isDisabled"
      :readonly="isReadonly"
      tabindex="-1"
      aria-hidden="true"
      class="cui-checkbox__input cui-sr-only"
      @click.stop.prevent
    />

    <!-- Visual indicator -->
    <span
      class="cui-checkbox__indicator"
      :style="{
        '--_checkbox-hover-border': `var(--cui-${resolvedColor})`,
        '--_checkbox-border': isChecked || (indeterminate && !isChecked) ? `var(--cui-${resolvedColor})` : `var(--cui-border-strong)`,
        '--_checkbox-bg': isChecked || (indeterminate && !isChecked) ? `var(--cui-${resolvedColor}-bg)` : 'transparent',
      }"
    >
      <!-- Checkmark -->
      <CuiIcon v-if="isChecked" name="check" weight="bold" size="0.875rem" :color="`var(--cui-${resolvedColor})`" class="cui-checkbox__icon" />
      <!-- Indeterminate dash -->
      <CuiIcon v-else-if="indeterminate" name="minus" weight="bold" size="0.875rem" :color="`var(--cui-${resolvedColor})`" class="cui-checkbox__icon" />
    </span>

    <!-- Label + description -->
    <span class="cui-checkbox__label-wrap">
      <span :id="choice.labelId" class="cui-checkbox__label">
        <slot>{{ label }}</slot>
      </span>
      <span v-if="choice.hasDescription()" :id="choice.descriptionId" class="cui-checkbox__description">
        <slot name="description">{{ description }}</slot>
      </span>
    </span>
  </label>
</template>

<style scoped>
.cui-checkbox {
  display: inline-flex;
  align-items: flex-start;
  gap: calc(0.5rem * var(--cui-density-scale, 1));
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

/* --- Indicator box --- */
.cui-checkbox__indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  /* Box dimensions are sized to the (unscaled) label text, so they stay fixed —
     scaling the box while the text doesn't breaks alignment with adjacent text. */
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
  border-radius: 0.25rem;
  border-width: 1px;
  border-style: solid;
  transition: border-color var(--cui-duration-fast) ease, background var(--cui-duration-fast) ease;
  margin-top: 0.125rem;
}

/* Themeable (#454): zero specificity, so a consumer's plain `.cui-checkbox__indicator { … }`
   or a `--cui-checkbox-*` token on a container wins. The indicator's border and fill are
   resolved for its state in the script (checked, indeterminate, resting). */
:where(.cui-checkbox__indicator) {
  border-color: var(--cui-checkbox-border, var(--_checkbox-border));
  background: var(--cui-checkbox-bg, var(--_checkbox-bg));
}

:where(.cui-checkbox:hover:not(.cui-checkbox--disabled):not(.cui-checkbox--readonly) .cui-checkbox__indicator) {
  border-color: var(--cui-checkbox-hover-border, var(--_checkbox-hover-border));
}

.cui-checkbox:focus-visible {
  outline-width: 2px;
  outline-style: solid;
  outline-offset: 2px;
  border-radius: 0.25rem;
}

:where(.cui-checkbox:focus-visible) {
  outline-color: var(--cui-checkbox-focus-ring, var(--_checkbox-focus-ring));
}

/* --- Icon --- */
.cui-checkbox__icon {
  animation: cui-check-pop var(--cui-duration-fast) var(--cui-ease-out);
}

/* A brief settle, not a pop from nothing with an overshoot: a checkbox is a high-frequency
   control (#266). */
@keyframes cui-check-pop {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

/* --- Label --- */
.cui-checkbox__label-wrap {
  display: flex;
  flex-direction: column;
  gap: calc(0.125rem * var(--cui-density-scale, 1));
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

<script setup lang="ts">
import { computed, inject, ref } from "vue";
import { useButtonGroupMember } from "../composables/useButtonGroup";
import { useChoiceLabelling } from "../composables/useChoiceLabelling";
import { RadioGroupKey, type RadioGroupContext } from "./radio-context";
import type { HideableProps, ColorableProps, DisableableProps, NativeControlProps } from "../types/common";
import { BUTTON_SIZE_SCALE } from "../utils/sizing";

export interface CuiRadioProps extends NativeControlProps, HideableProps, ColorableProps, DisableableProps {
  /** The value this radio represents */
  value: string | number | boolean;
  /** v-model binding (standalone mode) */
  modelValue?: string | number | boolean;
  /** Label text (or use default slot) */
  label?: string;
  /** Description text (or use #description slot) */
  description?: string;
  /** Readonly state */
  readonly?: boolean;
}

const props = withDefaults(defineProps<CuiRadioProps>(), {
  disabled: false,
  readonly: false,
  hidden: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string | number | boolean];
}>();

// Inject group context if inside a CuiRadioGroup
const group = inject<RadioGroupContext | null>(RadioGroupKey, null);

// Resolve values: group takes precedence for shared state
const isChecked = computed(() => {
  if (group) return group.modelValue.value === props.value;
  return props.modelValue === props.value;
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

const resolvedName = computed(() => {
  return group?.name ?? props.name ?? "";
});

const isButtonVariant = computed(() => group?.variant.value === "buttons");
const buttonSize = computed(() => group?.size.value ?? "md");

const buttonSizeStyles = computed(() => BUTTON_SIZE_SCALE[buttonSize.value] ?? BUTTON_SIZE_SCALE.md);

const elRef = ref<HTMLElement>();

// In a button-variant group, this segment sets its own corners from its place (#444).
const groupClasses = useButtonGroupMember(() => elRef.value);

function select() {
  if (isDisabled.value || isReadonly.value) return;
  if (group) {
    group.select(props.value);
  } else {
    emit("update:modelValue", props.value);
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    select();
  }
}

defineExpose({ el: elRef, focus: () => elRef.value?.focus() });

// Named by the label, described by the description, not both as one name (#183).
const choice = useChoiceLabelling(props);
</script>

<template>
  <!-- Button variant -->
  <button
    v-if="isButtonVariant"
    v-show="!hidden"
    ref="elRef"
    type="button"
    class="cui-radio-button cui-button"
    :class="[groupClasses, {
      'cui-radio-button--active': isChecked,
      'cui-radio-button--disabled': isDisabled,
    }]"
    :style="{
      '--_radio-color': `var(--cui-${resolvedColor})`,
      '--_radio-bg': `var(--cui-${resolvedColor}-bg)`,
      '--_radio-hover-color': `var(--cui-${resolvedColor}-text)`,
      '--_radio-hover-bg': `var(--cui-${resolvedColor}-solid, var(--cui-${resolvedColor}))`,
      '--_radio-focus-ring': `var(--cui-${resolvedColor}-focus-ring)`,
      '--_radio-height': buttonSizeStyles.height,
      '--_radio-px': buttonSizeStyles.px,
      '--_radio-font-size': buttonSizeStyles.fontSize,
    }"
    :disabled="isDisabled"
    :id="id"
    role="radio"
    :aria-describedby="ariaDescribedby"
    :aria-required="ariaRequired || undefined"
    :aria-labelledby="ariaLabelledby"
    :aria-checked="isChecked"
    @click="select"
  >
    <input
      :autocomplete="autocomplete"
      type="radio"
      :name="resolvedName"
      :value="String(value)"
      :checked="isChecked"
      :disabled="isDisabled"
      tabindex="-1"
      aria-hidden="true"
      class="cui-radio__input cui-sr-only"
      @click.stop.prevent
    />
    <slot>{{ label }}</slot>
  </button>

  <!-- Default variant -->
  <label
    v-else
    v-show="!hidden"
    ref="elRef"
    class="cui-radio"
    :style="{ '--_radio-focus-ring': `var(--cui-${resolvedColor}-focus-ring)` }"
    :class="{
      'cui-radio--checked': isChecked,
      'cui-radio--disabled': isDisabled,
      'cui-radio--readonly': isReadonly,
    }"
    :id="id"
    role="radio"
    :aria-describedby="choice.describedBy()"
    :aria-labelledby="choice.labelledBy()"
    :aria-checked="isChecked"
    :aria-disabled="isDisabled || isReadonly || undefined"
    :tabindex="isDisabled ? -1 : 0"
    @click="select"
    @keydown="onKeydown"
  >
    <!-- Hidden native input for form submission -->
    <input
      :autocomplete="autocomplete"
      type="radio"
      :name="resolvedName"
      :value="String(value)"
      :checked="isChecked"
      :disabled="isDisabled"
      :readonly="isReadonly"
      tabindex="-1"
      aria-hidden="true"
      class="cui-radio__input cui-sr-only"
      @click.stop.prevent
    />

    <!-- Visual circle indicator -->
    <span
      class="cui-radio__indicator"
      :style="{
        '--_radio-color': `var(--cui-${resolvedColor})`,
        '--_radio-border': isChecked ? `var(--cui-${resolvedColor}-border)` : `var(--cui-border-strong)`,
        '--_radio-bg': isChecked ? `var(--cui-${resolvedColor}-bg)` : 'transparent',
      }"
    >
      <span v-if="isChecked" class="cui-radio__dot" />
    </span>

    <!-- Label + description -->
    <span class="cui-radio__label-wrap">
      <span :id="choice.labelId" class="cui-radio__label">
        <slot>{{ label }}</slot>
      </span>
      <span v-if="choice.hasDescription()" :id="choice.descriptionId" class="cui-radio__description">
        <slot name="description">{{ description }}</slot>
      </span>
    </span>
  </label>

</template>

<style scoped>
.cui-radio {
  display: inline-flex;
  align-items: flex-start;
  gap: calc(0.5rem * var(--cui-density-scale, 1));
  cursor: pointer;
  user-select: none;
  position: relative;
}

.cui-radio--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cui-radio--readonly {
  cursor: default;
}

/* --- Indicator circle --- */
.cui-radio__indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  /* Sized to the (unscaled) label text — keep fixed so it stays aligned with adjacent text. */
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
  border-radius: 50%;
  border-width: 1px;
  border-style: solid;
  transition: border-color var(--cui-duration-fast) ease, background var(--cui-duration-fast) ease;
  margin-top: 0.125rem; /* align with first line of text */
}

/* Themeable (#454): zero specificity, so a consumer's plain `.cui-radio__indicator { … }` or a
   `--cui-radio-*` token on a container wins. The indicator's border and fill are resolved for
   its state (checked or resting) in the script. */
:where(.cui-radio__indicator) {
  border-color: var(--cui-radio-border, var(--_radio-border));
  background: var(--cui-radio-bg, var(--_radio-bg));
}

:where(.cui-radio:hover:not(.cui-radio--disabled):not(.cui-radio--readonly) .cui-radio__indicator) {
  border-color: var(--cui-radio-color, var(--_radio-color));
}

.cui-radio:focus-visible {
  outline-width: 2px;
  outline-style: solid;
  outline-offset: 2px;
  border-radius: 0.25rem;
}

:where(.cui-radio:focus-visible) {
  outline-color: var(--cui-radio-focus-ring, var(--_radio-focus-ring));
}

/* --- Inner dot --- */
.cui-radio__dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  animation: cui-radio-pop var(--cui-duration-fast) var(--cui-ease-out);
}

/* Zero specificity, like the rest of the paint above (#454). */
:where(.cui-radio__dot) {
  background: var(--cui-radio-color, var(--_radio-color));
}

/* A brief settle, not a pop from nothing with an overshoot: a radio is a high-frequency
   control (#266). */
@keyframes cui-radio-pop {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

/* --- Label --- */
.cui-radio__label-wrap {
  display: flex;
  flex-direction: column;
  gap: calc(0.125rem * var(--cui-density-scale, 1));
}

.cui-radio__label {
  font-size: 1rem;
  line-height: 1.5;
  color: var(--cui-text-body);
}

.cui-radio__description {
  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--cui-text-secondary);
}

/* ============================================================
   BUTTON VARIANT
   ============================================================ */

.cui-radio-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  border-width: 1px;
  border-style: solid;
  transition: background var(--cui-duration-fast) ease, color var(--cui-duration-fast) ease, border-color var(--cui-duration-fast) ease;
}

/* Zero specificity, so a group's square corners (`.cui-button--flat-*`) win over it, and so
   does a consumer's plain `.cui-radio-button { … }` or a `--cui-radio-*` token (#454). The
   state rules follow in the order they cascade: resting, hover, selected, selected and hovered. */
:where(.cui-radio-button) {
  border-radius: var(--cui-button-radius, var(--cui-radius-md, 0.375rem));
  height: var(--cui-radio-height, var(--_radio-height));
  padding-left: var(--cui-radio-px, var(--_radio-px));
  padding-right: var(--cui-radio-px, var(--_radio-px));
  font-size: var(--cui-radio-font-size, var(--_radio-font-size));
  border-color: var(--cui-border-strong);
  background: transparent;
  color: var(--cui-radio-color, var(--_radio-color));
}

:where(.cui-radio-button:hover:not(:disabled):not(.cui-radio-button--active)) {
  background: var(--cui-radio-bg, var(--_radio-bg));
  border-color: var(--cui-radio-color, var(--_radio-color));
}

:where(.cui-radio-button--active) {
  background: var(--cui-radio-bg, var(--_radio-bg));
  color: var(--cui-radio-color, var(--_radio-color));
  /* Keep the neutral border on the active segment (both light and dark) so the
     group stays visually connected — only the fill and text change. */
  border-color: var(--cui-border-strong);
}

/* The selected segment under the pointer fills solid. */
:where(.cui-radio-button--active:hover:not(:disabled)) {
  background: var(--cui-radio-hover-bg, var(--_radio-hover-bg));
  color: var(--cui-radio-hover-color, var(--_radio-hover-color));
}

.cui-radio-button:focus-visible {
  outline-width: 2px;
  outline-style: solid;
  outline-offset: 2px;
}

:where(.cui-radio-button:focus-visible) {
  outline-color: var(--cui-radio-focus-ring, var(--_radio-focus-ring));
}

.cui-radio-button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Radius merging comes from the group context, as the `.cui-button--flat-*` classes (#444). */
</style>

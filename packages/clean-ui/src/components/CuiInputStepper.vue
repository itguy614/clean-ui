<script setup lang="ts">
import { computed, useTemplateRef } from "vue";
import type { CuiColor, CuiSize, HideableProps, ColorableProps, SizeableProps, DisableableProps, NativeControlProps } from "../types/common";
import { INPUT_SIZE_SCALE, nestedSize } from "../utils/sizing";
import CuiButton from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";

export type InputStepperOrientation = "horizontal" | "vertical";

export interface CuiInputStepperProps extends NativeControlProps, HideableProps, ColorableProps, SizeableProps, DisableableProps {
  /** Current value */
  modelValue?: number;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Orientation */
  orientation?: InputStepperOrientation;
  /** Label displayed above */
  label?: string;
  /** Pad value with leading zeros to this width */
  pad?: number;
  /** Wrap around from max to min and vice versa */
  wrap?: boolean;
}

const props = withDefaults(defineProps<CuiInputStepperProps>(), {
  modelValue: 0,
  step: 1,
  size: "md",
  orientation: "horizontal",
  color: "primary",
  disabled: false,
  wrap: false,
  hidden: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: number];
}>();

const canDecrement = computed(() => props.wrap || props.min === undefined || props.modelValue - props.step >= props.min);
const canIncrement = computed(() => props.wrap || props.max === undefined || props.modelValue + props.step <= props.max);

/**
 * Arrow keys on a spinbutton, per the ARIA pattern (#74). The component had no
 * keydown handling at all, so the value could only be changed by clicking the
 * +/- buttons or retyping it — which is also why CuiTimePicker was unusable
 * from the keyboard once its panel was open.
 */
/** Round off float drift, then hold the value inside [min, max]. */
function clampValue(value: number): number {
  let next = Math.round(value * 1e10) / 1e10;
  if (props.max !== undefined) next = Math.min(next, props.max);
  if (props.min !== undefined) next = Math.max(next, props.min);
  return next;
}

function onKeydown(e: KeyboardEvent) {
  if (props.disabled) return;

  switch (e.key) {
    case "ArrowUp":
      e.preventDefault();
      increment();
      break;
    case "ArrowDown":
      e.preventDefault();
      decrement();
      break;
    case "PageUp":
    case "PageDown": {
      // A coarser jump, as a native number input gives: ten steps at a time.
      // Computed in one go rather than by calling increment() ten times — this
      // is a controlled component, so `modelValue` does not change until the
      // parent writes it back, and ten calls would all emit the same +1.
      e.preventDefault();
      const delta = props.step * 10 * (e.key === "PageUp" ? 1 : -1);
      const next = clampValue(props.modelValue + delta);
      if (next !== props.modelValue) emit("update:modelValue", next);
      break;
    }
    case "Home":
      if (props.min === undefined) return;
      e.preventDefault();
      emit("update:modelValue", props.min);
      break;
    case "End":
      if (props.max === undefined) return;
      e.preventDefault();
      emit("update:modelValue", props.max);
      break;
    default:
  }
}

function decrement() {
  if (props.disabled || !canDecrement.value) return;
  let next = Math.round((props.modelValue - props.step) * 1e10) / 1e10;
  if (props.wrap && props.min !== undefined && props.max !== undefined && next < props.min) {
    // Wrap to highest step-aligned value within range
    const range = props.max - props.min + 1;
    next = props.min + Math.floor((range - 1) / props.step) * props.step;
  } else if (props.min !== undefined) {
    next = Math.max(next, props.min);
  }
  emit("update:modelValue", next);
}

function increment() {
  if (props.disabled || !canIncrement.value) return;
  let next = Math.round((props.modelValue + props.step) * 1e10) / 1e10;
  if (props.wrap && props.min !== undefined && props.max !== undefined && next > props.max) {
    next = props.min;
  } else if (props.max !== undefined) {
    next = Math.min(next, props.max);
  }
  emit("update:modelValue", next);
}

const displayValue = computed(() => {
  if (props.pad && props.pad > 0) return String(props.modelValue).padStart(props.pad, "0");
  return String(props.modelValue);
});

const isVertical = computed(() => props.orientation === "vertical");

function onInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value;
  const num = parseFloat(raw);
  if (isNaN(num)) return;
  let clamped = num;
  if (props.min !== undefined) clamped = Math.max(clamped, props.min);
  if (props.max !== undefined) clamped = Math.min(clamped, props.max);
  emit("update:modelValue", clamped);
}


// From the shared scale, so a stepper lines up with a CuiInput or CuiSelect of the same
// size. Its private table had its own heights and fonts and only sm|md|lg (#123).
//
// `inputWidth` is the one genuinely stepper-specific metric and derives from the font
// size: the field holds a handful of digits, so it scales with the digits, not with the
// control's padding. The +/- buttons and their glyphs take `nestedSize`.
/**
 * Every value this component computes is emitted as a private `--_input-stepper-*`
 * property; the stylesheet reads each as
 * `var(--cui-input-stepper-height, var(--_input-stepper-height))`, so a public token set
 * anywhere in the ancestor chain wins and this is the default. See "Themeable Properties"
 * in CLAUDE.md (#114, #123).
 */
const cfg = computed(() => {
  const s = INPUT_SIZE_SCALE[props.size];
  return {
    buttonSize: nestedSize(props.size),
    iconSize: s.fontSize,
    style: {
      "--_input-stepper-height": s.height,
      "--_input-stepper-font-size": s.fontSize,
      // The field holds a handful of digits, so it scales with the digits rather than
      // with the control's padding.
      "--_input-stepper-field-width": `calc(${s.fontSize} * 3)`,
    },
  };
});

// Expose imperative handle
const rootEl = useTemplateRef<HTMLElement>("rootEl");
const inputH = useTemplateRef<HTMLInputElement>("inputH");
const inputV = useTemplateRef<HTMLInputElement>("inputV");

function focus(opts?: FocusOptions) {
  const input = inputH.value ?? inputV.value;
  if (input) input.focus(opts);
  else rootEl.value?.focus(opts);
}

function blur() {
  (inputH.value ?? inputV.value)?.blur();
}

defineExpose({ el: rootEl, focus, blur });
</script>

<template>
  <div
    class="cui-input-stepper"
    :class="{ 'cui-input-stepper--vertical': isVertical, 'cui-input-stepper--disabled': disabled }"
    ref="rootEl"
    v-show="!hidden"
    :style="cfg.style"
  >
    <label v-if="label" class="cui-input-stepper__label">{{ label }}</label>

    <!-- Horizontal layout -->
    <div v-if="!isVertical" class="cui-input-stepper__control">
      <CuiButton
        variant="ghost"
        :size="cfg.buttonSize"
        tabindex="-1"
        :disabled="disabled || !canDecrement"
        :color="color"
        class="cui-input-stepper__button"
        @click="decrement"
      >
        <CuiIcon name="minus" :size="cfg.iconSize" />
      </CuiButton>
      <input
        ref="inputH"
        class="cui-input-stepper__field"
        :id="id"
        :name="name"
        :autocomplete="autocomplete"
        :aria-describedby="ariaDescribedby"
        :aria-labelledby="ariaLabelledby"
        role="spinbutton"
        :aria-valuenow="modelValue"
        :aria-valuemin="min"
        :aria-valuemax="max"
        type="text"
        inputmode="numeric"
        :value="displayValue"
        :disabled="disabled"
        @keydown="onKeydown"
        @input="onInput"
      />
      <CuiButton
        variant="ghost"
        :size="cfg.buttonSize"
        tabindex="-1"
        :disabled="disabled || !canIncrement"
        :color="color"
        class="cui-input-stepper__button"
        @click="increment"
      >
        <CuiIcon name="plus" :size="cfg.iconSize" />
      </CuiButton>
    </div>

    <!-- Vertical layout -->
    <div v-else class="cui-input-stepper__control">
      <CuiButton
        variant="ghost"
        :size="cfg.buttonSize"
        tabindex="-1"
        :disabled="disabled || !canIncrement"
        :color="color"
        class="cui-input-stepper__button"
        @click="increment"
      >
        <CuiIcon name="caret-up" :size="cfg.iconSize" />
      </CuiButton>
      <input
        ref="inputV"
        class="cui-input-stepper__field"
        :id="id"
        :name="name"
        :autocomplete="autocomplete"
        :aria-describedby="ariaDescribedby"
        :aria-labelledby="ariaLabelledby"
        role="spinbutton"
        :aria-valuenow="modelValue"
        :aria-valuemin="min"
        :aria-valuemax="max"
        type="text"
        inputmode="numeric"
        :value="displayValue"
        :disabled="disabled"
        @keydown="onKeydown"
        @input="onInput"
      />
      <CuiButton
        variant="ghost"
        :size="cfg.buttonSize"
        tabindex="-1"
        :disabled="disabled || !canDecrement"
        :color="color"
        class="cui-input-stepper__button"
        @click="decrement"
      >
        <CuiIcon name="caret-down" :size="cfg.iconSize" />
      </CuiButton>
    </div>
  </div>
</template>

<style scoped>
/* --- Themeable ---
   Zero specificity, so a consumer's own rule wins without `!important`. See the note in
   CuiButton.vue. */
:where(.cui-input-stepper__control) {
  height: var(--cui-input-stepper-height, var(--_input-stepper-height));
  border: var(--cui-input-stepper-border, 1px solid var(--cui-border-strong, var(--cui-border)));
  border-radius: var(--cui-input-stepper-radius, var(--cui-button-radius, 0.375rem));
}

:where(.cui-input-stepper__field) {
  width: var(--cui-input-stepper-field-width, var(--_input-stepper-field-width));
  font-size: var(--cui-input-stepper-font-size, var(--_input-stepper-font-size));
  background: var(--cui-input-stepper-bg, var(--cui-surface-base, white));
  color: var(--cui-input-stepper-color, var(--cui-text-body));
}

:where(.cui-input-stepper__label) {
  font-size: var(--cui-input-stepper-font-size, var(--_input-stepper-font-size));
  color: var(--cui-input-stepper-label-color, var(--cui-text-secondary));
}

/* --- Structural --- */
.cui-input-stepper__label {
  display: block;
  margin-bottom: calc(0.25rem * var(--cui-density-scale, 1));
  font-weight: 500;
}

.cui-input-stepper--vertical .cui-input-stepper__label {
  text-align: center;
}

.cui-input-stepper__control {
  display: inline-flex;
  align-items: center;
  /* Clips the buttons to the control's own corners, so they need no radius of their own. */
  overflow: hidden;
}

.cui-input-stepper--vertical .cui-input-stepper__control {
  flex-direction: column;
  height: auto;
}

.cui-input-stepper--disabled .cui-input-stepper__control {
  opacity: 0.5;
}

.cui-input-stepper__field {
  height: 100%;
  text-align: center;
  border: none;
  border-left: 1px solid var(--cui-border-strong, var(--cui-border));
  border-right: 1px solid var(--cui-border-strong, var(--cui-border));
  font-weight: 600;
  outline: none;
  padding: 0;
  font-family: inherit;
}

.cui-input-stepper--vertical .cui-input-stepper__field {
  height: auto;
  border: none;
  border-top: 1px solid var(--cui-border-strong, var(--cui-border));
  border-bottom: 1px solid var(--cui-border-strong, var(--cui-border));
  padding: calc(0.25rem * var(--cui-density-scale, 1)) 0;
}

/* The buttons sit inside the control's own border, so they carry neither their own border
   nor a radius; the control clips them to its corners. Plain rules rather than inline
   styles because CuiButton's themeable rules are zero-specificity since #114 — a
   `:deep()` rule from here wins. */
.cui-input-stepper__control :deep(.cui-button) {
  border: none;
  height: 100%;
  border-radius: 0;
}

.cui-input-stepper--vertical .cui-input-stepper__control :deep(.cui-button) {
  width: 100%;
  min-width: var(--cui-input-stepper-field-width, var(--_input-stepper-field-width));
}
</style>

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
const cfg = computed(() => {
  const s = INPUT_SIZE_SCALE[props.size];
  return {
    height: s.height,
    font: s.fontSize,
    inputWidth: `calc(${s.fontSize} * 3)`,
    buttonSize: nestedSize(props.size),
    iconSize: s.fontSize,
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
  <div class="cui-input-stepper" ref="rootEl" v-show="!hidden">
    <label
      v-if="label"
      :style="{
        display: 'block',
        marginBottom: 'calc(0.25rem * var(--cui-density-scale, 1))',
        fontWeight: '500',
        color: 'var(--cui-text-secondary)',
        fontSize: cfg.font,
        textAlign: isVertical ? 'center' : undefined,
      }"
    >
      {{ label }}
    </label>

    <!-- Horizontal layout -->
    <div
      v-if="!isVertical"
      :style="{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 'var(--cui-button-radius, 0.375rem)',
        border: '1px solid var(--cui-border-strong, var(--cui-border))',
        opacity: disabled ? '0.5' : '1',
        height: cfg.height,
      }"
    >
      <CuiButton variant="ghost" :size="cfg.buttonSize" tabindex="-1" :disabled="disabled || !canDecrement" :color="color"
        :style="{ borderRadius: 'var(--cui-button-radius, 0.375rem) 0 0 var(--cui-button-radius, 0.375rem)', border: 'none', height: '100%' }"
        @click="decrement">
        <CuiIcon name="minus" :size="cfg.iconSize" />
      </CuiButton>
      <input ref="inputH" :id="id" :name="name" :autocomplete="autocomplete"
        :aria-describedby="ariaDescribedby" :aria-labelledby="ariaLabelledby"
        role="spinbutton" :aria-valuenow="modelValue" :aria-valuemin="min" :aria-valuemax="max"
        type="text" inputmode="numeric" :value="displayValue" :disabled="disabled"
        @keydown="onKeydown"
        :style="{ width: cfg.inputWidth, height: '100%', textAlign: 'center', border: 'none', borderLeft: '1px solid var(--cui-border-strong, var(--cui-border))', borderRight: '1px solid var(--cui-border-strong, var(--cui-border))', background: 'var(--cui-surface-base, white)', color: 'var(--cui-text-body)', fontSize: cfg.font, fontWeight: '600', outline: 'none', padding: '0', fontFamily: 'inherit' }"
        @input="onInput" />
      <CuiButton variant="ghost" :size="cfg.buttonSize" tabindex="-1" :disabled="disabled || !canIncrement" :color="color"
        :style="{ borderRadius: '0 var(--cui-button-radius, 0.375rem) var(--cui-button-radius, 0.375rem) 0', border: 'none', height: '100%' }"
        @click="increment">
        <CuiIcon name="plus" :size="cfg.iconSize" />
      </CuiButton>
    </div>

    <!-- Vertical layout -->
    <div
      v-else
      :style="{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderRadius: 'var(--cui-button-radius, 0.375rem)',
        border: '1px solid var(--cui-border-strong, var(--cui-border))',
        opacity: disabled ? '0.5' : '1',
        overflow: 'hidden',
      }"
    >
      <CuiButton variant="ghost" :size="cfg.buttonSize" tabindex="-1" :disabled="disabled || !canIncrement" :color="color"
        :style="{ border: 'none', borderRadius: '0', width: '100%', minWidth: cfg.inputWidth }"
        @click="increment">
        <CuiIcon name="caret-up" :size="cfg.iconSize" />
      </CuiButton>
      <input ref="inputV" :id="id" :name="name" :autocomplete="autocomplete"
        :aria-describedby="ariaDescribedby" :aria-labelledby="ariaLabelledby"
        role="spinbutton" :aria-valuenow="modelValue" :aria-valuemin="min" :aria-valuemax="max"
        type="text" inputmode="numeric" :value="displayValue" :disabled="disabled"
        @keydown="onKeydown"
        :style="{ width: cfg.inputWidth, textAlign: 'center', border: 'none', borderTop: '1px solid var(--cui-border-strong, var(--cui-border))', borderBottom: '1px solid var(--cui-border-strong, var(--cui-border))', background: 'var(--cui-surface-base, white)', color: 'var(--cui-text-body)', fontSize: cfg.font, fontWeight: '600', outline: 'none', padding: 'calc(0.25rem * var(--cui-density-scale, 1)) 0', fontFamily: 'inherit' }"
        @input="onInput" />
      <CuiButton variant="ghost" :size="cfg.buttonSize" tabindex="-1" :disabled="disabled || !canDecrement" :color="color"
        :style="{ border: 'none', borderRadius: '0', width: '100%' }"
        @click="decrement">
        <CuiIcon name="caret-down" :size="cfg.iconSize" />
      </CuiButton>
    </div>
  </div>
</template>

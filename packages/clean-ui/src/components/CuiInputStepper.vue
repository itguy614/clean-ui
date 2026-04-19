<script setup lang="ts">
import { computed } from "vue";
import type { ButtonColor } from "./CuiButton.vue";
import CuiButton from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";

export type InputStepperSize = "sm" | "md" | "lg";

export type InputStepperOrientation = "horizontal" | "vertical";

export interface CuiInputStepperProps {
  /** Current value */
  modelValue?: number;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Size */
  size?: InputStepperSize;
  /** Orientation */
  orientation?: InputStepperOrientation;
  /** Color role */
  color?: ButtonColor;
  /** Disabled state */
  disabled?: boolean;
  /** Label displayed above */
  label?: string;
  /** Pad value with leading zeros to this width */
  pad?: number;
  /** Wrap around from max to min and vice versa */
  wrap?: boolean;
  /** Hide the component */
  hidden?: boolean;
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

const sizeConfig: Record<InputStepperSize, { height: string; inputWidth: string; font: string; buttonSize: "xs" | "sm" | "md"; iconSize: string }> = {
  sm: { height: "1.75rem", inputWidth: "2.5rem", font: "0.8125rem", buttonSize: "xs", iconSize: "0.75rem" },
  md: { height: "2.25rem", inputWidth: "3rem", font: "0.875rem", buttonSize: "sm", iconSize: "0.875rem" },
  lg: { height: "2.75rem", inputWidth: "3.5rem", font: "1rem", buttonSize: "md", iconSize: "1rem" },
};

const cfg = computed(() => sizeConfig[props.size]);
</script>

<template>
  <div v-show="!hidden">
    <label
      v-if="label"
      :style="{
        display: 'block',
        marginBottom: '0.25rem',
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
      <CuiButton variant="ghost" :size="cfg.buttonSize" :disabled="disabled || !canDecrement" :color="color"
        :style="{ borderRadius: 'var(--cui-button-radius, 0.375rem) 0 0 var(--cui-button-radius, 0.375rem)', border: 'none', height: '100%' }"
        @click="decrement">
        <CuiIcon name="minus" :size="cfg.iconSize" />
      </CuiButton>
      <input type="text" inputmode="numeric" :value="displayValue" :disabled="disabled"
        :style="{ width: cfg.inputWidth, height: '100%', textAlign: 'center', border: 'none', borderLeft: '1px solid var(--cui-border-strong, var(--cui-border))', borderRight: '1px solid var(--cui-border-strong, var(--cui-border))', background: 'var(--cui-surface-base, white)', color: 'var(--cui-text-body)', fontSize: cfg.font, fontWeight: '600', outline: 'none', padding: '0', fontFamily: 'inherit' }"
        @input="onInput" />
      <CuiButton variant="ghost" :size="cfg.buttonSize" :disabled="disabled || !canIncrement" :color="color"
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
      <CuiButton variant="ghost" :size="cfg.buttonSize" :disabled="disabled || !canIncrement" :color="color"
        :style="{ border: 'none', borderRadius: '0', width: '100%', minWidth: cfg.inputWidth }"
        @click="increment">
        <CuiIcon name="caret-up" :size="cfg.iconSize" />
      </CuiButton>
      <input type="text" inputmode="numeric" :value="displayValue" :disabled="disabled"
        :style="{ width: cfg.inputWidth, textAlign: 'center', border: 'none', borderTop: '1px solid var(--cui-border-strong, var(--cui-border))', borderBottom: '1px solid var(--cui-border-strong, var(--cui-border))', background: 'var(--cui-surface-base, white)', color: 'var(--cui-text-body)', fontSize: cfg.font, fontWeight: '600', outline: 'none', padding: '0.25rem 0', fontFamily: 'inherit' }"
        @input="onInput" />
      <CuiButton variant="ghost" :size="cfg.buttonSize" :disabled="disabled || !canDecrement" :color="color"
        :style="{ border: 'none', borderRadius: '0', width: '100%' }"
        @click="decrement">
        <CuiIcon name="caret-down" :size="cfg.iconSize" />
      </CuiButton>
    </div>
  </div>
</template>

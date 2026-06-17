<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import type { CuiColor, CuiSize, HideableProps, ColorableProps, SizeableProps, DisableableProps } from "../types/common";
import { clampSize } from "../utils/sizing";
import CuiIcon from "./CuiIcon.vue";

export interface CuiSliderProps extends HideableProps, ColorableProps, SizeableProps, DisableableProps {
  /** Current value */
  modelValue?: number;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Label text */
  label?: string;
  /** Show the current value */
  showValue?: boolean;
  /** Format function for displayed value */
  formatValue?: (value: number) => string;
  /** Show min/max labels below the track */
  showRange?: boolean;
  /** Icon to display inside the thumb (Phosphor icon name) */
  thumbIcon?: string;
}

const props = withDefaults(defineProps<CuiSliderProps>(), {
  modelValue: 0,
  min: 0,
  max: 100,
  step: 1,
  size: "md",
  color: "primary",
  disabled: false,
  showValue: false,
  showRange: false,
  hidden: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: number];
}>();

const percent = computed(() =>
  ((props.modelValue - props.min) / (props.max - props.min)) * 100,
);

const displayValue = computed(() =>
  props.formatValue ? props.formatValue(props.modelValue) : String(props.modelValue),
);

const dragging = ref(false);

function onInput(e: Event) {
  const val = parseFloat((e.target as HTMLInputElement).value);
  emit("update:modelValue", val);
}

const SUPPORTED_SIZES = ["sm", "md", "lg"] as const;
const sizeConfig: Record<(typeof SUPPORTED_SIZES)[number], { trackHeight: string; thumbSize: string; thumbIcon: string; labelFont: string; valueFont: string }> = {
  sm: { trackHeight: "4px", thumbSize: "16px", thumbIcon: "0.5rem", labelFont: "0.8125rem", valueFont: "0.75rem" },
  md: { trackHeight: "6px", thumbSize: "20px", thumbIcon: "0.625rem", labelFont: "0.875rem", valueFont: "0.8125rem" },
  lg: { trackHeight: "8px", thumbSize: "26px", thumbIcon: "0.75rem", labelFont: "1rem", valueFont: "0.875rem" },
};

const cfg = computed(() => sizeConfig[clampSize(props.size, SUPPORTED_SIZES)]);
const thumbColor = computed(() => props.disabled ? "var(--cui-text-tertiary)" : `var(--cui-${props.color})`);
const fillColor = computed(() => props.disabled ? "var(--cui-text-tertiary)" : `var(--cui-${props.color})`);

// Expose imperative handle — the native range input is the interactive element
const inputRef = useTemplateRef<HTMLInputElement>("inputEl");

function focus(opts?: FocusOptions) {
  inputRef.value?.focus(opts);
}

function blur() {
  inputRef.value?.blur();
}

defineExpose({ el: inputRef, focus, blur });
</script>

<template>
  <div v-show="!hidden" :style="{ opacity: disabled ? 0.5 : 1 }">
    <!-- Label + value row -->
    <div
      v-if="label || showValue"
      style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.375rem;"
    >
      <label
        v-if="label"
        :style="{ fontSize: cfg.labelFont, fontWeight: '500', color: 'var(--cui-text-secondary)' }"
      >
        {{ label }}
      </label>
      <span
        v-if="showValue"
        :style="{ fontSize: cfg.valueFont, fontWeight: '600', color: 'var(--cui-text-body)', fontVariantNumeric: 'tabular-nums' }"
      >
        {{ displayValue }}
      </span>
    </div>

    <!-- Slider container -->
    <div :style="{ position: 'relative', height: cfg.thumbSize, display: 'flex', alignItems: 'center' }">
      <!-- Track background -->
      <div :style="{
        position: 'absolute',
        left: '0',
        right: '0',
        height: cfg.trackHeight,
        borderRadius: '9999px',
        background: 'var(--cui-border)',
      }" />

      <!-- Track fill -->
      <div :style="{
        position: 'absolute',
        left: '0',
        height: cfg.trackHeight,
        width: `${percent}%`,
        borderRadius: '9999px',
        background: fillColor,
        transition: dragging ? 'none' : 'width 0.1s ease',
      }" />

      <!-- Custom thumb -->
      <div :style="{
        position: 'absolute',
        left: `${percent}%`,
        transform: 'translateX(-50%)',
        width: cfg.thumbSize,
        height: cfg.thumbSize,
        borderRadius: '50%',
        background: thumbColor,
        border: '2px solid var(--cui-surface-base, white)',
        boxShadow: dragging ? '0 2px 8px rgba(0,0,0,0.25)' : '0 1px 3px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--cui-surface-base, white)',
        transition: dragging ? 'none' : 'left 0.1s ease, box-shadow 0.15s ease, transform 0.15s ease',
        pointerEvents: 'none',
        zIndex: 2,
      }">
        <slot name="thumb">
          <CuiIcon v-if="thumbIcon" :name="thumbIcon" :size="cfg.thumbIcon" />
        </slot>
      </div>

      <!-- Invisible native range input on top for interaction -->
      <input
        ref="inputEl"
        type="range"
        :value="modelValue"
        :min="min"
        :max="max"
        :step="step"
        :disabled="disabled"
        :style="{
          position: 'absolute',
          left: '0',
          width: '100%',
          height: '100%',
          margin: '0',
          opacity: '0',
          cursor: disabled ? 'default' : 'pointer',
          zIndex: 3,
        }"
        @input="onInput"
        @mousedown="dragging = true"
        @mouseup="dragging = false"
        @touchstart="dragging = true"
        @touchend="dragging = false"
      />
    </div>

    <!-- Min/max range labels -->
    <div
      v-if="showRange"
      style="display: flex; justify-content: space-between; margin-top: 0.25rem;"
    >
      <span :style="{ fontSize: cfg.valueFont, color: 'var(--cui-text-tertiary)' }">{{ formatValue ? formatValue(min) : min }}</span>
      <span :style="{ fontSize: cfg.valueFont, color: 'var(--cui-text-tertiary)' }">{{ formatValue ? formatValue(max) : max }}</span>
    </div>
  </div>
</template>

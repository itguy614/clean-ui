<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { useCuiId } from "../composables/useCuiId";
import { usePointerDrag } from "../composables/usePointerDrag";
import type { CuiColor, CuiSize, HideableProps, ColorableProps, SizeableProps, DisableableProps, NativeControlProps } from "../types/common";
import { clampSize } from "../utils/sizing";
import CuiIcon from "./CuiIcon.vue";

export interface CuiSliderProps extends NativeControlProps, HideableProps, ColorableProps, SizeableProps, DisableableProps {
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

// Motion only where it helps (#269). A click on the track glides the thumb to the point;
// a drag follows the pointer with none, and so does a keyboard step, which repeats. The
// first input of a press is the click's jump; any after it are the drag. The press is
// followed on the document, so one released off the slider still ends.
const press = usePointerDrag();
const pressed = press.active;
const dragging = ref(false);
const keyed = ref(false);
let inputsThisPress = 0;
const still = computed(() => dragging.value || keyed.value);
watch(pressed, (now) => {
  if (!now) dragging.value = false;
});

function onPointerDown(e: PointerEvent) {
  if (props.disabled || !press.start(e, () => {})) return;
  keyed.value = false;
  inputsThisPress = 0;
}

// Keys that move the value; Tab and the rest leave a later v-model change gliding.
const STEP_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"]);
function onKeydown(e: KeyboardEvent) {
  if (STEP_KEYS.has(e.key)) keyed.value = true;
}

const generatedId = useCuiId("slider");
const inputId = computed(() => props.id || generatedId);

function onInput(e: Event) {
  const val = parseFloat((e.target as HTMLInputElement).value);
  if (pressed.value && ++inputsThisPress > 1) dragging.value = true;
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
  <div
    class="cui-slider"
    v-show="!hidden"
    :style="{ opacity: disabled ? 0.5 : 1, '--_slider-focus-ring': `var(--cui-${color}-focus-ring)` }"
  >
    <!-- Label + value row -->
    <div
      v-if="label || showValue"
      style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: calc(0.375rem * var(--cui-density-scale, 1));"
    >
      <label
        v-if="label"
        :for="inputId"
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
    <div :style="{ position: 'relative', height: cfg.thumbSize, display: 'flex', alignItems: 'center', containerType: 'inline-size' }">
      <!-- Track, clipping its fill: a full-width pill slid left inside it, so it moves on the
           compositor (transform, not width, #266) and keeps its rounded end. -->
      <div :style="{
        position: 'absolute',
        left: '0',
        right: '0',
        height: cfg.trackHeight,
        borderRadius: '9999px',
        background: 'var(--cui-border)',
        overflow: 'hidden',
      }">
        <div class="cui-slider__fill" :style="{
          width: '100%',
          height: '100%',
          borderRadius: '9999px',
          background: fillColor,
          transform: `translateX(${percent - 100}%)`,
          transition: still ? 'none' : 'transform var(--cui-duration-press) var(--cui-ease-out)',
        }" />
      </div>

      <!-- Invisible native range input on top for interaction. It precedes the thumb so
           the thumb can draw the focus ring with a sibling selector. -->
      <input
        ref="inputEl"
        :id="inputId"
        :name="name"
        :autocomplete="autocomplete"
        :aria-describedby="ariaDescribedby"
        :aria-required="ariaRequired || undefined"
        :aria-labelledby="ariaLabelledby"
        :aria-valuetext="formatValue ? displayValue : undefined"
        class="cui-slider__input"
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
        @pointerdown="onPointerDown"
        @keydown="onKeydown"
        @blur="keyed = false"
      />
      <!-- Custom thumb, moved by transform (#266): 1cqw is 1% of the slider row, a size
           container, so `n * 1cqw` is n% of the track with no layer spanning it, and the
           thumb overhangs only at the ends, as with `left`. -->
      <div class="cui-slider__thumb" aria-hidden="true" :style="{
        position: 'absolute',
        left: '0',
        transform: `translateX(calc(${percent} * 1cqw - 50%))`,
        width: cfg.thumbSize,
        height: cfg.thumbSize,
        borderRadius: '50%',
        background: thumbColor,
        border: '2px solid var(--cui-surface-base, white)',
        boxShadow: pressed ? '0 2px 8px rgba(0,0,0,0.25)' : '0 1px 3px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--cui-surface-base, white)',
        transition: still ? 'none' : 'transform var(--cui-duration-press) var(--cui-ease-out), box-shadow var(--cui-duration-fast) ease',
        pointerEvents: 'none',
        zIndex: 2,
      }">
        <slot name="thumb">
          <CuiIcon v-if="thumbIcon" :name="thumbIcon" :size="cfg.thumbIcon" />
        </slot>
      </div>
    </div>

    <!-- Min/max range labels -->
    <div
      v-if="showRange"
      style="display: flex; justify-content: space-between; margin-top: calc(0.25rem * var(--cui-density-scale, 1));"
    >
      <span :style="{ fontSize: cfg.valueFont, color: 'var(--cui-text-tertiary)' }">{{ formatValue ? formatValue(min) : min }}</span>
      <span :style="{ fontSize: cfg.valueFont, color: 'var(--cui-text-tertiary)' }">{{ formatValue ? formatValue(max) : max }}</span>
    </div>
  </div>
</template>

<style scoped>
/* The native input is transparent, so the ring goes on the thumb it drives (#172). */
:where(.cui-slider__input:focus-visible ~ .cui-slider__thumb) {
  outline: 2px solid var(--cui-slider-focus-ring, var(--_slider-focus-ring));
  outline-offset: 2px;
}
</style>

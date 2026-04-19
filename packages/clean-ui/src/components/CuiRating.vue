<script setup lang="ts">
import { ref, computed } from "vue";
import type { ButtonColor } from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";

export type RatingSize = "sm" | "md" | "lg" | "xl";

export interface CuiRatingProps {
  /** Current value */
  modelValue?: number;
  /** Maximum rating */
  max?: number;
  /** Allow half-star values */
  half?: boolean;
  /** Size */
  size?: RatingSize;
  /** Color role */
  color?: ButtonColor;
  /** Icon name */
  icon?: string;
  /** Icon for half state (only used when half=true) */
  halfIcon?: string;
  /** Readonly (display only, no interaction) */
  readonly?: boolean;
  /** Disabled */
  disabled?: boolean;
  /** Show the numeric value */
  showValue?: boolean;
  /** Label */
  label?: string;
  /** Allow clearing to 0 by clicking current value */
  clearable?: boolean;
  /** Hidden */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiRatingProps>(), {
  modelValue: 0,
  max: 5,
  half: false,
  size: "md",
  color: "warning",
  icon: "star",
  halfIcon: "star-half",
  readonly: false,
  disabled: false,
  showValue: false,
  clearable: true,
  hidden: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: number];
}>();

const hoverValue = ref(0);
const isHovering = ref(false);

const displayValue = computed(() =>
  isHovering.value && !props.readonly && !props.disabled ? hoverValue.value : props.modelValue,
);

const sizeConfig: Record<RatingSize, { iconSize: string; gap: string; valueFont: string; labelFont: string }> = {
  sm: { iconSize: "1rem", gap: "0.125rem", valueFont: "0.75rem", labelFont: "0.75rem" },
  md: { iconSize: "1.375rem", gap: "0.1875rem", valueFont: "0.875rem", labelFont: "0.8125rem" },
  lg: { iconSize: "1.75rem", gap: "0.25rem", valueFont: "1rem", labelFont: "0.875rem" },
  xl: { iconSize: "2.25rem", gap: "0.375rem", valueFont: "1.125rem", labelFont: "1rem" },
};
const cfg = computed(() => sizeConfig[props.size]);

function getStarState(index: number): "filled" | "half" | "empty" {
  const val = displayValue.value;
  if (val >= index) return "filled";
  if (props.half && val >= index - 0.5) return "half";
  return "empty";
}

function getIconName(state: "filled" | "half" | "empty"): string {
  if (state === "half") return props.halfIcon;
  return props.icon;
}

function getIconWeight(state: "filled" | "half" | "empty"): "fill" | "regular" {
  if (state === "filled") return "fill";
  if (state === "half") return "fill";
  return "regular";
}

function onStarClick(index: number) {
  if (props.readonly || props.disabled) return;
  if (props.clearable && props.modelValue === index) {
    emit("update:modelValue", 0);
  } else {
    emit("update:modelValue", index);
  }
}

function onStarHalfClick(index: number, e: MouseEvent) {
  if (props.readonly || props.disabled) return;
  if (!props.half) { onStarClick(index); return; }

  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const isLeftHalf = e.clientX - rect.left < rect.width / 2;
  const val = isLeftHalf ? index - 0.5 : index;

  if (props.clearable && props.modelValue === val) {
    emit("update:modelValue", 0);
  } else {
    emit("update:modelValue", val);
  }
}

function onStarHover(index: number, e: MouseEvent) {
  if (props.readonly || props.disabled) return;
  isHovering.value = true;

  if (props.half) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const isLeftHalf = e.clientX - rect.left < rect.width / 2;
    hoverValue.value = isLeftHalf ? index - 0.5 : index;
  } else {
    hoverValue.value = index;
  }
}

function onLeave() {
  isHovering.value = false;
  hoverValue.value = 0;
}

function starColor(state: "filled" | "half" | "empty"): string {
  if (state === "empty") return "var(--cui-text-tertiary)";
  return `var(--cui-${props.color})`;
}
</script>

<template>
  <div v-show="!hidden">
    <label
      v-if="label"
      :style="{ display: 'block', marginBottom: '0.25rem', fontSize: cfg.labelFont, fontWeight: '500', color: 'var(--cui-text-secondary)' }"
    >{{ label }}</label>

    <div
      :style="{
        display: 'inline-flex',
        alignItems: 'center',
        gap: cfg.gap,
        opacity: disabled ? '0.5' : '1',
      }"
      @mouseleave="onLeave"
    >
      <div
        v-for="i in max"
        :key="i"
        :style="{
          cursor: readonly || disabled ? 'default' : 'pointer',
          display: 'inline-flex',
          transition: 'transform 0.1s ease',
          transform: isHovering && hoverValue >= i ? 'scale(1.15)' : 'scale(1)',
        }"
        @click="onStarHalfClick(i, $event)"
        @mousemove="onStarHover(i, $event)"
      >
        <CuiIcon
          :name="getIconName(getStarState(i))"
          :weight="getIconWeight(getStarState(i))"
          :size="cfg.iconSize"
          :style="{ color: starColor(getStarState(i)), transition: 'color 0.1s ease' }"
        />
      </div>

      <span
        v-if="showValue"
        :style="{
          fontSize: cfg.valueFont,
          fontWeight: '600',
          color: 'var(--cui-text-body)',
          marginLeft: '0.25rem',
          fontVariantNumeric: 'tabular-nums',
        }"
      >
        {{ modelValue }}
      </span>
    </div>
  </div>
</template>

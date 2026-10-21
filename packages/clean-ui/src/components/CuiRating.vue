<script setup lang="ts">
import { ref, computed, useTemplateRef } from "vue";
import type { CuiColor, CuiSize, HideableProps, ColorableProps, SizeableProps, DisableableProps } from "../types/common";
import { clampSize, scaleDensity } from "../utils/sizing";
import CuiIcon from "./CuiIcon.vue";
import { useCuiId } from "../composables/useCuiId";
import { useMessages } from "../composables/useMessages";

export interface CuiRatingProps extends HideableProps, ColorableProps, SizeableProps, DisableableProps {
  /** Current value */
  modelValue?: number;
  /** Maximum rating */
  max?: number;
  /** Allow half-star values */
  half?: boolean;
  /** Icon name */
  icon?: string;
  /** Icon for half state (only used when half=true) */
  halfIcon?: string;
  /** Readonly (display only, no interaction) */
  readonly?: boolean;
  /** Show the numeric value */
  showValue?: boolean;
  /** Label */
  label?: string;
  /** Allow clearing to 0 by clicking current value */
  clearable?: boolean;
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

const interactive = computed(() => !props.readonly && !props.disabled);

const displayValue = computed(() => (isHovering.value && interactive.value ? hoverValue.value : props.modelValue));

const SUPPORTED_SIZES = ["sm", "md", "lg", "xl"] as const;

const sizeConfig: Record<(typeof SUPPORTED_SIZES)[number], { iconSize: string; gap: string; valueFont: string; labelFont: string }> = {
  sm: { iconSize: "1rem", gap: scaleDensity("0.125rem"), valueFont: "0.75rem", labelFont: "0.75rem" },
  md: { iconSize: "1.375rem", gap: scaleDensity("0.1875rem"), valueFont: "0.875rem", labelFont: "0.8125rem" },
  lg: { iconSize: "1.75rem", gap: scaleDensity("0.25rem"), valueFont: "1rem", labelFont: "0.875rem" },
  xl: { iconSize: "2.25rem", gap: scaleDensity("0.375rem"), valueFont: "1.125rem", labelFont: "1rem" },
};
const cfg = computed(() => sizeConfig[clampSize(props.size, SUPPORTED_SIZES)]);

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

/** The value a pointer at `e` over star `index` means: its left half is half a star less. */
function valueAt(index: number, e: MouseEvent) {
  if (!props.half) return index;
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  return e.clientX - rect.left < rect.width / 2 ? index - 0.5 : index;
}

function onStarClick(index: number, e: MouseEvent) {
  if (!interactive.value) return;
  const val = valueAt(index, e);
  // Clicking the current value clears it, when clearable.
  emit("update:modelValue", props.clearable && props.modelValue === val ? 0 : val);
}

function onStarHover(index: number, e: MouseEvent) {
  if (!interactive.value) return;
  isHovering.value = true;
  hoverValue.value = valueAt(index, e);
}

function onLeave() {
  isHovering.value = false;
  hoverValue.value = 0;
}

function starColor(state: "filled" | "half" | "empty"): string {
  if (state === "empty") return "var(--cui-text-tertiary)";
  return `var(--cui-${props.color})`;
}

// --- Keyboard and ARIA (#171) ------------------------------------------------
// The stars are one role="slider": a single tab stop whose arrows step the value, the
// WAI-ARIA slider pattern. A readonly rating is a display, not a control, so it is an image
// with the same text and no tab stop — a list of reviews shouldn't be a list of tab stops.
const messages = useMessages();
const labelId = useCuiId("rating-label");
const step = computed(() => (props.half ? 0.5 : 1));
// Clearable means 0 is reachable; otherwise the lowest rating is one step.
const lowest = computed(() => (props.clearable ? 0 : step.value));
// The value as announced: within the range, and free of float noise from upstream arithmetic.
const shownValue = computed(() => Math.round(Math.min(props.max, Math.max(0, props.modelValue)) * 100) / 100);
const valueText = computed(() => messages.value.rating.valueText(shownValue.value, props.max));

const controlId = useCuiId("rating");

const controlAttrs = computed(() =>
  props.readonly
    ? {
        role: "img",
        "aria-label": valueText.value,
        // Named by the label, then its own value text: "Quality, 4 of 5 stars".
        "aria-labelledby": props.label ? `${labelId} ${controlId}` : undefined,
      }
    : {
        role: "slider",
        // No tabindex at all while disabled, so a click can't focus it either.
        tabindex: props.disabled ? undefined : 0,
        // An unset 0 is still reported as 0, even where the keys can't go back to it.
        "aria-valuemin": shownValue.value >= lowest.value ? lowest.value : 0,
        "aria-valuemax": props.max,
        "aria-valuenow": shownValue.value,
        "aria-valuetext": valueText.value,
        "aria-labelledby": props.label ? labelId : undefined,
        "aria-disabled": props.disabled || undefined,
      },
);

// One step up or down from `v`, from the step grid: a value off it (2.5 without `half`)
// lands on the grid rather than staying off it.
const EPS = 1e-9;
const stepUp = (v: number) => Math.floor(v / step.value + EPS) * step.value + step.value;
const stepDown = (v: number) => Math.ceil(v / step.value - EPS) * step.value - step.value;

function onKeydown(e: KeyboardEvent) {
  if (!interactive.value || e.altKey || e.ctrlKey || e.metaKey) return;
  const v = props.modelValue;
  // Horizontal arrows follow the stars, which fill from the right in a right-to-left page.
  const rtl = !!controlEl.value && getComputedStyle(controlEl.value).direction === "rtl";
  let next: number;
  let up: boolean;
  switch (e.key) {
    case "ArrowRight":
    case "ArrowLeft":
      up = (e.key === "ArrowRight") !== rtl;
      next = up ? stepUp(v) : stepDown(v);
      break;
    case "ArrowUp":
      [up, next] = [true, stepUp(v)];
      break;
    case "ArrowDown":
      [up, next] = [false, stepDown(v)];
      break;
    case "Home":
      [up, next] = [false, lowest.value];
      break;
    case "End":
      [up, next] = [true, props.max];
      break;
    default:
      return;
  }
  e.preventDefault();
  // The pointer may be resting on the stars: show the value the keys set, not its preview.
  isHovering.value = false;
  next = Math.min(props.max, Math.max(lowest.value, next));
  // A decrease never raises the value (an unset 0 when 0 is out of reach), nor the reverse.
  if (up ? next > v : next < v) emit("update:modelValue", next);
}

// Expose imperative handle — the slider is the focusable element
const rootEl = useTemplateRef<HTMLElement>("rootEl");
const controlEl = useTemplateRef<HTMLElement>("controlEl");

function focus(opts?: FocusOptions) {
  controlEl.value?.focus(opts);
}

function blur() {
  controlEl.value?.blur();
}

defineExpose({ el: rootEl, focus, blur });
</script>

<template>
  <div class="cui-rating" ref="rootEl" v-show="!hidden">
    <!-- Not a <label>: there is no labelable element to point it at. It names the slider
         through aria-labelledby, and a click on it focuses the slider as a label would. -->
    <span
      v-if="label"
      :id="labelId"
      class="cui-rating__label"
      :style="{ display: 'block', marginBottom: 'calc(0.25rem * var(--cui-density-scale, 1))', fontSize: cfg.labelFont, fontWeight: '500', color: 'var(--cui-text-secondary)' }"
      @click="interactive && focus()"
    >{{ label }}</span>

    <div
      :id="controlId"
      ref="controlEl"
      class="cui-rating__control"
      v-bind="controlAttrs"
      :style="{
        display: 'inline-flex',
        alignItems: 'center',
        gap: cfg.gap,
        opacity: disabled ? '0.5' : '1',
        '--_rating-focus-ring': `var(--cui-${color}-focus-ring)`,
      }"
      @mouseleave="onLeave"
      @keydown="onKeydown"
    >
      <div
        v-for="i in max"
        :key="i"
        :style="{
          cursor: interactive ? 'pointer' : 'default',
          display: 'inline-flex',
          transition: 'transform 0.1s ease',
          transform: isHovering && hoverValue >= i ? 'scale(1.15)' : 'scale(1)',
        }"
        aria-hidden="true"
        @click="onStarClick(i, $event)"
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
        aria-hidden="true"
        :style="{
          fontSize: cfg.valueFont,
          fontWeight: '600',
          color: 'var(--cui-text-body)',
          marginLeft: 'calc(0.25rem * var(--cui-density-scale, 1))',
          fontVariantNumeric: 'tabular-nums',
        }"
      >
        {{ modelValue }}
      </span>
    </div>
  </div>
</template>

<style scoped>
/* --- Themeable: zero specificity, so a consumer's own rule wins (see CuiButton.vue) --- */
:where(.cui-rating__control:focus-visible) {
  outline: 2px solid var(--cui-rating-focus-ring, var(--_rating-focus-ring));
  outline-offset: 2px;
  border-radius: var(--cui-radius-sm, 0.25rem);
}
</style>

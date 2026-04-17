<script setup lang="ts">
import { computed, inject, ref } from "vue";
import { RadioGroupKey, type RadioGroupContext } from "./radio-context";
import type { ButtonColor } from "./CuiButton.vue";
import { BUTTON_SIZE_SCALE } from "../utils/sizing";

export interface CuiRadioProps {
  /** The value this radio represents */
  value: string | number | boolean;
  /** v-model binding (standalone mode) */
  modelValue?: string | number | boolean;
  /** Label text (or use default slot) */
  label?: string;
  /** Description text (or use #description slot) */
  description?: string;
  /** Color role — overrides group color if inside a group */
  color?: ButtonColor;
  /** Name attribute (standalone mode) */
  name?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Readonly state */
  readonly?: boolean;
}

const props = withDefaults(defineProps<CuiRadioProps>(), {
  disabled: false,
  readonly: false,
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
</script>

<template>
  <!-- Button variant -->
  <button
    v-if="isButtonVariant"
    ref="elRef"
    type="button"
    class="cui-radio-button cui-button"
    :class="{
      'cui-radio-button--active': isChecked,
      'cui-radio-button--disabled': isDisabled,
    }"
    :style="{
      '--_rb-color': `var(--cui-${resolvedColor})`,
      '--_rb-hover': `var(--cui-${resolvedColor}-hover)`,
      '--_rb-active': `var(--cui-${resolvedColor}-active)`,
      '--_rb-bg': `var(--cui-${resolvedColor}-bg)`,
      '--_rb-text': `var(--cui-${resolvedColor}-text)`,
      '--_rb-border': `var(--cui-${resolvedColor}-border)`,
      '--_rb-focus-ring': `var(--cui-${resolvedColor}-focus-ring)`,
      height: buttonSizeStyles.height,
      paddingLeft: buttonSizeStyles.px,
      paddingRight: buttonSizeStyles.px,
      fontSize: buttonSizeStyles.fontSize,
    }"
    :disabled="isDisabled"
    role="radio"
    :aria-checked="isChecked"
    @click="select"
  >
    <input
      type="radio"
      :name="resolvedName"
      :value="String(value)"
      :checked="isChecked"
      :disabled="isDisabled"
      tabindex="-1"
      aria-hidden="true"
      class="cui-radio__input"
      @click.stop.prevent
    />
    <slot>{{ label }}</slot>
  </button>

  <!-- Default variant -->
  <label
    v-else
    ref="elRef"
    class="cui-radio"
    :style="{ '--_radio-focus-ring': `var(--cui-${resolvedColor}-focus-ring)` }"
    :class="{
      'cui-radio--checked': isChecked,
      'cui-radio--disabled': isDisabled,
      'cui-radio--readonly': isReadonly,
    }"
    role="radio"
    :aria-checked="isChecked"
    :aria-disabled="isDisabled || isReadonly || undefined"
    :tabindex="isDisabled ? -1 : 0"
    @click="select"
    @keydown="onKeydown"
  >
    <!-- Hidden native input for form submission -->
    <input
      type="radio"
      :name="resolvedName"
      :value="String(value)"
      :checked="isChecked"
      :disabled="isDisabled"
      :readonly="isReadonly"
      tabindex="-1"
      aria-hidden="true"
      class="cui-radio__input"
      @click.stop.prevent
    />

    <!-- Visual circle indicator -->
    <span
      class="cui-radio__indicator"
      :style="{
        '--_radio-color': `var(--cui-${resolvedColor})`,
        '--_radio-border': isChecked ? `var(--cui-${resolvedColor}-border)` : `var(--color-surface-400)`,
        '--_radio-bg': isChecked ? `var(--cui-${resolvedColor}-bg)` : 'transparent',
      }"
    >
      <span v-if="isChecked" class="cui-radio__dot" />
    </span>

    <!-- Label + description -->
    <span class="cui-radio__label-wrap">
      <span class="cui-radio__label">
        <slot>{{ label }}</slot>
      </span>
      <span v-if="description || $slots.description" class="cui-radio__description">
        <slot name="description">{{ description }}</slot>
      </span>
    </span>
  </label>

</template>

<style scoped>
.cui-radio {
  display: inline-flex;
  align-items: flex-start;
  gap: 0.5rem;
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

.cui-radio__input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* --- Indicator circle --- */
.cui-radio__indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
  border-radius: 50%;
  border: 2px solid var(--_radio-border);
  background: var(--_radio-bg);
  transition: border-color 0.15s ease, background 0.15s ease;
  margin-top: 0.125rem; /* align with first line of text */
}

.cui-radio:hover:not(.cui-radio--disabled):not(.cui-radio--readonly) .cui-radio__indicator {
  border-color: var(--_radio-color);
}

.cui-radio:focus-visible {
  outline: 2px solid var(--_radio-focus-ring);
  outline-offset: 2px;
  border-radius: 0.25rem;
}

/* --- Inner dot --- */
.cui-radio__dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--_radio-color);
  animation: cui-radio-pop 0.15s ease;
}

@keyframes cui-radio-pop {
  0% {
    transform: scale(0);
  }
  60% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

/* --- Label --- */
.cui-radio__label-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
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
  border: 1px solid var(--_rb-border);
  background: transparent;
  color: var(--_rb-color);
  border-radius: var(--cui-button-radius, 0.375rem);
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.cui-radio-button:hover:not(:disabled):not(.cui-radio-button--active) {
  background: var(--_rb-bg);
  border-color: var(--_rb-color);
}

.cui-radio-button--active {
  background: var(--_rb-bg);
  color: var(--_rb-color);
  border-color: var(--_rb-color);
}

.cui-radio-button--active:hover:not(:disabled) {
  background: var(--_rb-border);
}

.cui-radio-button:focus-visible {
  outline: 2px solid var(--_rb-focus-ring);
  outline-offset: 2px;
}

.cui-radio-button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Radius merging is handled by CuiButtonGroup via the .cui-button class */
</style>

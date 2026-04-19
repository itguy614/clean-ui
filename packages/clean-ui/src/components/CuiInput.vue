<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import type { ButtonColor } from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";
import { INPUT_SIZE_SCALE } from "../utils/sizing";

export type InputSize = "xs" | "sm" | "md" | "lg" | "xl";
export type InputType = "text" | "password" | "email" | "url" | "tel" | "search";

export interface CuiInputProps {
  /** v-model binding */
  modelValue?: string;
  /** Input type */
  type?: InputType;
  /** Placeholder text */
  placeholder?: string;
  /** Color role — affects focus border */
  color?: ButtonColor;
  /** Size */
  size?: InputSize;
  /** Show clear button when input has value */
  clearable?: boolean;
  /** Show error state (red border + message) */
  error?: boolean;
  /** Error message displayed below the input */
  errorMessage?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Readonly state */
  readonly?: boolean;
  /** Hide the component */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiInputProps>(), {
  modelValue: "",
  type: "text",
  color: "primary",
  size: "md",
  clearable: false,
  error: false,
  disabled: false,
  readonly: false,
  hidden: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  clear: [];
}>();

// Password visibility toggle
const passwordVisible = ref(false);
const isPassword = computed(() => props.type === "password");
const resolvedType = computed(() => {
  if (isPassword.value && passwordVisible.value) return "text";
  return props.type;
});

// Clearable logic
const showClear = computed(() => props.clearable && props.modelValue && !props.disabled && !props.readonly);

function clear() {
  emit("update:modelValue", "");
  emit("clear");
  inputRef.value?.focus();
}

function onInput(e: Event) {
  emit("update:modelValue", (e.target as HTMLInputElement).value);
}

// Expose
const inputRef = useTemplateRef<HTMLInputElement>("inputEl");

function focus(opts?: FocusOptions) {
  inputRef.value?.focus(opts);
}

function blur() {
  inputRef.value?.blur();
}

defineExpose({ el: inputRef, focus, blur });

const dims = computed(() => INPUT_SIZE_SCALE[props.size]);
</script>

<template>
  <div v-show="!hidden" class="cui-input-wrapper">
    <div
      class="cui-input"
      :class="{
        'cui-input--error': error,
        'cui-input--disabled': disabled,
        'cui-input--focused': false,
        'cui-input--has-prefix-button': $slots['prefix-button'],
        'cui-input--has-suffix-button': $slots['suffix-button'],
      }"
      :style="{
        '--_input-height': dims.height,
        '--_input-font-size': dims.fontSize,
        '--_input-px': dims.px,
        '--_input-color': `var(--cui-${color})`,
        '--_input-focus-ring': `var(--cui-${color}-focus-ring)`,
        '--_input-border': error ? 'var(--cui-error)' : `var(--cui-border-strong)`,
        '--_input-focus-border': error ? 'var(--cui-error)' : `var(--cui-${color})`,
      }"
    >
      <!-- Prefix button slot (merged into border) -->
      <div v-if="$slots['prefix-button']" class="cui-input__prefix-button">
        <slot name="prefix-button" />
      </div>

      <!-- Inner input area -->
      <div class="cui-input__inner">
        <!-- Prefix slot (icons/text inside input) -->
        <span v-if="$slots.prefix" class="cui-input__prefix">
          <slot name="prefix" />
        </span>

        <!-- Native input -->
        <input
          ref="inputEl"
          :type="resolvedType"
          :value="modelValue"
          :placeholder="placeholder"
          :disabled="disabled"
          :readonly="readonly"
          :aria-invalid="error || undefined"
          class="cui-input__native"
          @input="onInput"
        />

        <!-- Clear button -->
        <button
          v-if="showClear"
          type="button"
          class="cui-input__clear"
          tabindex="-1"
          aria-label="Clear input"
          @click="clear"
        >
          <CuiIcon name="x" size="0.75rem" />
        </button>

        <!-- Password toggle -->
        <button
          v-if="isPassword"
          type="button"
          class="cui-input__password-toggle"
          tabindex="-1"
          :aria-label="passwordVisible ? 'Hide password' : 'Show password'"
          @click="passwordVisible = !passwordVisible"
        >
          <!-- Eye open -->
          <CuiIcon v-if="!passwordVisible" name="eye" size="1rem" />
          <!-- Eye closed -->
          <CuiIcon v-else name="eye-slash" size="1rem" />
        </button>

        <!-- Suffix slot (icons/text inside input) -->
        <span v-if="$slots.suffix" class="cui-input__suffix">
          <slot name="suffix" />
        </span>
      </div>

      <!-- Suffix button slot (merged into border) -->
      <div v-if="$slots['suffix-button']" class="cui-input__suffix-button">
        <slot name="suffix-button" />
      </div>
    </div>

    <!-- Error message -->
    <div v-if="error && errorMessage" class="cui-input__error">
      {{ errorMessage }}
    </div>
  </div>
</template>

<style scoped>
.cui-input-wrapper {
  display: flex;
  flex-direction: column;
}

.cui-input {
  display: flex;
  align-items: stretch;
  border-radius: var(--cui-button-radius, 0.375rem);
  border: 1px solid var(--_input-border);
  background: var(--cui-surface-base);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  overflow: hidden;
}

.cui-input:focus-within:not(.cui-input--disabled) {
  border-color: var(--_input-focus-border);
  box-shadow: 0 0 0 2px var(--_input-focus-ring);
}

.cui-input--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* --- Inner input area --- */
.cui-input__inner {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  height: var(--_input-height);
  padding: 0 var(--_input-px);
  gap: 0.5rem;
}

/* --- Native input --- */
.cui-input__native {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: var(--_input-font-size);
  font-family: inherit;
  color: var(--cui-text-body);
}

.cui-input__native::placeholder {
  color: var(--cui-text-tertiary);
}

/* Hide native browser password reveal buttons */
.cui-input__native::-ms-reveal,
.cui-input__native::-ms-clear {
  display: none;
}

.cui-input__native::-webkit-credentials-auto-fill-button,
.cui-input__native::-webkit-textfield-decoration-container {
  visibility: hidden;
  pointer-events: none;
}

.cui-input__native:disabled {
  cursor: not-allowed;
}

/* --- Prefix / Suffix (inside input) --- */
.cui-input__prefix,
.cui-input__suffix {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: var(--cui-text-secondary);
  font-size: var(--_input-font-size);
}

/* --- Clear button --- */
.cui-input__clear {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--cui-text-tertiary);
  padding: 0;
  border-radius: 50%;
  transition: color 0.15s ease, background 0.15s ease;
}

.cui-input__clear:hover {
  color: var(--cui-text-body);
  background: var(--color-surface-200);
}

:where(.dark, .dark *) .cui-input__clear:hover {
  background: var(--color-surface-700);
}

/* --- Password toggle --- */
.cui-input__password-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--cui-text-tertiary);
  padding: 0;
  border-radius: 0.25rem;
  transition: color 0.15s ease;
}

.cui-input__password-toggle:hover {
  color: var(--cui-text-body);
}

/* --- Prefix/Suffix buttons (merged into border) --- */
.cui-input__prefix-button,
.cui-input__suffix-button {
  display: flex;
  align-items: stretch;
}

.cui-input__prefix-button {
  border-right: 1px solid var(--_input-border);
}

.cui-input__suffix-button {
  border-left: 1px solid var(--_input-border);
}

/* Override button styles when merged into input */
.cui-input__prefix-button :deep(.cui-button),
.cui-input__suffix-button :deep(.cui-button) {
  border: none;
  height: 100%;
  box-shadow: none;
}

/* Prefix button: outer left matches input radius, inner right is flat */
/* !important needed to override button's inline :style border-radius */
.cui-input__prefix-button :deep(.cui-button) {
  border-radius: calc(var(--cui-button-radius, 0.375rem) - 1px) 0 0 calc(var(--cui-button-radius, 0.375rem) - 1px) !important;
}

/* Suffix button: inner left is flat, outer right matches input radius */
.cui-input__suffix-button :deep(.cui-button) {
  border-radius: 0 calc(var(--cui-button-radius, 0.375rem) - 1px) calc(var(--cui-button-radius, 0.375rem) - 1px) 0 !important;
}

/* Suppress button's own focus ring inside input — the input's focus-within handles it */
.cui-input__prefix-button :deep(.cui-button:focus-visible),
.cui-input__suffix-button :deep(.cui-button:focus-visible) {
  outline: none;
  background: var(--_btn-hover-bg);
}

/* --- Error state --- */
.cui-input--error {
  border-color: var(--cui-error);
}

.cui-input--error:focus-within {
  border-color: var(--cui-error);
  box-shadow: 0 0 0 2px var(--cui-error-focus-ring);
}

.cui-input__error {
  font-size: 0.8125rem;
  margin-top: 0.375rem;
  color: var(--cui-error);
}
</style>

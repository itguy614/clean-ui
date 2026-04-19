<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, useTemplateRef } from "vue";
import type { ButtonColor } from "./CuiButton.vue";
import type { InputSize } from "./CuiInput.vue";
import { TEXTAREA_SIZE_SCALE } from "../utils/sizing";

export interface CuiTextareaProps {
  /** v-model binding */
  modelValue?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Color role — affects focus border */
  color?: ButtonColor;
  /** Size */
  size?: InputSize;
  /** Initial/minimum number of visible rows */
  rows?: number;
  /** Auto-resize to fit content */
  autoResize?: boolean;
  /** Maximum rows when auto-resizing */
  maxRows?: number;
  /** Maximum character length — shows counter when set */
  maxLength?: number;
  /** Show error state */
  error?: boolean;
  /** Error message below textarea */
  errorMessage?: string;
  /** Disabled */
  disabled?: boolean;
  /** Readonly */
  readonly?: boolean;
  /** Hide the component */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiTextareaProps>(), {
  modelValue: "",
  color: "primary",
  size: "md",
  rows: 3,
  autoResize: false,
  error: false,
  disabled: false,
  readonly: false,
  hidden: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const textareaRef = useTemplateRef<HTMLTextAreaElement>("textareaEl");

const charCount = computed(() => props.modelValue.length);
const isOverLimit = computed(() => props.maxLength !== undefined && charCount.value > props.maxLength);

function onInput(e: Event) {
  const el = e.target as HTMLTextAreaElement;
  let value = el.value;

  // Enforce maxLength (prevent typing past limit)
  if (props.maxLength !== undefined && value.length > props.maxLength) {
    value = value.slice(0, props.maxLength);
    el.value = value;
  }

  emit("update:modelValue", value);

  if (props.autoResize) {
    nextTick(resize);
  }
}

// Auto-resize logic
function resize() {
  const el = textareaRef.value;
  if (!el) return;

  // Reset to min height to get accurate scrollHeight
  el.style.height = "auto";

  const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20;
  const paddingTop = parseFloat(getComputedStyle(el).paddingTop) || 0;
  const paddingBottom = parseFloat(getComputedStyle(el).paddingBottom) || 0;
  const borderTop = parseFloat(getComputedStyle(el).borderTopWidth) || 0;
  const borderBottom = parseFloat(getComputedStyle(el).borderBottomWidth) || 0;

  const minHeight = lineHeight * props.rows + paddingTop + paddingBottom + borderTop + borderBottom;
  let maxHeight = Infinity;

  if (props.maxRows) {
    maxHeight = lineHeight * props.maxRows + paddingTop + paddingBottom + borderTop + borderBottom;
  }

  const scrollHeight = el.scrollHeight;
  const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);

  el.style.height = `${newHeight}px`;
  el.style.overflowY = scrollHeight > maxHeight ? "auto" : "hidden";
}

onMounted(() => {
  if (props.autoResize) {
    nextTick(resize);
  }
});

watch(() => props.modelValue, () => {
  if (props.autoResize) {
    nextTick(resize);
  }
});

// Expose
function focus(opts?: FocusOptions) {
  textareaRef.value?.focus(opts);
}

function blur() {
  textareaRef.value?.blur();
}

defineExpose({ el: textareaRef, focus, blur });

const dims = computed(() => TEXTAREA_SIZE_SCALE[props.size]);
</script>

<template>
  <div v-show="!hidden" class="cui-textarea-wrapper">
    <div
      class="cui-textarea"
      :class="{
        'cui-textarea--error': error || isOverLimit,
        'cui-textarea--disabled': disabled,
      }"
      :style="{
        '--_ta-px': dims.px,
        '--_ta-py': dims.py,
        '--_ta-font-size': dims.fontSize,
        '--_ta-color': `var(--cui-${color})`,
        '--_ta-focus-ring': `var(--cui-${color}-focus-ring)`,
        '--_ta-border': error || isOverLimit ? 'var(--cui-error)' : `var(--cui-border-strong)`,
        '--_ta-focus-border': error || isOverLimit ? 'var(--cui-error)' : `var(--cui-${color})`,
      }"
    >
      <textarea
        ref="textareaEl"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :rows="rows"
        :aria-invalid="error || undefined"
        class="cui-textarea__native"
        @input="onInput"
      />
    </div>

    <!-- Footer: error message and/or character count -->
    <div
      v-if="(error && errorMessage) || maxLength !== undefined"
      class="cui-textarea__footer"
    >
      <div v-if="error && errorMessage" class="cui-textarea__error">
        {{ errorMessage }}
      </div>
      <div v-else class="cui-textarea__spacer" />
      <div
        v-if="maxLength !== undefined"
        class="cui-textarea__counter"
        :class="{ 'cui-textarea__counter--over': isOverLimit }"
      >
        {{ charCount }}/{{ maxLength }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.cui-textarea-wrapper {
  display: flex;
  flex-direction: column;
}

.cui-textarea {
  display: flex;
  border-radius: var(--cui-button-radius, 0.375rem);
  border: 1px solid var(--_ta-border);
  background: var(--cui-surface-base);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  overflow: hidden;
}

.cui-textarea:focus-within:not(.cui-textarea--disabled) {
  border-color: var(--_ta-focus-border);
  box-shadow: 0 0 0 2px var(--_ta-focus-ring);
}

.cui-textarea--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cui-textarea--error {
  border-color: var(--cui-error);
}

.cui-textarea--error:focus-within {
  border-color: var(--cui-error);
  box-shadow: 0 0 0 2px var(--cui-error-focus-ring);
}

/* --- Native textarea --- */
.cui-textarea__native {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: var(--_ta-font-size);
  font-family: inherit;
  color: var(--cui-text-body);
  padding: var(--_ta-py) var(--_ta-px);
  line-height: 1.6;
  resize: vertical;
}

.cui-textarea__native::placeholder {
  color: var(--cui-text-tertiary);
}

.cui-textarea__native:disabled {
  cursor: not-allowed;
  resize: none;
}

/* --- Footer --- */
.cui-textarea__footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-top: 0.375rem;
  gap: 1rem;
}

.cui-textarea__error {
  font-size: 0.8125rem;
  color: var(--cui-error);
}

.cui-textarea__spacer {
  flex: 1;
}

.cui-textarea__counter {
  font-size: 0.75rem;
  color: var(--cui-text-tertiary);
  white-space: nowrap;
  margin-left: auto;
}

.cui-textarea__counter--over {
  color: var(--cui-error);
  font-weight: 500;
}
</style>

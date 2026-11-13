<script setup lang="ts">
import { computed, watch, nextTick, onMounted, useTemplateRef } from "vue";
import type { HideableProps, ColorableProps, SizeableProps, DisableableProps, CuiRounded, NativeControlProps, FormControlProps } from "../types/common";
import { TEXTAREA_SIZE_SCALE, RADIUS_SCALE } from "../utils/sizing";
import { useFieldDescribedBy } from "../composables/useFieldDescribedBy";
import { useFloatingLabel } from "./form-field-context";

export interface CuiTextareaProps
  extends NativeControlProps,
    HideableProps,
    ColorableProps,
    SizeableProps,
    DisableableProps,
    Pick<FormControlProps, "error" | "errorMessage" | "readonly"> {
  /** v-model binding */
  modelValue?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Initial/minimum number of visible rows */
  rows?: number;
  /** Auto-resize to fit content */
  autoResize?: boolean;
  /** Maximum rows when auto-resizing */
  maxRows?: number;
  /** Maximum character length — shows counter when set */
  maxLength?: number;
  /** Border radius */
  rounded?: CuiRounded;
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
  rounded: "md",
});

// Link our own error message into aria-describedby (#175).
const { errorId, describedBy } = useFieldDescribedBy(props);

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

// Inside a `labelPosition="floating"` CuiFormField the label rests on the first line and
// floats into room reserved above it (#191).
const floatingLabel = useFloatingLabel(
  () => props,
  () => ({ kind: "multiline", size: props.size }),
);
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
        '--_textarea-radius': RADIUS_SCALE[rounded],
        '--_textarea-px': dims.px,
        '--_textarea-py': dims.py,
        '--_textarea-float-offset': floatingLabel().float?.offset,
        '--_textarea-font-size': dims.fontSize,
        '--_textarea-focus-ring': `var(--cui-${color}-focus-ring)`,
        '--_textarea-border': error || isOverLimit ? 'var(--cui-error)' : `var(--cui-border-strong)`,
        '--_textarea-focus-border': error || isOverLimit ? 'var(--cui-error)' : `var(--cui-${color})`,
      }"
    >
      <textarea
        ref="textareaEl"
        :id="id"
        :name="name"
        :autocomplete="autocomplete"
        :aria-describedby="describedBy"
        :aria-required="ariaRequired || undefined"
        :aria-labelledby="ariaLabelledby"
        :value="modelValue"
        :placeholder="floatingLabel().placeholder"
        :data-cui-float-label="floatingLabel().marker"
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
      <div v-if="error && errorMessage" :id="errorId" class="cui-textarea__error cui-field-error">
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

/* Themeable (#333, #454): zero specificity, so a consumer's `.cui-textarea { border-radius }`
   or `--cui-textarea-radius` on a container wins. The values are computed in the script and
   emitted as private `--_textarea-*` properties; each is read back through its public token. */
:where(.cui-textarea) {
  border-radius: var(--cui-textarea-radius, var(--_textarea-radius));
  border-color: var(--cui-textarea-border, var(--_textarea-border));
}

/* After the resting rule: both are zero specificity, so the later one wins. */
:where(.cui-textarea:focus-within:not(.cui-textarea--disabled)) {
  border-color: var(--cui-textarea-focus-border, var(--_textarea-focus-border));
  box-shadow: 0 0 0 2px var(--cui-textarea-focus-ring, var(--_textarea-focus-ring));
}

.cui-textarea {
  display: flex;
  border-width: 1px;
  border-style: solid;
  background: var(--cui-surface-base);
  transition: border-color var(--cui-duration-fast) ease, box-shadow var(--cui-duration-fast) ease;
  overflow: hidden;
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
  /* The error ring, at normal specificity so a themed `--cui-textarea-focus-ring` (which
     recolours the normal ring) can't hide an invalid field; `--cui-error-focus-ring` is its
     slot, as for CuiSelect and CuiCombobox (#454). */
  box-shadow: 0 0 0 2px var(--cui-error-focus-ring);
}

/* --- Native textarea --- */
.cui-textarea__native {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  color: var(--cui-text-body);
  line-height: 1.6;
  resize: vertical;
}

:where(.cui-textarea__native) {
  font-size: var(--cui-textarea-font-size, var(--_textarea-font-size));
  padding-block: var(--cui-textarea-py, var(--_textarea-py));
  padding-inline: var(--cui-textarea-px, var(--_textarea-px));
}

.cui-textarea__native::placeholder {
  color: var(--cui-text-tertiary);
}

/* Under a floating label (#191), room for it is reserved all the time, so the text never
   jumps: 6px, the floated label's line box, 2px. And the placeholder shows only once the
   label has floated. */
.cui-textarea__native[data-cui-float-label] {
  padding-top: calc(var(--_textarea-float-offset) + 0.5rem * var(--cui-density-scale, 1));
}

.cui-textarea__native[data-cui-float-label]:not(:focus)::placeholder {
  color: transparent;
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
  margin-top: calc(0.375rem * var(--cui-density-scale, 1));
  gap: calc(1rem * var(--cui-density-scale, 1));
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

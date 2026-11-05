<script setup lang="ts">
import { Text, computed, onBeforeUpdate, ref, useSlots, useTemplateRef } from "vue";
import type { HideableProps, ColorableProps, SizeableProps, DisableableProps, CuiRounded, NativeControlProps } from "../types/common";
import CuiIcon from "./CuiIcon.vue";
import CuiInputAttachment from "./CuiInputAttachment.vue";
import { INPUT_SIZE_SCALE, RADIUS_SCALE } from "../utils/sizing";
import { useFieldDescribedBy } from "../composables/useFieldDescribedBy";
import { useMessages } from "../composables/useMessages";
import { useFloatingLabel } from "./form-field-context";
import { slotNodes } from "../utils/vnodes";

export type InputType =
  | "text"
  | "password"
  | "email"
  | "url"
  | "tel"
  | "search"
  | "number"
  | "range";

export interface CuiInputProps extends NativeControlProps, HideableProps, ColorableProps, SizeableProps, DisableableProps {
  /** v-model binding. `string | number` so `type="number"` / `v-model.number` bind without a cast. */
  modelValue?: string | number;
  /** Input type */
  type?: InputType;
  /** Placeholder text */
  placeholder?: string;
  /** Show clear button when input has value */
  clearable?: boolean;
  /** Show error state (red border + message) */
  error?: boolean;
  /** Error message displayed below the input */
  errorMessage?: string;
  /** Readonly state */
  readonly?: boolean;
  /** Border radius */
  rounded?: CuiRounded;
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
  rounded: "md",
});

// Link our own error message into aria-describedby (#175).
const { errorId, describedBy } = useFieldDescribedBy(props);

const emit = defineEmits<{
  "update:modelValue": [value: string | number];
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
// Use an explicit emptiness check (not truthiness) so a numeric 0 still shows the clear button.
const showClear = computed(
  () =>
    props.clearable &&
    props.modelValue !== "" &&
    props.modelValue != null &&
    !props.disabled &&
    !props.readonly,
);

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
const messages = useMessages();

// Inside a `labelPosition="floating"` CuiFormField (#191). A leading icon keeps the label
// resting, after it. Prefix text (`https://`) is part of the value and an inline suffix sits
// where a resting label would run, so either keeps it floated; a suffix, the clear button
// and the password toggle are kept clear of with end room. An attached button is as tall as
// the box and of unknown width, so there is no room inside for the label: the field falls
// back to a top label.
const slots = useSlots();
const floatingLabel = useFloatingLabel(
  () => ({ id: slots["prefix-button"] || slots["suffix-button"] ? undefined : props.id, placeholder: props.placeholder }),
  () => {
    const lead = !!slots.prefix && prefixIsIcon();
    return {
      kind: slots.suffix || (slots.prefix && !lead) ? "pinned" : "inline",
      lead,
      end: Number(!!slots.suffix) + Number(props.clearable) + Number(isPassword.value),
      size: props.size,
    };
  },
);

/**
 * Whether the prefix is a lone default-size CuiIcon, whose width the field's CSS knows
 * (CuiIcon's `md`, 1.25rem). Anything else, text or another icon size, keeps the label up.
 * Cached for the render: the getter above runs once per binding that reads it.
 */
let prefixIcon: boolean | undefined;
onBeforeUpdate(() => (prefixIcon = undefined));
function prefixIsIcon(): boolean {
  if (prefixIcon === undefined) {
    const nodes = slotNodes(slots.prefix?.() ?? []).filter((n) => !(n.type === Text && !String(n.children).trim()));
    prefixIcon = nodes.length === 1 && nodes[0].type === CuiIcon && (nodes[0].props?.size ?? "md") === "md";
  }
  return prefixIcon;
}

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
        'cui-input--floating': floatingLabel().float,
      }"
      :style="{
        '--_input-radius': RADIUS_SCALE[rounded],
        '--_input-height': floatingLabel().float?.height ?? dims.height,
        '--_input-float-offset': floatingLabel().float?.offset,
        '--_input-font-size': dims.fontSize,
        '--_input-px': dims.px,
        '--_input-focus-ring': `var(--cui-${color}-focus-ring)`,
        '--_input-border': error ? 'var(--cui-error)' : `var(--cui-border-strong)`,
        '--_input-focus-border': error ? 'var(--cui-error)' : `var(--cui-${color})`,
      }"
    >
      <!-- Prefix button slot (merged into border) -->
      <CuiInputAttachment v-if="$slots['prefix-button']" side="start" class="cui-input__prefix-button">
        <slot name="prefix-button" />
      </CuiInputAttachment>

      <!-- Inner input area -->
      <div class="cui-input__inner">
        <!-- Prefix slot (icons/text inside input) -->
        <span v-if="$slots.prefix" class="cui-input__prefix">
          <slot name="prefix" />
        </span>

        <!-- Native input -->
        <input
          ref="inputEl"
          :id="id"
          :name="name"
          :autocomplete="autocomplete"
          :aria-describedby="describedBy"
          :aria-required="ariaRequired || undefined"
          :aria-labelledby="ariaLabelledby"
          :type="resolvedType"
          :value="modelValue"
          :placeholder="floatingLabel().placeholder"
          :data-cui-float-label="floatingLabel().marker"
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
          :aria-label="messages.input.clear"
          @click="clear"
        >
          <CuiIcon name="x" size="0.75rem" />
        </button>

        <!-- Password toggle -->
        <button
          v-if="isPassword"
          type="button"
          class="cui-input__password-toggle"
          :aria-label="passwordVisible ? messages.input.hidePassword : messages.input.showPassword"
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
      <CuiInputAttachment v-if="$slots['suffix-button']" side="end" class="cui-input__suffix-button">
        <slot name="suffix-button" />
      </CuiInputAttachment>
    </div>

    <!-- Error message -->
    <div v-if="error && errorMessage" :id="errorId" class="cui-input__error cui-field-error">
      {{ errorMessage }}
    </div>
  </div>
</template>

<style scoped>
.cui-input-wrapper {
  display: flex;
  flex-direction: column;
}

/* Themeable (#333): zero specificity, so a consumer's plain `.cui-input { border-radius }`
   or `--cui-input-radius` on a container wins. */
:where(.cui-input) {
  border-radius: var(--cui-input-radius, var(--_input-radius));
}

.cui-input {
  display: flex;
  align-items: stretch;
  /* The scale's height is the control's OUTER height, as it is for CuiSelect and the rest.
     It used to sit on `__inner`, which put the 1px borders outside it and made every input
     2px taller than a select or combobox of the same size (#123). */
  height: var(--_input-height);
  border: 1px solid var(--_input-border);
  background: var(--cui-surface-base);
  transition: border-color var(--cui-duration-fast) ease, box-shadow var(--cui-duration-fast) ease;
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
  height: 100%;
  padding: 0 var(--_input-px);
  gap: calc(0.5rem * var(--cui-density-scale, 1));
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

/* --- Floating label (#191) ---
   The field's label sits inside the box, above the value: the value (and prefix or suffix
   text beside it, so their baselines match) is pushed down by the floated label's line
   box, and stays centred in what is left. An icon, like the clear and password buttons,
   stays centred on the full height. */
:where(.cui-input--floating .cui-input__native, .cui-input--floating :is(.cui-input__prefix, .cui-input__suffix):not(:has(> .cui-icon:only-child))) {
  align-self: stretch;
  padding-top: var(--_input-float-offset);
}

/* A resting label stands where the placeholder would, so it shows only once the label has
   floated: on focus. A pinned label never rests, so its control's placeholder always shows.
   Behaviour rather than paint, so at normal specificity, above the placeholder colour. */
.cui-input__native[data-cui-float-label]:not([data-cui-float-label~="pinned"]):not(:focus)::placeholder {
  color: transparent;
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
  transition: color var(--cui-duration-fast) ease, background var(--cui-duration-fast) ease;
}

.cui-input__clear:hover {
  color: var(--cui-text-body);
  background: var(--cui-surface-dark-bg);
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
  transition: color var(--cui-duration-fast) ease;
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

/* Flush against the input's border, so a press shrinking it (#261) would open a seam. */
:where(.cui-input__prefix-button, .cui-input__suffix-button) {
  --cui-press-scale: 1;
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

/* The corners come from the button itself: CuiInputAttachment provides the group context
   (outer corners follow the input's radius, the inner side is flat — #444). */

/* Suppress button's own focus ring inside input — the input's focus-within handles it */
.cui-input__prefix-button :deep(.cui-button:focus-visible),
.cui-input__suffix-button :deep(.cui-button:focus-visible) {
  outline: none;
  background: var(--cui-button-hover-bg, var(--_button-hover-bg));
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
  margin-top: calc(0.375rem * var(--cui-density-scale, 1));
}
</style>

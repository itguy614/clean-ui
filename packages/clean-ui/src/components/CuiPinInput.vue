<script setup lang="ts">
import { computed, ref, watch, useTemplateRef } from "vue";
import type { ColorableProps, FormControlProps, HideableProps, NativeControlProps, SizeableProps } from "../types/common";
import { INPUT_SIZE_SCALE } from "../utils/sizing";
import { useCuiId } from "../composables/useCuiId";
import { useEventListener } from "../composables/useEventListener";
import { useFieldDescribedBy } from "../composables/useFieldDescribedBy";
import { useMessages } from "../composables/useMessages";

/** Which characters a pin input accepts. */
export type PinInputType = "digits" | "alphanumeric";

export interface CuiPinInputProps
  extends FormControlProps,
    NativeControlProps,
    HideableProps,
    ColorableProps,
    SizeableProps {
  /** v-model binding: the code typed so far. */
  modelValue?: string;
  /** Number of characters in the code. */
  length?: number;
  /** `digits` accepts 0-9 and opens a numeric keypad; `alphanumeric` accepts A-Z, a-z, 0-9. */
  type?: PinInputType;
  /** Upper-case letters as they are typed or pasted (alphanumeric codes). */
  uppercase?: boolean;
  /** Show a dot instead of each character, like a password input. */
  mask?: boolean;
}

const props = withDefaults(defineProps<CuiPinInputProps>(), {
  modelValue: undefined,
  length: 6,
  type: "digits",
  uppercase: false,
  mask: false,
  color: "primary",
  size: "md",
  autocomplete: "one-time-code",
  error: false,
  disabled: false,
  readonly: false,
  required: false,
  hidden: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  /** The last character was filled: the code is complete. */
  complete: [value: string];
}>();

const messages = useMessages();

// --- Ids and ARIA ---
// One real input is the control (#196): a single textbox for a screen reader, the target
// of SMS autofill and of a paste. The boxes are presentation, so they are aria-hidden.
const generatedId = useCuiId("pin-input");
const inputId = computed(() => props.id ?? generatedId);
const descriptionId = computed(() => (props.description ? `${inputId.value}-description` : undefined));
const { errorId, describedBy } = useFieldDescribedBy(props, { descriptionId: () => descriptionId.value });

// --- Value ---
const DISALLOWED: Record<PinInputType, RegExp> = {
  digits: /[^0-9]/g,
  alphanumeric: /[^A-Za-z0-9]/g,
};

/** Drop every character the type does not accept (spaces and dashes in a pasted code). */
function clean(text: string): string {
  const kept = text.replace(DISALLOWED[props.type], "");
  return props.uppercase ? kept.toUpperCase() : kept;
}
const sanitize = (text: string) => clean(text).slice(0, props.length);

// Local state as well as the prop, so the component also works without a v-model (a plain
// `<form>` reading it by `name`).
const value = ref(sanitize(props.modelValue ?? ""));

const inputEl = useTemplateRef<HTMLInputElement>("inputEl");
const rootEl = useTemplateRef<HTMLElement>("rootEl");
const boxesEl = useTemplateRef<HTMLElement>("boxesEl");

const focused = ref(false);
/** The box the caret is in. */
const active = ref(0);

/**
 * Put the caret in box `index`. A box holding a character has it selected, so typing
 * overwrites it; the first empty box gets a collapsed caret. A full code keeps its last
 * character selected, since the input's maxlength would block typing at the end.
 */
function setCaret(index: number) {
  const el = inputEl.value;
  const len = value.value.length;
  const pos = Math.max(0, Math.min(index, len, props.length - 1));
  active.value = pos;
  if (!el || document.activeElement !== el) return;
  const end = pos < len ? pos + 1 : pos;
  // Unchanged, it is left alone: re-setting it would fire another selectionchange.
  if (el.selectionStart !== pos || el.selectionEnd !== end) el.setSelectionRange(pos, end);
}

/** Follow the native selection, turning a collapsed caret into the overwrite selection. */
function syncSelection() {
  const el = inputEl.value;
  if (!el || document.activeElement !== el) return;
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? start;
  if (start === end) setCaret(start);
  else active.value = Math.min(start, props.length - 1);
}

/**
 * Write a new value. `complete` fires when the code becomes full, or when an edit reaches
 * the last box of a full one (retyping the last digit, a full paste) — not on every
 * correction of a middle digit, which would re-verify a code on each keystroke.
 */
function commit(next: string, caret: number) {
  const el = inputEl.value;
  if (el && el.value !== next) el.value = next;
  if (next !== value.value) {
    const wasFull = value.value.length === props.length;
    value.value = next;
    emit("update:modelValue", next);
    if (next.length === props.length && (!wasFull || caret >= props.length)) emit("complete", next);
  }
  setCaret(caret);
}

// A new model from the parent, or a new length/type/uppercase, is cleaned again. A cleaned
// value that differs is emitted back, so the parent's model is always what is shown. Focus
// stays put: the caret follows to the first empty box at most.
watch(
  () => [props.modelValue, props.length, props.type, props.uppercase] as const,
  () => {
    const next = sanitize(props.modelValue ?? value.value);
    const el = inputEl.value;
    if (el && el.value !== next) el.value = next;
    value.value = next;
    if (next !== (props.modelValue ?? next)) emit("update:modelValue", next);
    setCaret(Math.min(active.value, next.length));
  },
);

// --- Native events ---

/** A typed character the type does not accept. */
const isRejectedTyping = (e: InputEvent) => e.inputType === "insertText" && !!e.data && !clean(e.data);

/**
 * A typed character the type does not accept never reaches the value. Anything longer than
 * one character — a keyboard's code suggestion, which arrives as `insertText`, or a
 * replacement from autofill — takes the same route as a paste, so maxlength cannot cut it
 * before it is cleaned.
 */
function onBeforeInput(e: InputEvent) {
  if (e.isComposing) return;
  if (isRejectedTyping(e)) {
    e.preventDefault();
    return;
  }
  if (e.inputType !== "insertText" && e.inputType !== "insertReplacementText") return;
  const text = e.data ?? e.dataTransfer?.getData("text/plain");
  if (text == null || (e.inputType === "insertText" && text.length < 2)) return;
  e.preventDefault();
  insertText(text);
}

/** A drop goes in at the box it lands on, not at the caret left from before. */
function onDrop(e: DragEvent) {
  e.preventDefault();
  const text = e.dataTransfer?.getData("text/plain");
  if (!text || props.readonly || props.disabled) return;
  inputEl.value?.focus();
  setCaret(boxAt(e.clientX));
  insertText(text);
}

function onInput(e: Event) {
  // Rewriting the value or the selection mid-composition makes an IME drop or repeat
  // characters: wait for compositionend.
  if ((e as InputEvent).isComposing) return;
  const el = e.target as HTMLInputElement;
  // Fallback for a browser without beforeinput: put the old value back rather than lose the
  // character the rejected one replaced.
  if (isRejectedTyping(e as InputEvent)) {
    commit(value.value, active.value);
    return;
  }
  const caret = clean(el.value.slice(0, el.selectionStart ?? el.value.length)).length;
  commit(sanitize(el.value), caret);
}

/**
 * A pasted code is sanitised before it is truncated: maxlength alone would cut
 * `123-456` to `123-45`. A paste as long as the code replaces it; a shorter one is
 * inserted at the caret.
 */
function insertText(text: string) {
  const el = inputEl.value;
  if (!el || props.readonly || props.disabled) return;
  const pasted = clean(text);
  if (!pasted) return;
  if (pasted.length >= props.length) {
    commit(pasted.slice(0, props.length), props.length);
    return;
  }
  const start = el.selectionStart ?? value.value.length;
  const end = el.selectionEnd ?? start;
  const next = (value.value.slice(0, start) + pasted + value.value.slice(end)).slice(0, props.length);
  commit(next, start + pasted.length);
}

function onPaste(e: ClipboardEvent) {
  e.preventDefault();
  insertText(e.clipboardData?.getData("text") ?? "");
}

function onKeydown(e: KeyboardEvent) {
  if (e.isComposing || e.shiftKey || e.altKey || e.metaKey || e.ctrlKey) return;
  let next: number;
  switch (e.key) {
    case "ArrowLeft":
      next = active.value - 1;
      break;
    case "ArrowRight":
      next = active.value + 1;
      break;
    case "Home":
      next = 0;
      break;
    case "End":
      next = value.value.length; // setCaret holds a full code on its last box
      break;
    default:
      return;
  }
  // Handled here because the overwrite selection would collapse right back to where it was.
  e.preventDefault();
  setCaret(next);
}

function onFocus() {
  focused.value = true;
  setCaret(value.value.length);
}

function onBlur() {
  focused.value = false;
}

/** Which box a pointer at `x` is over: the first whose right edge it is left of. */
function boxAt(x: number): number {
  const boxes = boxesEl.value?.children ?? [];
  for (let i = 0; i < boxes.length; i++) {
    if (x < boxes[i].getBoundingClientRect().right) return i;
  }
  return props.length - 1;
}

/**
 * The input lies over the boxes, so a click lands on it; the browser would put the caret
 * by its own (invisible) text. Instead the caret goes to the box clicked, or to the first
 * empty one if that is further left. A long press on touch fires no mousedown, so the
 * native paste callout still works.
 */
function onMousedown(e: MouseEvent) {
  if (e.button !== 0 || props.disabled) return;
  e.preventDefault();
  inputEl.value?.focus();
  setCaret(boxAt(e.clientX));
}

// While focused, follow selection changes the browser makes itself (select-all, a
// screen reader's cursor).
useEventListener("document", "selectionchange", syncSelection, { enabled: focused });

// --- Rendering ---
/** One character per box; changes only with the value, not on every caret move. */
const chars = computed(() => Array.from({ length: props.length }, (_, i) => value.value[i] ?? ""));
/** The highlighted box, or -1 when unfocused. Readonly too: it is the only focus indicator. */
const activeBox = computed(() => (focused.value ? active.value : -1));
/** The blinking caret, in the first empty box only: a filled active box is highlighted. */
const caretAt = computed(() =>
  !props.readonly && activeBox.value === value.value.length ? activeBox.value : -1,
);

/**
 * Emitted as private `--_pin-input-*` properties; the stylesheet reads each back behind a
 * public `--cui-pin-input-*` token. See "Themeable Properties" in CLAUDE.md.
 */
const style = computed(() => {
  const s = INPUT_SIZE_SCALE[props.size];
  const c = props.error ? "error" : props.color;
  return {
    "--_pin-input-height": s.height,
    "--_pin-input-font-size": s.fontSize,
    "--_pin-input-gap": `calc(${s.px} * 0.75)`,
    "--_pin-input-focus-border": `var(--cui-${c})`,
    "--_pin-input-focus-ring": `var(--cui-${c}-focus-ring)`,
  };
});

function focus(opts?: FocusOptions) {
  inputEl.value?.focus(opts);
}

function blur() {
  inputEl.value?.blur();
}

defineExpose({ el: rootEl, focus, blur });
</script>

<template>
  <div
    v-show="!hidden"
    ref="rootEl"
    class="cui-pin-input"
    :class="{
      'cui-pin-input--error': error,
      'cui-pin-input--disabled': disabled,
      'cui-pin-input--readonly': readonly,
    }"
    :style="style"
  >
    <label v-if="label" :for="inputId" class="cui-pin-input__label">
      <span>{{ label }}</span>
      <template v-if="required">
        <span class="cui-pin-input__required" aria-hidden="true">*</span>
        <span class="cui-sr-only">{{ messages.formField.required }}</span>
      </template>
    </label>
    <p v-if="description" :id="descriptionId" class="cui-pin-input__description">{{ description }}</p>

    <div class="cui-pin-input__field">
      <div ref="boxesEl" class="cui-pin-input__boxes" aria-hidden="true">
        <span
          v-for="(char, i) in chars"
          :key="i"
          class="cui-pin-input__box"
          :class="{ 'cui-pin-input__box--filled': char, 'cui-pin-input__box--active': i === activeBox }"
        >
          <template v-if="char">
            <span v-if="mask" class="cui-pin-input__dot" />
            <template v-else>{{ char }}</template>
          </template>
          <span v-if="i === caretAt" class="cui-pin-input__caret" />
        </span>
      </div>
      <input
        ref="inputEl"
        class="cui-pin-input__native"
        :id="inputId"
        :type="mask ? 'password' : 'text'"
        :name="name"
        :autocomplete="autocomplete"
        :inputmode="type === 'digits' ? 'numeric' : 'text'"
        :autocapitalize="uppercase ? 'characters' : 'off'"
        autocorrect="off"
        spellcheck="false"
        :maxlength="length"
        :value="value"
        :disabled="disabled"
        :readonly="readonly"
        :aria-labelledby="ariaLabelledby"
        :aria-describedby="describedBy"
        :aria-required="required || ariaRequired || undefined"
        :aria-invalid="error || undefined"
        @beforeinput="onBeforeInput"
        @input="onInput"
        @paste="onPaste"
        @keydown="onKeydown"
        @focus="onFocus"
        @blur="onBlur"
        @select="syncSelection"
        @compositionend="onInput"
        @drop="onDrop"
        @mousedown="onMousedown"
      />
    </div>

    <div v-if="error && errorMessage" :id="errorId" class="cui-pin-input__error cui-field-error">
      {{ errorMessage }}
    </div>
  </div>
</template>

<style scoped>
/* --- Themeable ---
   Zero specificity, so a consumer's own rule wins without `!important`. */
:where(.cui-pin-input__boxes) {
  gap: var(--cui-pin-input-gap, var(--_pin-input-gap));
}

:where(.cui-pin-input__box) {
  /* Square: one token sizes both sides. */
  width: var(--cui-pin-input-height, var(--_pin-input-height));
  height: var(--cui-pin-input-height, var(--_pin-input-height));
  font-size: var(--cui-pin-input-font-size, var(--_pin-input-font-size));
  color: var(--cui-pin-input-color, var(--cui-text-body));
  background: var(--cui-pin-input-bg, var(--cui-surface-base, white));
  border: var(--cui-pin-input-border, 1px solid var(--cui-border-strong, var(--cui-border)));
  border-radius: var(--cui-pin-input-radius, var(--cui-button-radius, var(--cui-radius-md, 0.375rem)));
}

/* The box the caret is in. No transition: typing moves it on every keystroke (#269). */
:where(.cui-pin-input__box--active) {
  border-color: var(--cui-pin-input-focus-border, var(--_pin-input-focus-border));
  box-shadow: 0 0 0 2px var(--cui-pin-input-focus-ring, var(--_pin-input-focus-ring));
}

/* --- Structural --- */
.cui-pin-input {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: calc(0.375rem * var(--cui-density-scale, 1));
}

.cui-pin-input__label {
  display: flex;
  align-items: center;
  gap: calc(0.25rem * var(--cui-density-scale, 1));
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.4;
  color: var(--cui-text-body);
}

.cui-pin-input__required {
  color: var(--cui-error);
  font-weight: 600;
  line-height: inherit;
}

.cui-pin-input__description {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--cui-text-secondary);
}

.cui-pin-input__field {
  position: relative;
  display: inline-flex;
  max-width: 100%;
}

.cui-pin-input__boxes {
  display: flex;
  min-width: 0;
}

.cui-pin-input__box {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* Narrower than square rather than overflowing a narrow container (a long code on a phone). */
  min-width: 0;
  font-weight: 600;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  user-select: none;
}

/* An invalid code is outlined in error whatever the tokens say. */
.cui-pin-input--error .cui-pin-input__box {
  border-color: var(--cui-error);
}

.cui-pin-input__dot {
  width: 0.5em;
  height: 0.5em;
  border-radius: 9999px;
  background: currentColor;
}

/* A decorative loop, named so the reduced-motion rule in main.css can stop it. */
.cui-pin-input__caret {
  width: 1px;
  height: 1.1em;
  background: currentColor;
  animation: cui-pin-input-blink 1s linear infinite;
}

@keyframes cui-pin-input-blink {
  0%,
  50% {
    opacity: 1;
  }
  50.01%,
  100% {
    opacity: 0;
  }
}

/* The real control, over the boxes so a click or a long press lands on it. Invisible, but
   not display:none or visibility:hidden, which would take it out of autofill and the
   accessibility tree. 16px keeps iOS from zooming in on focus. */
.cui-pin-input__native {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  opacity: 0;
  font-size: 16px;
  background: transparent;
  color: transparent;
  caret-color: transparent;
  cursor: text;
}

.cui-pin-input--disabled .cui-pin-input__field {
  opacity: 0.5;
}

.cui-pin-input--disabled .cui-pin-input__native {
  cursor: not-allowed;
}
</style>

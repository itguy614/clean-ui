<script setup lang="ts">
import { computed, ref, watch, nextTick, useTemplateRef } from "vue";
import CuiInput from "./CuiInput.vue";
import type { ButtonColor } from "./CuiButton.vue";
import type { InputSize } from "./CuiInput.vue";

export interface MaskToken {
  pattern: RegExp;
}

export interface CuiMaskedInputProps {
  /** Raw value (no separators) */
  modelValue?: string;
  /** Mask pattern: # = digit, A = letter, * = alphanumeric, others are literal */
  mask: string;
  /** Custom token definitions, e.g. { X: { pattern: /[0-9a-fA-F]/ } } */
  tokens?: Record<string, MaskToken>;
  /** Character shown for unfilled positions */
  fillChar?: string;
  /** Placeholder text (shown when input is empty and not focused) */
  placeholder?: string;
  /** Color role */
  color?: ButtonColor;
  /** Size */
  size?: InputSize;
  /** Show clear button */
  clearable?: boolean;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Disabled */
  disabled?: boolean;
  /** Readonly */
  readonly?: boolean;
  /** Hide the component */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiMaskedInputProps>(), {
  modelValue: "",
  fillChar: "_",
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
  "update:formattedValue": [value: string];
}>();

// Built-in tokens
const builtinTokens: Record<string, MaskToken> = {
  "#": { pattern: /[0-9]/ },
  A: { pattern: /[a-zA-Z]/ },
  "*": { pattern: /[a-zA-Z0-9]/ },
};

const allTokens = computed(() => ({ ...builtinTokens, ...props.tokens }));

// Parse the mask into slot definitions
interface MaskSlot {
  index: number;
  isToken: boolean;
  char: string;
  pattern?: RegExp;
}

const maskSlots = computed<MaskSlot[]>(() => {
  const slots: MaskSlot[] = [];
  let slotIndex = 0;
  for (let i = 0; i < props.mask.length; i++) {
    const ch = props.mask[i];
    // Backslash escapes the next character as a literal
    if (ch === "\\" && i + 1 < props.mask.length) {
      i++;
      slots.push({ index: slotIndex, isToken: false, char: props.mask[i] });
      slotIndex++;
      continue;
    }
    const token = allTokens.value[ch];
    if (token) {
      slots.push({ index: slotIndex, isToken: true, char: ch, pattern: token.pattern });
    } else {
      slots.push({ index: slotIndex, isToken: false, char: ch });
    }
    slotIndex++;
  }
  return slots;
});

// Only the editable slots
const editableSlots = computed(() => maskSlots.value.filter((s) => s.isToken));

// Convert raw value → display string with guide
function rawToDisplay(raw: string): string {
  let rawIdx = 0;
  let result = "";
  for (const slot of maskSlots.value) {
    if (slot.isToken) {
      if (rawIdx < raw.length) {
        result += raw[rawIdx];
        rawIdx++;
      } else {
        result += props.fillChar;
      }
    } else {
      result += slot.char;
    }
  }
  return result;
}

// Convert display string → raw value (extract only token positions)
function displayToRaw(display: string): string {
  let raw = "";
  for (const slot of maskSlots.value) {
    if (slot.isToken && slot.index < display.length) {
      const ch = display[slot.index];
      if (ch !== props.fillChar && slot.pattern?.test(ch)) {
        raw += ch;
      }
    }
  }
  return raw;
}

// Filter a string to only chars matching mask token patterns in order
function filterInput(input: string): string {
  let result = "";
  let slotIdx = 0;
  for (const ch of input) {
    if (slotIdx >= editableSlots.value.length) break;
    const slot = editableSlots.value[slotIdx];
    if (slot.pattern?.test(ch)) {
      result += ch;
      slotIdx++;
    }
  }
  return result;
}

// The display value shown in the input
const displayValue = ref(rawToDisplay(props.modelValue));

// Keep display in sync with external modelValue changes
watch(
  () => props.modelValue,
  (newRaw) => {
    const filtered = filterInput(newRaw);
    displayValue.value = rawToDisplay(filtered);
  },
);

// Formatted value
const formattedValue = computed(() => displayValue.value);

// Find the display index for a given raw character position
function rawIndexToDisplayIndex(rawIdx: number): number {
  let count = 0;
  for (const slot of maskSlots.value) {
    if (slot.isToken) {
      if (count === rawIdx) return slot.index;
      count++;
    }
  }
  // Past the end — return position after last filled token
  return maskSlots.value.length;
}

// Find the next editable position at or after a display index
function nextEditablePos(displayIdx: number): number {
  for (const slot of maskSlots.value) {
    if (slot.isToken && slot.index >= displayIdx) return slot.index;
  }
  return maskSlots.value.length;
}

// Find the previous editable position before a display index
function prevEditablePos(displayIdx: number): number {
  let last = 0;
  for (const slot of maskSlots.value) {
    if (slot.isToken && slot.index < displayIdx) last = slot.index;
  }
  return last;
}

// Reference to the inner CuiInput
const inputRef = useTemplateRef<InstanceType<typeof CuiInput>>("maskedInputRef");

function getInputEl(): HTMLInputElement | null {
  return (inputRef.value as any)?.el as HTMLInputElement | null;
}

function setCursor(pos: number) {
  nextTick(() => {
    const el = getInputEl();
    if (el) {
      el.setSelectionRange(pos, pos);
    }
  });
}

// Handle input events manually
function onBeforeInput(e: InputEvent) {
  e.preventDefault();
  const el = getInputEl();
  if (!el) return;

  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? start;
  const currentRaw = displayToRaw(displayValue.value);

  if (e.inputType === "insertText" && e.data) {
    // Find which raw position maps to this cursor position
    let rawPos = 0;
    for (const slot of maskSlots.value) {
      if (slot.index >= start) break;
      if (slot.isToken) rawPos++;
    }

    // Filter the incoming characters
    const charsToInsert = filterInputAtPosition(e.data, rawPos);
    if (!charsToInsert) return;

    // If there's a selection, remove those raw chars first
    let newRaw = currentRaw;
    if (start !== end) {
      const rawStart = displayPosToRawPos(start);
      const rawEnd = displayPosToRawPos(end);
      newRaw = newRaw.slice(0, rawStart) + newRaw.slice(rawEnd);
      rawPos = rawStart;
    }

    // Insert
    newRaw = newRaw.slice(0, rawPos) + charsToInsert + newRaw.slice(rawPos);
    // Trim to max length
    newRaw = newRaw.slice(0, editableSlots.value.length);

    displayValue.value = rawToDisplay(newRaw);
    emitValues(newRaw);

    // Set cursor after inserted chars
    const newCursorRaw = rawPos + charsToInsert.length;
    const newCursorDisplay = rawIndexToDisplayIndex(newCursorRaw);
    setCursor(nextEditablePos(newCursorDisplay));
  } else if (
    e.inputType === "deleteContentBackward" ||
    e.inputType === "deleteContentForward"
  ) {
    let rawStart = displayPosToRawPos(start);
    let rawEnd = displayPosToRawPos(end);

    if (start === end) {
      // No selection — delete one char
      if (e.inputType === "deleteContentBackward") {
        if (rawStart > 0) {
          rawStart--;
        } else {
          return;
        }
      } else {
        if (rawEnd < currentRaw.length) {
          rawEnd++;
        } else {
          return;
        }
      }
    }

    const newRaw = currentRaw.slice(0, rawStart) + currentRaw.slice(rawEnd);
    displayValue.value = rawToDisplay(newRaw);
    emitValues(newRaw);

    const cursorDisplay = rawIndexToDisplayIndex(rawStart);
    if (e.inputType === "deleteContentBackward") {
      setCursor(cursorDisplay);
    } else {
      setCursor(nextEditablePos(cursorDisplay));
    }
  } else if (e.inputType === "insertFromPaste") {
    const pasted = e.data ?? "";
    let rawPos = displayPosToRawPos(start);

    // Remove selected range
    let newRaw = currentRaw;
    if (start !== end) {
      const rawEnd = displayPosToRawPos(end);
      newRaw = newRaw.slice(0, rawPos) + newRaw.slice(rawEnd);
    }

    // Filter pasted content
    const filtered = filterInputFromPosition(pasted, rawPos);
    newRaw = newRaw.slice(0, rawPos) + filtered + newRaw.slice(rawPos);
    newRaw = newRaw.slice(0, editableSlots.value.length);

    displayValue.value = rawToDisplay(newRaw);
    emitValues(newRaw);

    const newCursorRaw = rawPos + filtered.length;
    setCursor(rawIndexToDisplayIndex(newCursorRaw));
  }
}

// Convert a display cursor position to a raw value position
function displayPosToRawPos(displayPos: number): number {
  let rawPos = 0;
  for (const slot of maskSlots.value) {
    if (slot.index >= displayPos) break;
    if (slot.isToken) rawPos++;
  }
  return rawPos;
}

// Filter input characters starting from a specific raw position
function filterInputAtPosition(input: string, startRawPos: number): string {
  let result = "";
  let slotIdx = startRawPos;
  for (const ch of input) {
    if (slotIdx >= editableSlots.value.length) break;
    const slot = editableSlots.value[slotIdx];
    if (slot.pattern?.test(ch)) {
      result += ch;
      slotIdx++;
    }
  }
  return result;
}

// Filter pasted content from a position
function filterInputFromPosition(input: string, startRawPos: number): string {
  return filterInputAtPosition(input, startRawPos);
}

function emitValues(raw: string) {
  emit("update:modelValue", raw);
  emit("update:formattedValue", rawToDisplay(raw));
}

// Find the display position just after the last filled character
function lastFilledPos(): number {
  const raw = displayToRaw(displayValue.value);
  if (raw.length === 0) return nextEditablePos(0);
  return rawIndexToDisplayIndex(raw.length);
}

// Handle click — snap cursor to the end of filled content if clicked past it
function onClick() {
  const el = getInputEl();
  if (!el) return;
  const pos = el.selectionStart ?? 0;
  const lastFilled = lastFilledPos();

  if (pos > lastFilled) {
    // Clicked past the filled area — snap to end of content
    setCursor(lastFilled);
  } else {
    // Clicked within filled area — snap to nearest editable position
    const snapped = nextEditablePos(pos);
    if (snapped > lastFilled) {
      setCursor(lastFilled);
    } else if (snapped !== pos) {
      setCursor(snapped);
    }
  }
}

// Handle clear
function onClear() {
  displayValue.value = rawToDisplay("");
  emitValues("");
  setCursor(nextEditablePos(0));
}

// Focus handler — snap to end of filled content
function onFocus() {
  if (!displayValue.value || displayValue.value === rawToDisplay("")) {
    displayValue.value = rawToDisplay("");
  }
  setCursor(lastFilledPos());
}

defineExpose({
  el: inputRef,
  formattedValue,
  focus: () => (inputRef.value as any)?.focus(),
  blur: () => (inputRef.value as any)?.blur(),
});
</script>

<template>
  <CuiInput
    v-show="!hidden"
    ref="maskedInputRef"
    :model-value="displayValue"
    type="text"
    :placeholder="placeholder"
    :color="color"
    :size="size"
    :clearable="clearable"
    :error="error"
    :error-message="errorMessage"
    :disabled="disabled"
    :readonly="readonly"
    @beforeinput="onBeforeInput"
    @click="onClick"
    @focusin="onFocus"
    @clear="onClear"
  >
    <template v-if="$slots.prefix" #prefix>
      <slot name="prefix" />
    </template>
    <template v-if="$slots.suffix" #suffix>
      <slot name="suffix" />
    </template>
    <template v-if="$slots['prefix-button']" #prefix-button>
      <slot name="prefix-button" />
    </template>
    <template v-if="$slots['suffix-button']" #suffix-button>
      <slot name="suffix-button" />
    </template>
  </CuiInput>
</template>

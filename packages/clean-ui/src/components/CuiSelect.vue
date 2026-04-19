<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from "vue";
import type { ButtonColor } from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";
import type { InputSize } from "./CuiInput.vue";
import { INPUT_SIZE_SCALE } from "../utils/sizing";

export interface SelectOption {
  value: string | number;
  label: string;
  icon?: string;
  group?: string;
  disabled?: boolean;
}

export interface CuiSelectProps {
  /** Selected value (single) or values (multiple) */
  modelValue?: string | number | null | Array<string | number>;
  /** Options — array of strings or { value, label, group?, disabled? } objects */
  options?: Array<string | number | SelectOption>;
  /** Allow multiple selections */
  multiple?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Show clear button */
  clearable?: boolean;
  /** Show loading spinner in dropdown */
  loading?: boolean;
  /** Text shown when no options available */
  noOptionsText?: string;
  /** Color role */
  color?: ButtonColor;
  /** Size */
  size?: InputSize;
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

const props = withDefaults(defineProps<CuiSelectProps>(), {
  options: () => [],
  multiple: false,
  placeholder: "Select...",
  clearable: false,
  loading: false,
  noOptionsText: "No options available",
  color: "primary",
  size: "md",
  error: false,
  disabled: false,
  readonly: false,
  hidden: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string | number | null | Array<string | number>];
}>();

// Normalize options to SelectOption[]
const normalizedOptions = computed<SelectOption[]>(() =>
  props.options.map((opt) =>
    typeof opt === "object" ? opt : { value: opt, label: String(opt) },
  ),
);

// Group options
const groupedOptions = computed(() => {
  const groups = new Map<string, SelectOption[]>();
  const ungrouped: SelectOption[] = [];

  for (const opt of normalizedOptions.value) {
    if (opt.group) {
      if (!groups.has(opt.group)) groups.set(opt.group, []);
      groups.get(opt.group)!.push(opt);
    } else {
      ungrouped.push(opt);
    }
  }

  const result: Array<{ group?: string; options: SelectOption[] }> = [];
  if (ungrouped.length) result.push({ options: ungrouped });
  for (const [group, options] of groups) {
    result.push({ group, options });
  }
  return result;
});

// Flat list of non-disabled options for keyboard nav
const navigableOptions = computed(() =>
  normalizedOptions.value.filter((o) => !o.disabled),
);

// State
const isOpen = ref(false);
const highlightedIndex = ref(-1);
const triggerRef = ref<HTMLElement>();
const dropdownRef = ref<HTMLElement>();

// Selection helpers
function isSelected(value: string | number): boolean {
  if (props.multiple) {
    return Array.isArray(props.modelValue) && props.modelValue.includes(value);
  }
  return props.modelValue === value;
}

function getSelectedLabels(): string[] {
  if (props.multiple && Array.isArray(props.modelValue)) {
    return props.modelValue.map((v) => {
      const opt = normalizedOptions.value.find((o) => o.value === v);
      return opt?.label ?? String(v);
    });
  }
  if (props.modelValue != null) {
    const opt = normalizedOptions.value.find((o) => o.value === props.modelValue);
    return opt ? [opt.label] : [String(props.modelValue)];
  }
  return [];
}

const selectedLabels = computed(getSelectedLabels);
const hasValue = computed(() => {
  if (props.multiple) return Array.isArray(props.modelValue) && props.modelValue.length > 0;
  return props.modelValue != null && props.modelValue !== "";
});

// Get the full selected option object (for #selected slot)
const selectedOption = computed(() => {
  if (props.multiple || props.modelValue == null) return null;
  return normalizedOptions.value.find((o) => o.value === props.modelValue) ?? null;
});

// Actions
function toggleOpen() {
  if (props.disabled || props.readonly) return;
  if (isOpen.value) {
    close();
  } else {
    open();
  }
}

function open() {
  if (props.disabled || props.readonly) return;
  isOpen.value = true;
  highlightedIndex.value = -1;
  nextTick(() => {
    positionDropdown();
    // Highlight current selection
    if (!props.multiple && props.modelValue != null) {
      const idx = navigableOptions.value.findIndex((o) => o.value === props.modelValue);
      if (idx >= 0) highlightedIndex.value = idx;
    }
  });
}

function close() {
  isOpen.value = false;
  highlightedIndex.value = -1;
}

function selectOption(opt: SelectOption) {
  if (opt.disabled) return;

  if (props.multiple) {
    const current = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
    const idx = current.indexOf(opt.value);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(opt.value);
    }
    emit("update:modelValue", current);
  } else {
    emit("update:modelValue", opt.value);
    close();
  }
}

function removeChip(value: string | number) {
  if (props.disabled || props.readonly) return;
  if (props.multiple && Array.isArray(props.modelValue)) {
    emit("update:modelValue", props.modelValue.filter((v) => v !== value));
  }
}

function clear() {
  if (props.disabled || props.readonly) return;
  emit("update:modelValue", props.multiple ? [] : null);
}

// Keyboard navigation
function onKeydown(e: KeyboardEvent) {
  if (props.disabled || props.readonly) return;

  if (!isOpen.value) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
    return;
  }

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      highlightedIndex.value = Math.min(
        highlightedIndex.value + 1,
        navigableOptions.value.length - 1,
      );
      scrollToHighlighted();
      break;
    case "ArrowUp":
      e.preventDefault();
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0);
      scrollToHighlighted();
      break;
    case "Enter":
    case " ":
      e.preventDefault();
      if (highlightedIndex.value >= 0 && highlightedIndex.value < navigableOptions.value.length) {
        selectOption(navigableOptions.value[highlightedIndex.value]);
      }
      break;
    case "Escape":
      e.preventDefault();
      close();
      triggerRef.value?.focus();
      break;
    case "Home":
      e.preventDefault();
      highlightedIndex.value = 0;
      scrollToHighlighted();
      break;
    case "End":
      e.preventDefault();
      highlightedIndex.value = navigableOptions.value.length - 1;
      scrollToHighlighted();
      break;
  }
}

function scrollToHighlighted() {
  nextTick(() => {
    const el = dropdownRef.value?.querySelector("[data-highlighted]");
    el?.scrollIntoView({ block: "nearest" });
  });
}

// Click outside
function onClickOutside(e: MouseEvent) {
  const target = e.target as Node;
  if (
    triggerRef.value?.contains(target) ||
    dropdownRef.value?.contains(target)
  ) {
    return;
  }
  close();
}

function onScrollOrResize() {
  if (isOpen.value) positionDropdown();
}

onMounted(() => {
  document.addEventListener("mousedown", onClickOutside);
  window.addEventListener("scroll", onScrollOrResize, true);
  window.addEventListener("resize", onScrollOrResize);
});

onUnmounted(() => {
  document.removeEventListener("mousedown", onClickOutside);
  window.removeEventListener("scroll", onScrollOrResize, true);
  window.removeEventListener("resize", onScrollOrResize);
});

// Dropdown positioning
const dropdownStyle = ref<Record<string, string>>({});

function positionDropdown() {
  if (!triggerRef.value) return;
  const rect = triggerRef.value.getBoundingClientRect();
  const vh = window.innerHeight;
  const spaceBelow = vh - rect.bottom;
  const dropAbove = spaceBelow < 200 && rect.top > spaceBelow;
  const maxH = Math.min(dropAbove ? rect.top - 16 : spaceBelow - 16, 300);

  dropdownStyle.value = {
    position: "fixed",
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    maxHeight: `${maxH}px`,
    zIndex: "9990",
    ...(dropAbove
      ? { bottom: `${vh - rect.top + 4}px` }
      : { top: `${rect.bottom + 4}px` }),
  };
}

// Expose
defineExpose({
  el: triggerRef,
  focus: () => triggerRef.value?.focus(),
  blur: () => triggerRef.value?.blur(),
  open,
  close,
});

const dims = computed(() => {
  const s = INPUT_SIZE_SCALE[props.size];
  return { minHeight: s.height, px: s.px, fontSize: s.fontSize };
});
</script>

<template>
  <div v-show="!hidden" class="cui-select-wrapper">
    <div
      class="cui-select"
      :class="{
        'cui-select--open': isOpen,
        'cui-select--error': error,
        'cui-select--disabled': disabled,
      }"
      :style="{
        '--_sel-min-height': dims.minHeight,
        '--_sel-px': dims.px,
        '--_sel-font-size': dims.fontSize,
        '--_sel-color': `var(--cui-${color})`,
        '--_sel-focus-ring': `var(--cui-${color}-focus-ring)`,
        '--_sel-border': error ? 'var(--cui-error)' : `var(--cui-border-strong)`,
        '--_sel-focus-border': error ? 'var(--cui-error)' : `var(--cui-${color})`,
      }"
    >
      <!-- Trigger -->
      <div
        ref="triggerRef"
        class="cui-select__trigger"
        role="combobox"
        :aria-expanded="isOpen"
        aria-haspopup="listbox"
        :aria-disabled="disabled || readonly || undefined"
        :aria-invalid="error || undefined"
        :tabindex="disabled ? -1 : 0"
        @click="toggleOpen"
        @keydown="onKeydown"
      >
        <!-- Selected value(s) -->
        <div class="cui-select__value">
          <!-- Multi: chips -->
          <template v-if="multiple && Array.isArray(modelValue) && modelValue.length > 0">
            <span
              v-for="val in modelValue"
              :key="String(val)"
              class="cui-select__chip"
            >
              {{ normalizedOptions.find((o) => o.value === val)?.label ?? val }}
              <button
                type="button"
                class="cui-select__chip-remove"
                tabindex="-1"
                aria-label="Remove"
                @click.stop="removeChip(val)"
              >
                <CuiIcon name="x" size="0.75rem" />
              </button>
            </span>
          </template>
          <!-- Single: label (with #selected slot) -->
          <template v-else-if="!multiple && hasValue">
            <span class="cui-select__label">
              <slot name="selected" :option="selectedOption">
                <CuiIcon v-if="selectedOption?.icon" :name="selectedOption.icon" size="sm" class="cui-select__option-icon" />
                {{ selectedLabels[0] }}
              </slot>
            </span>
          </template>
          <!-- Placeholder -->
          <template v-else>
            <span class="cui-select__placeholder">{{ placeholder }}</span>
          </template>
        </div>

        <!-- Actions -->
        <div class="cui-select__actions">
          <button
            v-if="clearable && hasValue && !disabled && !readonly"
            type="button"
            class="cui-select__clear"
            tabindex="-1"
            aria-label="Clear"
            @click.stop="clear"
          >
            <CuiIcon name="x" size="0.75rem" />
          </button>
          <CuiIcon name="caret-down" size="1rem" class="cui-select__chevron" :class="{ 'cui-select__chevron--open': isOpen }" />
        </div>
      </div>

    </div>

    <!-- Dropdown (teleported to body to escape overflow: clip on ancestors) -->
    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="dropdownRef"
        class="cui-select__dropdown"
        role="listbox"
        :aria-multiselectable="multiple || undefined"
        :style="dropdownStyle"
      >
        <!-- Loading -->
        <div v-if="loading" class="cui-select__loading">
          <CuiIcon name="spinner-gap" size="1rem" class="cui-select__spinner" />
          Loading...
        </div>

        <!-- Empty -->
        <div v-else-if="normalizedOptions.length === 0" class="cui-select__empty">
          {{ noOptionsText }}
        </div>

        <!-- Options -->
        <template v-else>
          <template v-for="section in groupedOptions" :key="section.group ?? '__ungrouped'">
            <div v-if="section.group" class="cui-select__group-header">
              {{ section.group }}
            </div>
            <div
              v-for="opt in section.options"
              :key="String(opt.value)"
              class="cui-select__option"
              :class="{
                'cui-select__option--selected': isSelected(opt.value),
                'cui-select__option--highlighted': navigableOptions[highlightedIndex]?.value === opt.value,
                'cui-select__option--disabled': opt.disabled,
              }"
              :data-highlighted="navigableOptions[highlightedIndex]?.value === opt.value ? '' : undefined"
              role="option"
              :aria-selected="isSelected(opt.value)"
              :aria-disabled="opt.disabled || undefined"
              @click="selectOption(opt)"
              @mouseenter="highlightedIndex = navigableOptions.findIndex((o) => o.value === opt.value)"
            >
              <!-- Checkbox for multi-select only -->
              <span v-if="multiple" class="cui-select__check">
                <CuiIcon v-if="isSelected(opt.value)" name="check" size="1rem" />
              </span>
              <span class="cui-select__option-label">
                <slot name="option" :option="opt">
                  <CuiIcon v-if="opt.icon" :name="opt.icon" size="sm" class="cui-select__option-icon" />
                  {{ opt.label }}
                </slot>
              </span>
            </div>
          </template>
        </template>
      </div>
    </Teleport>

    <!-- Error message -->
    <div v-if="error && errorMessage" class="cui-select__error">
      {{ errorMessage }}
    </div>
  </div>
</template>

<style scoped>
.cui-select-wrapper {
  display: flex;
  flex-direction: column;
}

.cui-select {
  position: relative;
}

/* --- Trigger --- */
.cui-select__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: var(--_sel-min-height);
  padding: 0.25rem var(--_sel-px);
  border-radius: var(--cui-button-radius, 0.375rem);
  border: 1px solid var(--_sel-border);
  background: var(--cui-surface-base);
  font-size: var(--_sel-font-size);
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  gap: 0.5rem;
  user-select: none;
}

.cui-select__trigger:focus-visible {
  outline: none;
  border-color: var(--_sel-focus-border);
  box-shadow: 0 0 0 2px var(--_sel-focus-ring);
}

.cui-select--open .cui-select__trigger {
  border-color: var(--_sel-focus-border);
  box-shadow: 0 0 0 2px var(--_sel-focus-ring);
}

.cui-select--error .cui-select__trigger {
  border-color: var(--cui-error);
}

.cui-select--error .cui-select__trigger:focus-visible,
.cui-select--error.cui-select--open .cui-select__trigger {
  box-shadow: 0 0 0 2px var(--cui-error-focus-ring);
}

.cui-select--disabled .cui-select__trigger {
  opacity: 0.5;
  cursor: not-allowed;
}

/* --- Value area --- */
.cui-select__value {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
  min-height: calc(var(--_sel-min-height) - 0.75rem);
}

.cui-select__label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--cui-text-body);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cui-select__placeholder {
  color: var(--cui-text-tertiary);
}

/* --- Chips (multi-select) --- */
.cui-select__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  background: var(--color-surface-100);
  color: var(--cui-text-body);
  font-size: 0.8125em;
  line-height: 1.4;
}

:where(.dark, .dark *) .cui-select__chip {
  background: var(--color-surface-800);
}

.cui-select__chip-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--cui-text-tertiary);
  padding: 0;
  border-radius: 50%;
  width: 0.875rem;
  height: 0.875rem;
  transition: color 0.15s ease;
}

.cui-select__chip-remove:hover {
  color: var(--cui-text-body);
}

/* --- Actions (clear + chevron) --- */
.cui-select__actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.cui-select__clear {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--cui-text-tertiary);
  padding: 0;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  transition: color 0.15s ease, background 0.15s ease;
}

.cui-select__clear:hover {
  color: var(--cui-text-body);
  background: var(--color-surface-200);
}

:where(.dark, .dark *) .cui-select__clear:hover {
  background: var(--color-surface-700);
}

.cui-select__chevron {
  color: var(--cui-text-tertiary);
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.cui-select__chevron--open {
  transform: rotate(180deg);
}

/* --- Dropdown --- */
.cui-select__dropdown {
  z-index: 50;
  overflow-y: auto;
  border-radius: var(--cui-button-radius, 0.375rem);
  border: 1px solid var(--cui-border);
  background: var(--cui-surface-base);
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.1);
  padding: 0.25rem;
}

:where(.dark, .dark *) .cui-select__dropdown {
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.3);
}

/* --- Loading / Empty --- */
.cui-select__loading,
.cui-select__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  font-size: 0.875rem;
  color: var(--cui-text-secondary);
}

.cui-select__spinner {
  animation: cui-spin 0.6s linear infinite;
}

/* cui-spin keyframe defined in main.css */

/* --- Group header --- */
.cui-select__group-header {
  padding: 0.5rem 0.5rem 0.25rem;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--cui-text-tertiary);
}

/* --- Option --- */
.cui-select__option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: var(--_sel-font-size);
  color: var(--cui-text-body);
  transition: background 0.1s ease;
}

.cui-select__option:hover,
.cui-select__option--highlighted {
  background: var(--color-surface-100);
}

:where(.dark, .dark *) .cui-select__option:hover,
:where(.dark, .dark *) .cui-select__option--highlighted {
  background: var(--color-surface-800);
}

.cui-select__option--selected {
  color: var(--_sel-color);
  font-weight: 500;
}

.cui-select__option--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.cui-select__option--disabled:hover {
  background: transparent;
}

/* --- Option icon --- */
.cui-select__option-icon {
  flex-shrink: 0;
}

/* --- Check mark --- */
.cui-select__check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.cui-select__option-label {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  min-width: 0;
}

/* --- Error --- */
.cui-select__error {
  font-size: 0.8125rem;
  margin-top: 0.375rem;
  color: var(--cui-error);
}
</style>

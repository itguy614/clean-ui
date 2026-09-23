<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import type { CuiColor, CuiSize, HideableProps, ColorableProps, SizeableProps, DisableableProps, CuiRounded, NativeControlProps } from "../types/common";
import { INPUT_SIZE_SCALE, nestedSize, scaleDensity } from "../utils/sizing";
import CuiIcon from "./CuiIcon.vue";
import CuiBadge from "./CuiBadge.vue";
import CuiSpinner from "./CuiSpinner.vue";

export interface TagOption {
  value: string;
  label?: string;
  color?: CuiColor;
  [key: string]: unknown;
}

export interface CuiTagInputProps extends NativeControlProps, HideableProps, ColorableProps, SizeableProps, DisableableProps {
  /** Selected tags */
  modelValue?: string[];
  /** Predefined tag suggestions */
  suggestions?: TagOption[];
  /** Async search for suggestions */
  fetchSuggestions?: (query: string) => Promise<TagOption[]>;
  /** Allow creating new tags not in the suggestions list */
  allowCreate?: boolean;
  /** Debounce delay for async search (ms) */
  debounce?: number;
  /** Minimum characters before searching */
  minChars?: number;
  /** Maximum number of tags allowed (0 = unlimited) */
  maxTags?: number;
  /** Placeholder */
  placeholder?: string;
  /** Label */
  label?: string;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** No suggestions text */
  noSuggestionsText?: string;
  /** Text shown when allowCreate and no match found */
  createText?: string;
  /** Hidden */
  hidden?: boolean;
  /** Border radius */
  rounded?: CuiRounded;
}

const props = withDefaults(defineProps<CuiTagInputProps>(), {
  modelValue: () => [],
  suggestions: () => [],
  allowCreate: true,
  debounce: 300,
  minChars: 0,
  maxTags: 0,
  placeholder: "Add tag...",
  size: "md",
  color: "primary",
  disabled: false,
  error: false,
  noSuggestionsText: "No suggestions",
  createText: "Create",
  rounded: "md",
  hidden: false,
});

const radiusMap: Record<CuiRounded, string> = {
  none: "0",
  sm: "0.25rem",
  md: "var(--cui-button-radius, 0.375rem)",
  lg: "0.5rem",
  full: "9999px",
};

const emit = defineEmits<{
  "update:modelValue": [value: string[]];
}>();

const query = ref("");
const isOpen = ref(false);
const focusedIndex = ref(-1);
const internalLoading = ref(false);
const asyncSuggestions = ref<TagOption[]>([]);
const inputRef = ref<HTMLInputElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);
const wrapperRef = ref<HTMLElement | null>(null);
const controlRef = ref<HTMLElement | null>(null);
const dropdownStyle = ref<Record<string, string>>({});
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const selectedSet = computed(() => new Set(props.modelValue));
const atMax = computed(() => props.maxTags > 0 && props.modelValue.length >= props.maxTags);

// Resolve tag display
function tagLabel(value: string): string {
  const opt = [...props.suggestions, ...asyncSuggestions.value].find((s) => s.value === value);
  return opt?.label ?? value;
}

function tagColor(value: string): CuiColor {
  const opt = [...props.suggestions, ...asyncSuggestions.value].find((s) => s.value === value);
  return opt?.color ?? props.color;
}

// Filtered suggestions
const filteredSuggestions = computed(() => {
  const source = props.fetchSuggestions ? asyncSuggestions.value : props.suggestions;
  const available = source.filter((s) => !selectedSet.value.has(s.value));
  if (!query.value || props.fetchSuggestions) return available;
  const q = query.value.toLowerCase();
  return available.filter((s) =>
    s.value.toLowerCase().includes(q) || (s.label && s.label.toLowerCase().includes(q)),
  );
});

// Can create a new tag?
const canCreate = computed(() => {
  if (!props.allowCreate || !query.value.trim() || atMax.value) return false;
  const q = query.value.trim().toLowerCase();
  // Don't offer create if it already exists as a tag or suggestion
  if (selectedSet.value.has(q) || selectedSet.value.has(query.value.trim())) return false;
  const allValues = [...props.suggestions, ...asyncSuggestions.value].map((s) => s.value.toLowerCase());
  return !allValues.includes(q);
});

const isLoading = computed(() => internalLoading.value);

// Size config
// From the shared scale, so a tag input lines up with a CuiInput or CuiSelect of the same
// size. The private table it replaces had different metrics, only sm|md|lg, and an
// `inputHeight` that was never density-scaled at all (#123).
const cfg = computed(() => {
  const s = INPUT_SIZE_SCALE[props.size];
  // Grows with its tag rows, so the scale height is a floor; the reduced vertical padding
  // leaves room for the chips.
  const py = scaleDensity("0.25rem");
  return {
    tagSize: nestedSize(props.size),
    style: {
      "--_tag-input-font-size": s.fontSize,
      "--_tag-input-padding": `${py} ${s.px}`,
      "--_tag-input-min-height": s.height,
    },
  };
});

// Dropdown positioning
function updateDropdownPosition() {
  // The CONTROL, not the wrapper — the wrapper also holds the label above and
  // the error message below, so anchoring to it left a label-sized gap between
  // the field and the panel. See CuiSelect, which measures its trigger.
  const anchor = controlRef.value ?? wrapperRef.value;
  if (!anchor) return;
  const rect = anchor.getBoundingClientRect();
  const vh = window.innerHeight;
  const spaceBelow = vh - rect.bottom;
  const spaceAbove = rect.top;
  const openAbove = spaceBelow < 200 && spaceAbove > spaceBelow;
  // Bound by the side actually being opened to, not the roomier one.
  const maxH = Math.max(0, Math.min(240, (openAbove ? spaceAbove : spaceBelow) - 16));

  const s: Record<string, string> = {
    // The panel is teleported to <body>, so it inherits nothing from the component — it
    // has to carry the size-derived properties itself (#123).
    ...cfg.value.style,
    position: "fixed",
    zIndex: "9990",
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    maxHeight: `${maxH}px`,
    // Only the geometry the positioner computes stays inline; the panel's paint lives in
    // the stylesheet so it can be themed (#123).
  };

  if (openAbove) s.bottom = `${vh - rect.top + 4}px`;
  else s.top = `${rect.bottom + 4}px`;

  dropdownStyle.value = s;
}

// Input handler
function onInput(e: Event) {
  query.value = (e.target as HTMLInputElement).value;
  focusedIndex.value = -1;
  if (!isOpen.value) { isOpen.value = true; updateDropdownPosition(); }

  if (props.fetchSuggestions) {
    if (query.value.length < props.minChars) { asyncSuggestions.value = []; return; }
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      internalLoading.value = true;
      try {
        asyncSuggestions.value = await props.fetchSuggestions!(query.value);
      } finally {
        internalLoading.value = false;
      }
    }, props.debounce);
  }
}

// Add tag
function addTag(value: string) {
  if (props.disabled || atMax.value) return;
  const trimmed = value.trim();
  if (!trimmed || selectedSet.value.has(trimmed)) return;
  emit("update:modelValue", [...props.modelValue, trimmed]);
  query.value = "";
  focusedIndex.value = -1;
  nextTick(() => inputRef.value?.focus());
}

function selectSuggestion(suggestion: TagOption) {
  addTag(suggestion.value);
}

function createTag() {
  if (canCreate.value) addTag(query.value.trim());
}

function removeTag(value: string) {
  if (props.disabled) return;
  emit("update:modelValue", props.modelValue.filter((v) => v !== value));
  nextTick(() => inputRef.value?.focus());
}

// Keyboard
function onKeydown(e: KeyboardEvent) {
  const totalItems = filteredSuggestions.value.length + (canCreate.value ? 1 : 0);

  if (e.key === "ArrowDown") {
    e.preventDefault();
    if (!isOpen.value) { isOpen.value = true; updateDropdownPosition(); return; }
    focusedIndex.value = Math.min(focusedIndex.value + 1, totalItems - 1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    focusedIndex.value = Math.max(focusedIndex.value - 1, 0);
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (focusedIndex.value >= 0 && focusedIndex.value < filteredSuggestions.value.length) {
      selectSuggestion(filteredSuggestions.value[focusedIndex.value]);
    } else if (canCreate.value && (focusedIndex.value === filteredSuggestions.value.length || focusedIndex.value === -1)) {
      createTag();
    } else if (canCreate.value && query.value.trim()) {
      createTag();
    }
  } else if (e.key === "," || e.key === "Tab") {
    if (query.value.trim() && props.allowCreate) {
      e.preventDefault();
      createTag();
    }
  } else if (e.key === "Escape") {
    isOpen.value = false;
  } else if (e.key === "Backspace" && !query.value && props.modelValue.length > 0) {
    removeTag(props.modelValue[props.modelValue.length - 1]);
  }
}

// Click outside
function onClickOutside(e: MouseEvent) {
  const target = e.target as Node;
  if (wrapperRef.value?.contains(target)) return;
  if (dropdownRef.value?.contains(target)) return;
  isOpen.value = false;
}

function onFocus() {
  if (!props.disabled && !atMax.value) {
    isOpen.value = true;
    updateDropdownPosition();
  }
}

onMounted(() => {
  document.addEventListener("mousedown", onClickOutside);
  window.addEventListener("scroll", () => { if (isOpen.value) updateDropdownPosition(); }, true);
  window.addEventListener("resize", () => { if (isOpen.value) updateDropdownPosition(); });
});
onUnmounted(() => {
  document.removeEventListener("mousedown", onClickOutside);
  if (debounceTimer) clearTimeout(debounceTimer);
});

watch(isOpen, (open) => {
  if (!open) query.value = "";
  if (open) nextTick(updateDropdownPosition);
});

// Expose imperative handle
function focus(opts?: FocusOptions) {
  if (inputRef.value) inputRef.value.focus(opts);
  else wrapperRef.value?.focus(opts);
}

function blur() {
  inputRef.value?.blur();
}

defineExpose({ el: wrapperRef, focus, blur });
</script>

<template>
  <!-- Size-derived properties on the ROOT: the dropdown is a sibling of the control, so
       anything set on the control would never reach the suggestions. -->
  <div class="cui-tag-input" v-show="!hidden" ref="wrapperRef" :style="cfg.style">
    <label
      v-if="label"
      class="cui-tag-input__label"
    >{{ label }}</label>

    <!-- Input area -->
    <div
      ref="controlRef"
      class="cui-tag-input__control"
      :class="{ 'cui-tag-input__control--disabled': disabled }"
      :style="{
        '--_tag-input-radius': radiusMap[rounded],
        '--_tag-input-border': error ? 'var(--cui-error)' : 'var(--cui-border-strong, var(--cui-border))',
      }"
      @click="inputRef?.focus()"
    >
      <!-- Tags -->
      <CuiBadge
        v-for="tag in modelValue"
        :key="tag"
        :color="tagColor(tag)"
        :size="cfg.tagSize"
        removable
        @remove="removeTag(tag)"
      >
        {{ tagLabel(tag) }}
      </CuiBadge>

      <!-- Input -->
      <input
        :id="id"
        :name="name"
        :autocomplete="autocomplete"
        :aria-describedby="ariaDescribedby"
        :aria-labelledby="ariaLabelledby"
        v-if="!atMax"
        ref="inputRef"
        :value="query"
        :placeholder="modelValue.length > 0 ? '' : placeholder"
        :disabled="disabled"
        class="cui-tag-input__input"
        @input="onInput"
        @focus="onFocus"
        @keydown="onKeydown"
      />
    </div>

    <!-- Error -->
    <div v-if="error && errorMessage" class="cui-tag-input__error">
      {{ errorMessage }}
    </div>

    <!-- Dropdown -->
    <Teleport to="body">
      <div
        v-if="isOpen && (filteredSuggestions.length > 0 || canCreate || isLoading)"
        ref="dropdownRef"
        class="cui-tag-input__dropdown"
        :style="dropdownStyle"
      >
        <!-- Loading -->
        <div v-if="isLoading && filteredSuggestions.length === 0" :style="{ padding: 'calc(0.75rem * var(--cui-density-scale, 1))', textAlign: 'center' }">
          <CuiSpinner size="xs" show-label label="Searching..." />
        </div>

        <!-- Suggestions -->
        <div
          v-for="(suggestion, i) in filteredSuggestions"
          :key="suggestion.value"
          :data-index="i"
          class="cui-tag-input__suggestion"
          :class="{ 'cui-tag-input__suggestion--focused': focusedIndex === i }"
          @click.stop="selectSuggestion(suggestion)"
          @mouseenter="focusedIndex = i"
        >
          <slot name="suggestion" :suggestion="suggestion">
            <span>{{ suggestion.label || suggestion.value }}</span>
          </slot>
        </div>

        <!-- Create new -->
        <div
          v-if="canCreate"
          class="cui-tag-input__create"
          :class="{
            'cui-tag-input__suggestion--focused': focusedIndex === filteredSuggestions.length,
            'cui-tag-input__create--divided': filteredSuggestions.length > 0,
          }"
          @click.stop="createTag"
          @mouseenter="focusedIndex = filteredSuggestions.length"
        >
          <CuiIcon name="plus" size="0.75rem" />
          <span>{{ createText }} &ldquo;{{ query.trim() }}&rdquo;</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* --- Themeable ---
   Zero specificity, so a consumer's own rule wins without `!important`. See the note in
   CuiButton.vue. The private values come from the style binding; a public token set
   anywhere in the ancestor chain takes precedence (#123). */
:where(.cui-tag-input__control) {
  min-height: var(--cui-tag-input-min-height, var(--_tag-input-min-height));
  padding: var(--cui-tag-input-padding, var(--_tag-input-padding));
  border-radius: var(--cui-tag-input-radius, var(--_tag-input-radius));
  border: var(--cui-tag-input-border-width, 1px) solid var(--_tag-input-border);
  background: var(--cui-tag-input-bg, var(--cui-surface-base, white));
  font-size: var(--cui-tag-input-font-size, var(--_tag-input-font-size));
}

:where(.cui-tag-input__dropdown) {
  background: var(--cui-tag-input-panel-bg, var(--cui-surface-base));
  border: var(--cui-tag-input-panel-border, 1px solid var(--cui-border));
  border-radius: var(--cui-tag-input-panel-radius, 0.5rem);
  box-shadow: var(
    --cui-tag-input-panel-shadow,
    0 8px 24px -4px rgba(0, 0, 0, 0.12),
    0 2px 8px -2px rgba(0, 0, 0, 0.08)
  );
  padding: var(--cui-tag-input-panel-padding, calc(0.25rem * var(--cui-density-scale, 1)));
}

:where(.cui-tag-input__suggestion, .cui-tag-input__create) {
  padding: var(
    --cui-tag-input-item-padding,
    calc(0.4375rem * var(--cui-density-scale, 1)) calc(0.625rem * var(--cui-density-scale, 1))
  );
  font-size: var(--cui-tag-input-font-size, var(--_tag-input-font-size));
  border-radius: var(--cui-tag-input-item-radius, 0.25rem);
}

:where(.cui-tag-input__suggestion) {
  color: var(--cui-tag-input-item-color, var(--cui-text-body));
}

:where(.cui-tag-input__suggestion--focused) {
  background: var(--cui-tag-input-item-focus-bg, var(--cui-primary-bg));
}

/* --- Structural --- */
.cui-tag-input {
  position: relative;
}

.cui-tag-input__label {
  display: block;
  margin-bottom: calc(0.25rem * var(--cui-density-scale, 1));
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--cui-text-secondary);
}

.cui-tag-input__control {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: calc(0.25rem * var(--cui-density-scale, 1));
  cursor: text;
}

.cui-tag-input__control--disabled {
  cursor: default;
  opacity: 0.5;
}

.cui-tag-input__input {
  flex: 1;
  min-width: 4rem;
  border: none;
  outline: none;
  background: transparent;
  padding: 0;
  font-family: inherit;
  font-size: var(--cui-tag-input-font-size, var(--_tag-input-font-size));
  color: var(--cui-tag-input-color, var(--cui-text-body));
  /* A determinate line-height, so the field's intrinsic height cannot push the control
     past the shared scale's height — see the matching note in CuiCombobox (#123). */
  line-height: 1.25;
}

.cui-tag-input__dropdown {
  overflow-y: auto;
}

.cui-tag-input__suggestion,
.cui-tag-input__create {
  display: flex;
  align-items: center;
  gap: calc(0.5rem * var(--cui-density-scale, 1));
  cursor: pointer;
  transition: background 0.1s ease;
}

.cui-tag-input__create {
  gap: calc(0.375rem * var(--cui-density-scale, 1));
  color: var(--cui-primary);
  font-weight: 500;
}

.cui-tag-input__create--divided {
  border-top: 1px solid color-mix(in srgb, var(--cui-border) 50%, transparent);
  margin-top: calc(0.125rem * var(--cui-density-scale, 1));
}

.cui-tag-input__error {
  font-size: 0.75rem;
  color: var(--cui-error);
  margin-top: calc(0.25rem * var(--cui-density-scale, 1));
}
</style>

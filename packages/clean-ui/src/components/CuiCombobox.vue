<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import type { ColorableProps, SizeableProps, DisableableProps, HideableProps, CuiRounded, NativeControlProps } from "../types/common";
import { INPUT_SIZE_SCALE, nestedSize, scaleDensity } from "../utils/sizing";
import CuiIcon from "./CuiIcon.vue";
import CuiBadge from "./CuiBadge.vue";
import { useMessages } from "../composables/useMessages";
import CuiSpinner from "./CuiSpinner.vue";

export interface ComboboxOption {
  /** Unique value */
  value: string | number;
  /** Display label */
  label: string;
  /** Optional description (second line) */
  description?: string;
  /** Optional icon name */
  icon?: string;
  /** Optional image URL (avatar) */
  image?: string;
  /** Disabled */
  disabled?: boolean;
  /** Any extra data the consumer wants to access in slots */
  [key: string]: unknown;
}

export interface CuiComboboxProps extends NativeControlProps, HideableProps, ColorableProps, SizeableProps, DisableableProps {
  /** Selected value(s) — string/number for single, array for multiple */
  modelValue?: string | number | (string | number)[] | null;
  /** Static options */
  options?: ComboboxOption[];
  /** Allow multiple selection */
  multiple?: boolean;
  /** Placeholder */
  placeholder?: string;
  /** Async search function — receives query, returns options */
  fetchOptions?: (query: string) => Promise<ComboboxOption[]>;
  /** Debounce delay for search (ms) */
  debounce?: number;
  /** Minimum characters before searching */
  minChars?: number;
  /** Maximum visible items before scrolling (controls dropdown height) */
  maxVisible?: number;
  /** Loading state (external) */
  loading?: boolean;
  /** Label */
  label?: string;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** No results text */
  noResultsText?: string;
  /** Border radius */
  rounded?: CuiRounded;
}

const props = withDefaults(defineProps<CuiComboboxProps>(), {
  options: () => [],
  multiple: false,
  placeholder: "Search...",
  debounce: 300,
  minChars: 0,
  maxVisible: 8,
  size: "md",
  color: "primary",
  disabled: false,
  loading: false,
  error: false,
  noResultsText: "No results found",
  rounded: "md",
  hidden: false,
});

const radiusMap: Record<CuiRounded, string> = {
  none: "0",
  sm: "var(--cui-radius-sm, 0.25rem)",
  md: "var(--cui-button-radius, var(--cui-radius-md, 0.375rem))",
  lg: "var(--cui-radius-lg, 0.5rem)",
  full: "9999px",
};

const emit = defineEmits<{
  "update:modelValue": [value: string | number | (string | number)[] | null];
  search: [query: string];
}>();

// State
const query = ref("");
const isOpen = ref(false);
const focusedIndex = ref(-1);
const internalLoading = ref(false);
const asyncOptions = ref<ComboboxOption[]>([]);
const inputRef = ref<HTMLInputElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);
const wrapperRef = ref<HTMLElement | null>(null);
const controlRef = ref<HTMLElement | null>(null);
const dropdownStyle = ref<Record<string, string>>({});
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// Selected values as Set
const selectedSet = computed(() => {
  if (props.modelValue == null) return new Set<string | number>();
  if (Array.isArray(props.modelValue)) return new Set(props.modelValue);
  return new Set([props.modelValue]);
});

// All known options (local + async) for resolving selected values
const allKnownOptions = ref<ComboboxOption[]>([]);

watch(() => props.options, (opts) => {
  for (const o of opts) {
    if (!allKnownOptions.value.find((k) => k.value === o.value)) {
      allKnownOptions.value.push(o);
    }
  }
}, { immediate: true });

watch(asyncOptions, (opts) => {
  for (const o of opts) {
    if (!allKnownOptions.value.find((k) => k.value === o.value)) {
      allKnownOptions.value.push(o);
    }
  }
});

// Selected option objects
const selectedOptions = computed(() =>
  [...selectedSet.value]
    .map((v) => allKnownOptions.value.find((o) => o.value === v))
    .filter(Boolean) as ComboboxOption[],
);

// Filtered options for display
const filteredOptions = computed(() => {
  const source = props.fetchOptions ? asyncOptions.value : props.options;
  if (!query.value || props.fetchOptions) return source;
  const q = query.value.toLowerCase();
  return source.filter((o) =>
    o.label.toLowerCase().includes(q) ||
    (o.description && o.description.toLowerCase().includes(q)),
  );
});

const isLoading = computed(() => props.loading || internalLoading.value);

// Size config — from the shared scale, so a combobox lines up with a CuiInput or
// CuiSelect of the same size. It used to carry a private table with different heights,
// paddings and font sizes, and only sm|md|lg (#123).
//
// The scale gives height, horizontal padding and font size. What it has no concept of is
// derived here rather than re-tabulated: vertical padding falls out of the height, the
// tag chips take `nestedSize`, and a dropdown item reuses the control's own padding.
/**
 * The control grows with its tag rows, so the scale's height is a floor rather than a
 * fixed height — and the chips inside need room, hence the reduced vertical padding.
 * Constant, so it is built once rather than per size change.
 */
const CHIP_ROW_PY = scaleDensity("0.25rem");

const cfg = computed(() => {
  const s = INPUT_SIZE_SCALE[props.size];
  return {
    tagSize: nestedSize(props.size),
    style: {
      "--_combobox-font-size": s.fontSize,
      "--_combobox-padding": `${CHIP_ROW_PY} ${s.px}`,
      "--_combobox-item-padding": `${scaleDensity("0.5rem")} ${s.px}`,
      "--_combobox-min-height": s.height,
    },
  };
});

// Dropdown positioning
function updateDropdownPosition() {
  // The CONTROL, not the wrapper. The wrapper also holds the label above the
  // control and the error message below it, so anchoring to it opened the panel
  // 4px above the *label* — a gap the height of the label, which read as the
  // dropdown detaching from the field. CuiSelect has always measured its
  // trigger; this matches it.
  const anchor = controlRef.value ?? wrapperRef.value;
  if (!anchor) return;
  const rect = anchor.getBoundingClientRect();
  const vh = window.innerHeight;
  const spaceBelow = vh - rect.bottom;
  const spaceAbove = rect.top;
  const openAbove = spaceBelow < 200 && spaceAbove > spaceBelow;
  // Bound by the side actually being opened to. Taking the roomier side
  // regardless let a panel opened upward be taller than the room above it, and
  // run off the top of the viewport.
  const maxH = Math.max(0, Math.min(320, (openAbove ? spaceAbove : spaceBelow) - 16));

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

  if (openAbove) {
    s.bottom = `${vh - rect.top + 4}px`;
  } else {
    s.top = `${rect.bottom + 4}px`;
  }

  dropdownStyle.value = s;
}

// Search
function onInput(e: Event) {
  query.value = (e.target as HTMLInputElement).value;
  focusedIndex.value = -1;
  if (!isOpen.value) openDropdown();

  emit("search", query.value);

  if (props.fetchOptions) {
    if (query.value.length < props.minChars) {
      asyncOptions.value = [];
      return;
    }
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      internalLoading.value = true;
      try {
        asyncOptions.value = await props.fetchOptions!(query.value);
      } finally {
        internalLoading.value = false;
      }
    }, props.debounce);
  }
}

// Selection
function selectOption(option: ComboboxOption) {
  if (option.disabled) return;

  if (props.multiple) {
    const current = new Set(selectedSet.value);
    if (current.has(option.value)) {
      current.delete(option.value);
    } else {
      current.add(option.value);
    }
    emit("update:modelValue", [...current]);
    query.value = "";
    nextTick(() => inputRef.value?.focus());
  } else {
    emit("update:modelValue", option.value);
    query.value = "";
    isOpen.value = false;
    inputRef.value?.blur();
  }
}

function removeTag(value: string | number) {
  if (props.disabled) return;
  const current = [...selectedSet.value];
  emit("update:modelValue", current.filter((v) => v !== value));
  nextTick(() => inputRef.value?.focus());
}

// Keyboard
function onKeydown(e: KeyboardEvent) {
  if (e.key === "ArrowDown") {
    e.preventDefault();
    if (!isOpen.value) { openDropdown(); return; }
    focusedIndex.value = Math.min(focusedIndex.value + 1, filteredOptions.value.length - 1);
    scrollToFocused();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    focusedIndex.value = Math.max(focusedIndex.value - 1, 0);
    scrollToFocused();
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (focusedIndex.value >= 0 && focusedIndex.value < filteredOptions.value.length) {
      selectOption(filteredOptions.value[focusedIndex.value]);
    }
  } else if (e.key === "Escape") {
    isOpen.value = false;
  } else if (e.key === "Backspace" && !query.value && props.multiple && selectedOptions.value.length > 0) {
    removeTag(selectedOptions.value[selectedOptions.value.length - 1].value);
  }
}

function scrollToFocused() {
  nextTick(() => {
    dropdownRef.value?.querySelector(`[data-index="${focusedIndex.value}"]`)?.scrollIntoView({ block: "nearest" });
  });
}

// Open/close
function openDropdown() {
  if (props.disabled) return;
  isOpen.value = true;
  updateDropdownPosition();
}

function onFocus() {
  openDropdown();
}

// Click outside — check both wrapper and teleported dropdown
function onClickOutside(e: MouseEvent) {
  const target = e.target as Node;
  if (wrapperRef.value?.contains(target)) return;
  if (dropdownRef.value?.contains(target)) return;
  isOpen.value = false;
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

// Display text for single select (when closed)
const displayText = computed(() => {
  if (props.multiple) return "";
  if (selectedOptions.value.length > 0) return selectedOptions.value[0].label;
  return "";
});

// Reset query when closing
watch(isOpen, (open) => {
  if (!open) query.value = "";
  if (open) nextTick(updateDropdownPosition);
});

// Expose imperative handle
function focus(opts?: FocusOptions) {
  inputRef.value?.focus(opts);
}

function blur() {
  inputRef.value?.blur();
}

defineExpose({ el: wrapperRef, focus, blur });

// Option styling
function optionClass(index: number, option: ComboboxOption) {
  return {
    "cui-combobox__option": true,
    "cui-combobox__option--focused": focusedIndex.value === index,
    "cui-combobox__option--selected": selectedSet.value.has(option.value),
    "cui-combobox__option--disabled": !!option.disabled,
  };
}
const messages = useMessages();
</script>

<template>
  <!-- The size-derived properties live on the ROOT, not the control: the dropdown is a
       sibling of the control, not a descendant, so properties set on the control would
       never reach the options. -->
  <div class="cui-combobox" v-show="!hidden" ref="wrapperRef" :style="cfg.style">
    <label
      v-if="label"
      :style="{ display: 'block', marginBottom: 'calc(0.25rem * var(--cui-density-scale, 1))', fontSize: '0.875rem', fontWeight: '500', color: 'var(--cui-text-secondary)' }"
    >{{ label }}</label>

    <!-- Input area -->
    <div
      ref="controlRef"
      class="cui-combobox__control"
      :class="{ 'cui-combobox__control--disabled': disabled }"
      :style="{
        '--_combobox-radius': radiusMap[rounded],
        '--_combobox-border': error ? 'var(--cui-error)' : 'var(--cui-border-strong, var(--cui-border))',
        '--_combobox-focus-ring': error ? 'var(--cui-error-focus-ring)' : `var(--cui-${color}-focus-ring)`,
        '--_combobox-focus-border': error ? 'var(--cui-error)' : `var(--cui-${color})`,
      }"
      @click="inputRef?.focus()"
    >
      <!-- Selected tags (multiple mode) -->
      <CuiBadge
        v-for="opt in (multiple ? selectedOptions : [])"
        :key="String(opt.value)"
        :color="color"
        :size="cfg.tagSize"
        removable
        @remove="removeTag(opt.value)"
      >
        <img v-if="opt.image" :src="opt.image as string" :style="{ width: '1rem', height: '1rem', borderRadius: '50%', objectFit: 'cover', marginRight: 'calc(0.125rem * var(--cui-density-scale, 1))' }" />
        {{ opt.label }}
      </CuiBadge>

      <!-- Search input -->
      <input
        ref="inputRef"
        :id="id"
        :name="name"
        :autocomplete="autocomplete"
        :aria-describedby="ariaDescribedby"
        :aria-labelledby="ariaLabelledby"
        :value="isOpen ? query : displayText"
        :placeholder="selectedOptions.length > 0 ? '' : placeholder"
        :disabled="disabled"
        class="cui-combobox__input"
        @input="onInput"
        @focus="onFocus"
        @keydown="onKeydown"
      />

      <!-- Right icons -->
      <div :style="{ display: 'flex', alignItems: 'center', gap: 'calc(0.25rem * var(--cui-density-scale, 1))', flexShrink: '0' }">
        <CuiSpinner v-if="isLoading" size="xs" />
        <CuiIcon v-else name="caret-down" size="0.875rem" :style="{ color: 'var(--cui-text-tertiary)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }" />
      </div>
    </div>

    <!-- Error message -->
    <div v-if="error && errorMessage" :style="{ fontSize: '0.75rem', color: 'var(--cui-error)', marginTop: 'calc(0.25rem * var(--cui-density-scale, 1))' }">
      {{ errorMessage }}
    </div>

    <!-- Dropdown (teleported) -->
    <Teleport to="body">
      <div v-if="isOpen" ref="dropdownRef" class="cui-combobox__dropdown" :style="dropdownStyle">
        <!-- Loading -->
        <div v-if="isLoading && filteredOptions.length === 0" :style="{ padding: 'calc(1rem * var(--cui-density-scale, 1))', textAlign: 'center' }">
          <CuiSpinner size="sm" show-label :label="messages.combobox.searching" />
        </div>

        <!-- No results -->
        <div
          v-else-if="filteredOptions.length === 0 && (query.length >= minChars || !fetchOptions)"
          :style="{ padding: 'calc(0.75rem * var(--cui-density-scale, 1))', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--cui-text-tertiary)' }"
        >
          {{ noResultsText }}
        </div>

        <!-- Min chars hint -->
        <div
          v-else-if="filteredOptions.length === 0 && fetchOptions && query.length < minChars"
          :style="{ padding: 'calc(0.75rem * var(--cui-density-scale, 1))', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--cui-text-tertiary)' }"
        >
          {{ messages.combobox.typeMore(minChars - query.length) }}
        </div>

        <!-- Options list -->
        <div
          v-for="(option, i) in filteredOptions"
          :key="String(option.value)"
          :data-index="i"
          :class="optionClass(i, option)"
          @click.stop="selectOption(option)"
          @mouseenter="focusedIndex = i"
        >
          <slot name="option" :option="option" :selected="selectedSet.has(option.value)">
            <img
              v-if="option.image"
              :src="option.image as string"
              :style="{ width: '1.75rem', height: '1.75rem', borderRadius: '50%', objectFit: 'cover', flexShrink: '0' }"
            />
            <CuiIcon
              v-else-if="option.icon"
              :name="option.icon"
              size="1rem"
              :style="{ flexShrink: '0', color: 'var(--cui-text-secondary)' }"
            />

            <div :style="{ flex: '1', minWidth: '0' }">
              <div :style="{ lineHeight: '1.3', fontWeight: selectedSet.has(option.value) ? '600' : '400' }">
                {{ option.label }}
              </div>
              <div
                v-if="option.description"
                :style="{ fontSize: '0.75rem', color: 'var(--cui-text-tertiary)', lineHeight: '1.3', marginTop: 'calc(0.0625rem * var(--cui-density-scale, 1))' }"
              >
                {{ option.description }}
              </div>
            </div>

            <CuiIcon
              v-if="selectedSet.has(option.value)"
              name="check"
              size="0.875rem"
              :style="{ color: `var(--cui-${color})`, flexShrink: '0' }"
            />
          </slot>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* Focus ring, mirroring CuiInput/CuiSelect. The control is a wrapper around a
   borderless `<input>`, so the ring keys off `:focus-within` (as CuiInput does)
   rather than `:focus-visible` — the focusable element is the child, and an
   input is expected to show focus on click, not only on keyboard entry.
   `border`, `background` and `transition` live here rather than in the inline
   `:style` above BECAUSE of this rule: an inline `border` shorthand would win
   over `border-color` below, so the focus border could never apply. The
   dynamic halves stay as custom properties set on this same element — the rule
   that consumes them is on the element itself, per CLAUDE.md. */
/* --- Themeable ---
   Zero specificity, so a consumer's own rule wins without `!important`. See the note in
   CuiButton.vue. The private values come from the style binding; a public token set
   anywhere in the ancestor chain takes precedence (#123). */
:where(.cui-combobox__control) {
  min-height: var(--cui-combobox-min-height, var(--_combobox-min-height));
  padding: var(--cui-combobox-padding, var(--_combobox-padding));
  border-radius: var(--cui-combobox-radius, var(--_combobox-radius));
  border: var(--cui-combobox-border-width, 1px) solid var(--_combobox-border);
  background: var(--cui-combobox-bg, var(--cui-surface-base, white));
  font-size: var(--cui-combobox-font-size, var(--_combobox-font-size));
}

:where(.cui-combobox__dropdown) {
  background: var(--cui-combobox-panel-bg, var(--cui-surface-base));
  border: var(--cui-combobox-panel-border, 1px solid var(--cui-border));
  border-radius: var(--cui-combobox-panel-radius, 0.5rem);
  box-shadow: var(
    --cui-combobox-panel-shadow,
    0 8px 24px -4px rgba(0, 0, 0, 0.12),
    0 2px 8px -2px rgba(0, 0, 0, 0.08)
  );
  padding: var(--cui-combobox-panel-padding, calc(0.25rem * var(--cui-density-scale, 1)));
}

:where(.cui-combobox__option) {
  padding: var(--cui-combobox-item-padding, var(--_combobox-item-padding));
  font-size: var(--cui-combobox-font-size, var(--_combobox-font-size));
  color: var(--cui-combobox-item-color, var(--cui-text-body));
  border-radius: var(--cui-combobox-item-radius, 0.25rem);
}

:where(.cui-combobox__option--selected) {
  background: var(--cui-combobox-item-selected-bg, color-mix(in srgb, var(--cui-primary-bg) 50%, transparent));
}

:where(.cui-combobox__option--focused) {
  background: var(--cui-combobox-item-focus-bg, var(--cui-primary-bg));
}

:where(.cui-combobox__option--disabled) {
  color: var(--cui-combobox-item-disabled-color, var(--cui-text-tertiary));
}

/* --- Structural --- */
.cui-combobox__control {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: calc(0.25rem * var(--cui-density-scale, 1));
  cursor: text;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.cui-combobox__control--disabled {
  cursor: default;
  opacity: 0.5;
}

.cui-combobox {
  position: relative;
}

.cui-combobox__dropdown {
  overflow-y: auto;
}

.cui-combobox__input {
  flex: 1;
  min-width: 4rem;
  border: none;
  outline: none;
  background: transparent;
  padding: 0;
  font-family: inherit;
  font-size: var(--cui-combobox-font-size, var(--_combobox-font-size));
  color: var(--cui-combobox-color, var(--cui-text-body));
  /* A determinate line-height, so the field's intrinsic height cannot push the control
     past the shared scale's height: at `sm` the browser default plus the field's own
     padding came to 24px, which with the control's padding and borders made the box 34px
     against a 32px input (#123). */
  line-height: 1.25;
}

.cui-combobox__option {
  display: flex;
  align-items: center;
  gap: calc(0.5rem * var(--cui-density-scale, 1));
  cursor: pointer;
  transition: background 0.1s ease;
}

.cui-combobox__option--disabled {
  cursor: default;
  opacity: 0.5;
}

.cui-combobox__control:focus-within:not(.cui-combobox__control--disabled) {
  border-color: var(--_combobox-focus-border);
  box-shadow: 0 0 0 2px var(--_combobox-focus-ring);
}
</style>

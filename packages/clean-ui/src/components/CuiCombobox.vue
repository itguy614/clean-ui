<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import type { ButtonColor } from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";
import CuiBadge from "./CuiBadge.vue";
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

export interface CuiComboboxProps {
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
  /** Size */
  size?: "sm" | "md" | "lg";
  /** Color */
  color?: ButtonColor;
  /** Disabled */
  disabled?: boolean;
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
  /** Hidden */
  hidden?: boolean;
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
  hidden: false,
});

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

// Size config
const sizeConfig: Record<string, { fontSize: string; padding: string; tagSize: string; itemPadding: string; inputHeight: string }> = {
  sm: { fontSize: "0.8125rem", padding: "0.25rem 0.5rem", tagSize: "sm", itemPadding: "0.375rem 0.625rem", inputHeight: "2rem" },
  md: { fontSize: "0.875rem", padding: "0.3125rem 0.625rem", tagSize: "sm", itemPadding: "0.5rem 0.75rem", inputHeight: "2.375rem" },
  lg: { fontSize: "0.9375rem", padding: "0.4375rem 0.75rem", tagSize: "md", itemPadding: "0.625rem 0.875rem", inputHeight: "2.75rem" },
};
const cfg = computed(() => sizeConfig[props.size]);

// Dropdown positioning
function updateDropdownPosition() {
  if (!wrapperRef.value) return;
  const rect = wrapperRef.value.getBoundingClientRect();
  const vh = window.innerHeight;
  const spaceBelow = vh - rect.bottom;
  const spaceAbove = rect.top;
  const maxH = Math.min(320, Math.max(spaceBelow, spaceAbove) - 16);
  const openAbove = spaceBelow < 200 && spaceAbove > spaceBelow;

  const s: Record<string, string> = {
    position: "fixed",
    zIndex: "9990",
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    maxHeight: `${maxH}px`,
    overflowY: "auto",
    background: "var(--cui-surface-base)",
    border: "1px solid var(--cui-border)",
    borderRadius: "0.5rem",
    boxShadow: "0 8px 24px -4px rgba(0,0,0,0.12), 0 2px 8px -2px rgba(0,0,0,0.08)",
    padding: "0.25rem",
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

// Option styling
function optionStyle(index: number, option: ComboboxOption) {
  const selected = selectedSet.value.has(option.value);
  const focused = focusedIndex.value === index;
  return {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: cfg.value.itemPadding,
    cursor: option.disabled ? "default" : "pointer",
    fontSize: cfg.value.fontSize,
    color: option.disabled ? "var(--cui-text-tertiary)" : "var(--cui-text-body)",
    opacity: option.disabled ? "0.5" : "1",
    background: focused ? "var(--cui-primary-bg)" : selected ? "color-mix(in srgb, var(--cui-primary-bg) 50%, transparent)" : "transparent",
    transition: "background 0.1s ease",
    borderRadius: "0.25rem",
  };
}
</script>

<template>
  <div v-show="!hidden" ref="wrapperRef" :style="{ position: 'relative' }">
    <label
      v-if="label"
      :style="{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--cui-text-secondary)' }"
    >{{ label }}</label>

    <!-- Input area -->
    <div
      :style="{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '0.25rem',
        padding: cfg.padding,
        border: `1px solid ${error ? 'var(--cui-error)' : 'var(--cui-border-strong, var(--cui-border))'}`,
        borderRadius: 'var(--cui-button-radius, 0.375rem)',
        background: 'var(--cui-surface-base, white)',
        cursor: disabled ? 'default' : 'text',
        opacity: disabled ? '0.5' : '1',
        minHeight: cfg.inputHeight,
      }"
      @click="inputRef?.focus()"
    >
      <!-- Selected tags (multiple mode) -->
      <CuiBadge
        v-for="opt in (multiple ? selectedOptions : [])"
        :key="String(opt.value)"
        :color="color"
        :size="cfg.tagSize as 'sm' | 'md'"
        removable
        @remove="removeTag(opt.value)"
      >
        <img v-if="opt.image" :src="opt.image as string" :style="{ width: '1rem', height: '1rem', borderRadius: '50%', objectFit: 'cover', marginRight: '0.125rem' }" />
        {{ opt.label }}
      </CuiBadge>

      <!-- Search input -->
      <input
        ref="inputRef"
        :value="isOpen ? query : displayText"
        :placeholder="selectedOptions.length > 0 ? '' : placeholder"
        :disabled="disabled"
        :style="{
          flex: '1',
          minWidth: '4rem',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontSize: cfg.fontSize,
          color: 'var(--cui-text-body)',
          padding: '0.125rem 0',
          fontFamily: 'inherit',
        }"
        @input="onInput"
        @focus="onFocus"
        @keydown="onKeydown"
      />

      <!-- Right icons -->
      <div :style="{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: '0' }">
        <CuiSpinner v-if="isLoading" size="xs" />
        <CuiIcon v-else name="caret-down" size="0.875rem" :style="{ color: 'var(--cui-text-tertiary)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }" />
      </div>
    </div>

    <!-- Error message -->
    <div v-if="error && errorMessage" :style="{ fontSize: '0.75rem', color: 'var(--cui-error)', marginTop: '0.25rem' }">
      {{ errorMessage }}
    </div>

    <!-- Dropdown (teleported) -->
    <Teleport to="body">
      <div v-if="isOpen" ref="dropdownRef" :style="dropdownStyle">
        <!-- Loading -->
        <div v-if="isLoading && filteredOptions.length === 0" :style="{ padding: '1rem', textAlign: 'center' }">
          <CuiSpinner size="sm" show-label label="Searching..." />
        </div>

        <!-- No results -->
        <div
          v-else-if="filteredOptions.length === 0 && (query.length >= minChars || !fetchOptions)"
          :style="{ padding: '0.75rem', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--cui-text-tertiary)' }"
        >
          {{ noResultsText }}
        </div>

        <!-- Min chars hint -->
        <div
          v-else-if="filteredOptions.length === 0 && fetchOptions && query.length < minChars"
          :style="{ padding: '0.75rem', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--cui-text-tertiary)' }"
        >
          Type {{ minChars - query.length }} more character{{ minChars - query.length === 1 ? '' : 's' }}...
        </div>

        <!-- Options list -->
        <div
          v-for="(option, i) in filteredOptions"
          :key="String(option.value)"
          :data-index="i"
          :style="optionStyle(i, option)"
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
                :style="{ fontSize: '0.75rem', color: 'var(--cui-text-tertiary)', lineHeight: '1.3', marginTop: '0.0625rem' }"
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

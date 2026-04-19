<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import type { ButtonColor } from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";
import CuiBadge from "./CuiBadge.vue";
import CuiSpinner from "./CuiSpinner.vue";

export interface TagOption {
  value: string;
  label?: string;
  color?: ButtonColor;
  [key: string]: unknown;
}

export interface CuiTagInputProps {
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
  /** Size */
  size?: "sm" | "md" | "lg";
  /** Color for tag badges */
  color?: ButtonColor;
  /** Disabled */
  disabled?: boolean;
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
  hidden: false,
});

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
const dropdownStyle = ref<Record<string, string>>({});
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const selectedSet = computed(() => new Set(props.modelValue));
const atMax = computed(() => props.maxTags > 0 && props.modelValue.length >= props.maxTags);

// Resolve tag display
function tagLabel(value: string): string {
  const opt = [...props.suggestions, ...asyncSuggestions.value].find((s) => s.value === value);
  return opt?.label ?? value;
}

function tagColor(value: string): ButtonColor {
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
const sizeConfig: Record<string, { fontSize: string; padding: string; tagSize: "sm" | "md"; inputHeight: string }> = {
  sm: { fontSize: "0.8125rem", padding: "0.25rem 0.5rem", tagSize: "sm", inputHeight: "2rem" },
  md: { fontSize: "0.875rem", padding: "0.3125rem 0.625rem", tagSize: "sm", inputHeight: "2.375rem" },
  lg: { fontSize: "0.9375rem", padding: "0.4375rem 0.75rem", tagSize: "md", inputHeight: "2.75rem" },
};
const cfg = computed(() => sizeConfig[props.size]);

// Dropdown positioning
function updateDropdownPosition() {
  if (!wrapperRef.value) return;
  const rect = wrapperRef.value.getBoundingClientRect();
  const vh = window.innerHeight;
  const spaceBelow = vh - rect.bottom;
  const openAbove = spaceBelow < 200 && rect.top > spaceBelow;
  const maxH = Math.min(240, Math.max(spaceBelow, rect.top) - 16);

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
        v-if="!atMax"
        ref="inputRef"
        :value="query"
        :placeholder="modelValue.length > 0 ? '' : placeholder"
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
    </div>

    <!-- Error -->
    <div v-if="error && errorMessage" :style="{ fontSize: '0.75rem', color: 'var(--cui-error)', marginTop: '0.25rem' }">
      {{ errorMessage }}
    </div>

    <!-- Dropdown -->
    <Teleport to="body">
      <div v-if="isOpen && (filteredSuggestions.length > 0 || canCreate || isLoading)" ref="dropdownRef" :style="dropdownStyle">
        <!-- Loading -->
        <div v-if="isLoading && filteredSuggestions.length === 0" :style="{ padding: '0.75rem', textAlign: 'center' }">
          <CuiSpinner size="xs" show-label label="Searching..." />
        </div>

        <!-- Suggestions -->
        <div
          v-for="(suggestion, i) in filteredSuggestions"
          :key="suggestion.value"
          :data-index="i"
          :style="{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4375rem 0.625rem',
            cursor: 'pointer',
            fontSize: cfg.fontSize,
            borderRadius: '0.25rem',
            background: focusedIndex === i ? 'var(--cui-primary-bg)' : 'transparent',
            color: 'var(--cui-text-body)',
            transition: 'background 0.1s ease',
          }"
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
          :style="{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.4375rem 0.625rem',
            cursor: 'pointer',
            fontSize: cfg.fontSize,
            borderRadius: '0.25rem',
            background: focusedIndex === filteredSuggestions.length ? 'var(--cui-primary-bg)' : 'transparent',
            color: 'var(--cui-primary)',
            fontWeight: '500',
            transition: 'background 0.1s ease',
            borderTop: filteredSuggestions.length > 0 ? '1px solid color-mix(in srgb, var(--cui-border) 50%, transparent)' : 'none',
            marginTop: filteredSuggestions.length > 0 ? '0.125rem' : '0',
            paddingTop: filteredSuggestions.length > 0 ? '0.5rem' : undefined,
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

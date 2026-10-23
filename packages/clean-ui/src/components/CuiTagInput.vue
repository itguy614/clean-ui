<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from "vue";
import { useClickOutside } from "../composables/useClickOutside";
import type { CuiColor, CuiSize, HideableProps, ColorableProps, SizeableProps, DisableableProps, CuiRounded, NativeControlProps } from "../types/common";
import { INPUT_SIZE_SCALE, nestedSize, scaleDensity, RADIUS_SCALE } from "../utils/sizing";
import { useFieldDescribedBy } from "../composables/useFieldDescribedBy";
import { useListbox, followHighlight } from "../composables/useListbox";
import { useCuiId } from "../composables/useCuiId";
import { useAsyncSearch } from "../composables/useAsyncSearch";
import CuiIcon from "./CuiIcon.vue";
import CuiListboxPanel from "./CuiListboxPanel.vue";
import CuiListboxOption from "./CuiListboxOption.vue";
import CuiListboxStatus from "./CuiListboxStatus.vue";
import CuiFormValues from "./CuiFormValues.vue";
import { useMessages } from "../composables/useMessages";
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
  /** Search for suggestions. `signal` is aborted when a newer search, or unmount, supersedes it. */
  fetchSuggestions?: (query: string, context: { signal: AbortSignal }) => Promise<TagOption[]>;
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
  size: "md",
  color: "primary",
  disabled: false,
  error: false,
  rounded: "md",
  hidden: false,
});

// Link our own error message into aria-describedby (#175).
const { errorId, describedBy } = useFieldDescribedBy(props);

const emit = defineEmits<{
  "update:modelValue": [value: string[]];
}>();

const query = ref("");
const isOpen = ref(false);
const focusedIndex = ref(-1);
// fetchSuggestions: debounced, latest-only, cancelled below minChars and on unmount (#245).
const asyncSearch = useAsyncSearch<TagOption>({
  fetch: () => props.fetchSuggestions,
  query: () => query.value,
  debounce: () => props.debounce,
  minChars: () => props.minChars,
});
const asyncSuggestions = asyncSearch.results;
// Every reset of the query (a selection, a close) goes through here, so a search still
// pending for the old text can't fire afterwards and reopen the list (#245).
function clearQuery() {
  query.value = "";
  asyncSearch.reset();
}
const inputRef = ref<HTMLInputElement | null>(null);
const panelRef = ref<InstanceType<typeof CuiListboxPanel> | null>(null);
const messages = useMessages();
// The prose props default to the message catalogue, so a localised app localises them (#215).
const placeholderText = computed(() => props.placeholder ?? messages.value.tagInput.placeholder);
const noSuggestionsLabel = computed(() => props.noSuggestionsText ?? messages.value.tagInput.noSuggestions);
// `createText`, when given, keeps its old shape: the word, then the quoted value.
const createLabel = computed(() =>
  props.createText !== undefined ? `${props.createText} \u201c${query.value.trim()}\u201d` : messages.value.tagInput.create(query.value.trim()),
);
const wrapperRef = ref<HTMLElement | null>(null);
const controlRef = ref<HTMLElement | null>(null);

const selectedSet = computed(() => new Set(props.modelValue));
const atMax = computed(() => props.maxTags > 0 && props.modelValue.length >= props.maxTags);

// Every suggestion seen, so a tag keeps its label and colour after the search that found
// it is replaced, cleared or fails — as CuiCombobox's allKnownOptions does.
// Reactive, so a chip re-renders with the label once the search that names it lands.
const seenSuggestions = reactive(new Map<string, TagOption>());
watch(asyncSuggestions, (found) => found.forEach((s) => seenSuggestions.set(s.value, s)));
const findSuggestion = (value: string) => props.suggestions.find((s) => s.value === value) ?? seenSuggestions.get(value);

// Resolve tag display
function tagLabel(value: string): string {
  return findSuggestion(value)?.label ?? value;
}

function tagColor(value: string): CuiColor {
  return findSuggestion(value)?.color ?? props.color;
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

// The debounce counts as loading: the panel says "searching" rather than claim nothing.
const isLoading = computed(() => asyncSearch.pending.value);
const showFailed = computed(() => !!asyncSearch.error.value && asyncSearch.answered.value && !!query.value.trim());

// Size config
// From the shared scale, so a tag input lines up with a CuiInput or CuiSelect of the same
// size. The private table it replaces had different metrics, only sm|md|lg, and an
// `inputHeight` that was never density-scaled at all (#123).
/**
 * The control grows with its tag rows, so the scale's height is a floor rather than a
 * fixed height — and the chips inside need room, hence the reduced vertical padding.
 * Constant, so it is built once rather than per size change.
 */
const CHIP_ROW_PY = scaleDensity("0.25rem");

/** The suggestion rows' padding: fixed, not size-derived like the control's. */
const ITEM_PADDING = `${scaleDensity("0.4375rem")} ${scaleDensity("0.625rem")}`;

const cfg = computed(() => {
  const s = INPUT_SIZE_SCALE[props.size];
  return {
    tagSize: nestedSize(props.size),
    style: {
      "--_tag-input-font-size": s.fontSize,
      "--_tag-input-padding": `${CHIP_ROW_PY} ${s.px}`,
      "--_tag-input-min-height": s.height,
    },
  };
});

// Input handler
function onInput(e: Event) {
  query.value = (e.target as HTMLInputElement).value;
  focusedIndex.value = -1;
  if (!isOpen.value) isOpen.value = true;

  if (props.fetchSuggestions) asyncSearch.search(query.value);
}

// Add tag
function addTag(value: string) {
  if (props.disabled || atMax.value) return;
  const trimmed = value.trim();
  if (!trimmed || selectedSet.value.has(trimmed)) return;
  emit("update:modelValue", [...props.modelValue, trimmed]);
  clearQuery();
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
// The ARIA combobox pattern, editable (#205) — see useListbox. The create row is the last
// option. Its own Enter stays here: it creates as well as selects.
const generatedId = useCuiId("tag-input");
// The empty state (#212): something typed, nothing to list, and nothing to create. With
// async suggestions, only once a search for this query has actually come back — not below
// minChars, nor during the debounce before the search starts.
const nothingFound = computed(
  () =>
    !!query.value.trim() &&
    !isLoading.value &&
    filteredSuggestions.value.length === 0 &&
    !canCreate.value &&
    !showFailed.value &&
    asyncSearch.answered.value,
);
// The list shows when there is something in it, or to say nothing matched; aria-expanded
// follows it.
const panelOpen = computed(
  () =>
    isOpen.value &&
    (filteredSuggestions.value.length > 0 || canCreate.value || isLoading.value || nothingFound.value || showFailed.value),
);
const showEmpty = computed(() => isOpen.value && nothingFound.value);
const listbox = useListbox({
  id: props.id ?? generatedId,
  mode: "editable",
  count: () => filteredSuggestions.value.length + (canCreate.value ? 1 : 0),
  activeIndex: focusedIndex,
  isOpen: () => panelOpen.value,
  open: () => (isOpen.value = true),
  close: () => (isOpen.value = false),
  hasLabel: () => !!props.label,
  labelledby: () => props.ariaLabelledby,
  // The create row is an option too, so it counts: "No results" would hide a real choice.
  announce: () => {
    if (!panelOpen.value || isLoading.value) return "";
    if (showFailed.value) return messages.value.listbox.searchFailed;
    if (showEmpty.value) return noSuggestionsLabel.value;
    return messages.value.listbox.results(filteredSuggestions.value.length + (canCreate.value ? 1 : 0));
  },
});

// As in CuiCombobox (#346): a changed list keeps the highlight on the suggestion it was on,
// rather than the same index, which would be a different one.
watch(filteredSuggestions, (next, prev) => (focusedIndex.value = followHighlight(next, prev, focusedIndex.value)));

function onKeydown(e: KeyboardEvent) {
  // The Enter confirming an IME composition must not create a tag from it.
  if (e.isComposing || e.keyCode === 229) return;
  if (listbox.onKeydown(e)) return;
  if (e.key === "Enter") {
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
  } else if (e.key === "Backspace" && !query.value && props.modelValue.length > 0) {
    removeTag(props.modelValue[props.modelValue.length - 1]);
  }
}

// Global listeners only while open, so a closed field holds none (#203). The wrapper,
// not just the control: a press on the label or the clear button isn't "outside".
useClickOutside(() => [wrapperRef.value, panelRef.value?.el], () => (isOpen.value = false), { enabled: isOpen });

function onFocus() {
  if (!props.disabled && !atMax.value) {
    isOpen.value = true;
  }
}

watch(isOpen, (open) => {
  if (!open) clearQuery();
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
  <!-- The size-derived properties live on the root, for the control and its input. The
       teleported panel gets the ones its rows need as props (#137). -->
  <div class="cui-tag-input" v-show="!hidden" ref="wrapperRef" :style="cfg.style">
    <label
      v-if="label"
      :id="listbox.labelId"
      class="cui-tag-input__label"
    >{{ label }}</label>

    <!-- Input area -->
    <div
      ref="controlRef"
      class="cui-tag-input__control"
      :class="{ 'cui-tag-input__control--disabled': disabled }"
      :style="{
        '--_tag-input-radius': RADIUS_SCALE[rounded],
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
        :autocomplete="autocomplete"
        :aria-describedby="describedBy"
        :aria-required="ariaRequired || undefined"
        v-bind="listbox.inputAttrs.value"
        v-if="!atMax"
        ref="inputRef"
        :value="query"
        :placeholder="modelValue.length > 0 ? '' : placeholderText"
        :disabled="disabled"
        class="cui-tag-input__input"
        @input="onInput"
        @focus="onFocus"
        @keydown="onKeydown"
      />
    </div>

    <!-- Error -->
    <div v-if="error && errorMessage" :id="errorId" class="cui-tag-input__error cui-field-error">
      {{ errorMessage }}
    </div>

    <!-- The tags post under `name` (#303), not the half-typed text the search input holds. -->
    <CuiFormValues :name="name" :value="modelValue" multiple :disabled="disabled" />

    <span class="cui-sr-only" role="status" aria-live="polite" aria-atomic="true">{{ listbox.announcement.value }}</span>

    <!-- Dropdown -->
    <CuiListboxPanel
      ref="panelRef"
      :open="panelOpen"
      :anchor="controlRef"
      token-prefix="tag-input"
      :color="color"
      :max-height="240"
      :font-size="cfg.style['--_tag-input-font-size']"
      :item-padding="ITEM_PADDING"
      v-bind="listbox.panelAttrs.value"
      class="cui-tag-input__dropdown"
    >
      <!-- Loading -->
      <CuiListboxStatus v-if="isLoading && filteredSuggestions.length === 0">
        <CuiSpinner size="xs" show-label :label="messages.tagInput.searching" />
      </CuiListboxStatus>

      <!-- Empty state -->
      <CuiListboxStatus v-if="showFailed">{{ messages.listbox.searchFailed }}</CuiListboxStatus>
      <CuiListboxStatus v-else-if="showEmpty">{{ noSuggestionsLabel }}</CuiListboxStatus>

      <!-- Suggestions -->
      <CuiListboxOption
        v-for="(suggestion, i) in filteredSuggestions"
        :key="suggestion.value"
        :id="listbox.optionId(i)"
        :active="focusedIndex === i"
        class="cui-tag-input__suggestion"
        :class="{ 'cui-tag-input__suggestion--focused': focusedIndex === i }"
        @select="selectSuggestion(suggestion)"
        @hover="focusedIndex = i"
      >
        <slot name="suggestion" :suggestion="suggestion">
          <span>{{ suggestion.label || suggestion.value }}</span>
        </slot>
      </CuiListboxOption>

      <!-- Create new -->
      <CuiListboxOption
        v-if="canCreate"
        :id="listbox.optionId(filteredSuggestions.length)"
        :active="focusedIndex === filteredSuggestions.length"
        class="cui-tag-input__create"
        :class="{
          'cui-tag-input__suggestion--focused': focusedIndex === filteredSuggestions.length,
          'cui-tag-input__create--divided': filteredSuggestions.length > 0,
        }"
        @select="createTag"
        @hover="focusedIndex = filteredSuggestions.length"
      >
        <CuiIcon name="plus" size="0.75rem" />
        <span>{{ createLabel }}</span>
      </CuiListboxOption>
    </CuiListboxPanel>
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

/* The panel and its option rows are painted by CuiListboxPanel, from this component's
   --cui-tag-input-panel-* / --cui-tag-input-item-* tokens (#137). */

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
  margin-top: calc(0.375rem * var(--cui-density-scale, 1));
}
</style>

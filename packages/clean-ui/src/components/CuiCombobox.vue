<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import { useClickOutside } from "../composables/useClickOutside";
import type { ColorableProps, SizeableProps, DisableableProps, HideableProps, CuiRounded, NativeControlProps } from "../types/common";
import { INPUT_SIZE_SCALE, nestedSize, scaleDensity, RADIUS_SCALE } from "../utils/sizing";
import { useFieldDescribedBy } from "../composables/useFieldDescribedBy";
import { useListbox } from "../composables/useListbox";
import { useCuiId } from "../composables/useCuiId";
import { useAsyncSearch } from "../composables/useAsyncSearch";
import CuiIcon from "./CuiIcon.vue";
import CuiBadge from "./CuiBadge.vue";
import { useMessages } from "../composables/useMessages";
import CuiSpinner from "./CuiSpinner.vue";
import CuiListboxPanel from "./CuiListboxPanel.vue";
import CuiListboxOption from "./CuiListboxOption.vue";
import CuiListboxStatus from "./CuiListboxStatus.vue";
import CuiFormValues from "./CuiFormValues.vue";

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
  /** Search for options. `signal` is aborted when a newer search, or unmount, supersedes it. */
  fetchOptions?: (query: string, context: { signal: AbortSignal }) => Promise<ComboboxOption[]>;
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

// Link our own error message into aria-describedby (#175).
const { errorId, describedBy } = useFieldDescribedBy(props);

const emit = defineEmits<{
  "update:modelValue": [value: string | number | (string | number)[] | null];
  search: [query: string];
}>();

// State
const query = ref("");
const isOpen = ref(false);
const focusedIndex = ref(-1);
// fetchOptions: debounced, latest-only, cancelled below minChars and on unmount (#245).
const asyncSearch = useAsyncSearch<ComboboxOption>({
  fetch: () => props.fetchOptions,
  query: () => query.value,
  debounce: () => props.debounce,
  minChars: () => props.minChars,
});
const asyncOptions = asyncSearch.results;
// Every reset of the query (a selection, a close) goes through here, so a search still
// pending for the old text can't fire afterwards and reopen the list (#245).
function clearQuery() {
  query.value = "";
  asyncSearch.reset();
}
const inputRef = ref<HTMLInputElement | null>(null);
const panelRef = ref<InstanceType<typeof CuiListboxPanel> | null>(null);
const wrapperRef = ref<HTMLElement | null>(null);
const controlRef = ref<HTMLElement | null>(null);

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

// The debounce counts as loading: the panel says "searching" rather than show an empty box.
const isLoading = computed(() => props.loading || asyncSearch.pending.value);

// What the panel can show, besides options (#245). "No results" only once a search for
// what's typed has come back (always, for static options); a failed search says so.
const showFailed = computed(() => !!asyncSearch.error.value && asyncSearch.answered.value);
const showNoResults = computed(
  () => filteredOptions.value.length === 0 && asyncSearch.answered.value && !showFailed.value && !isLoading.value,
);
const showTypeMore = computed(
  () => filteredOptions.value.length === 0 && !!props.fetchOptions && query.value.length < props.minChars,
);
// Open only with something to show, as CuiTagInput; aria-expanded follows it. With
// fetchOptions and nothing typed yet, that is nothing.
const panelOpen = computed(
  () =>
    isOpen.value &&
    (filteredOptions.value.length > 0 || isLoading.value || showFailed.value || showNoResults.value || showTypeMore.value),
);

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

// Search
function onInput(e: Event) {
  query.value = (e.target as HTMLInputElement).value;
  focusedIndex.value = -1;
  if (!isOpen.value) openDropdown();

  emit("search", query.value);

  if (props.fetchOptions) asyncSearch.search(query.value);
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
    clearQuery();
    nextTick(() => inputRef.value?.focus());
  } else {
    emit("update:modelValue", option.value);
    isOpen.value = false; // the close watcher clears the query
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
  if (listbox.onKeydown(e)) return;
  if (e.key === "Backspace" && !query.value && props.multiple && selectedOptions.value.length > 0) {
    removeTag(selectedOptions.value[selectedOptions.value.length - 1].value);
  }
}

// The ARIA combobox pattern, editable (#205) — see useListbox. Ids build on the control's own
// `id` when it has one; useCuiId runs either way, for SSR-stable ids.
const messages = useMessages();
const generatedId = useCuiId("combobox");
const listbox = useListbox({
  id: props.id ?? generatedId,
  mode: "editable",
  count: () => filteredOptions.value.length,
  isDisabled: (i) => !!filteredOptions.value[i]?.disabled,
  activeIndex: focusedIndex,
  isOpen: () => panelOpen.value,
  open: openDropdown,
  select: (i) => selectOption(filteredOptions.value[i]),
  close: () => (isOpen.value = false),
  hasLabel: () => !!props.label,
  labelledby: () => props.ariaLabelledby,
  // Silent while searching, and while the min-chars hint shows instead; the panel's own
  // empty text when nothing matches, so a localised noResultsText is what's heard.
  announce: () => {
    if (!panelOpen.value || isLoading.value) return "";
    if (showFailed.value) return messages.value.listbox.searchFailed;
    const n = filteredOptions.value.length;
    if (n > 0) return messages.value.listbox.results(n);
    return showNoResults.value ? props.noResultsText : "";
  },
});

// The highlight is an index into the list as it is now, and so is the option id the input
// names: when the list changes under it — the query clears after a multiple selection,
// async results arrive — it would point at a different option. Start over instead.
watch(filteredOptions, () => (focusedIndex.value = -1));

// Open/close
function openDropdown() {
  if (props.disabled) return;
  isOpen.value = true;
}

function onFocus() {
  openDropdown();
}

// Global listeners only while open, so a closed field holds none (#203). The wrapper,
// not just the control: a press on the label or the clear button isn't "outside".
useClickOutside(() => [wrapperRef.value, panelRef.value?.el], () => (isOpen.value = false), { enabled: isOpen });

// Display text for single select (when closed)
const displayText = computed(() => {
  if (props.multiple) return "";
  if (selectedOptions.value.length > 0) return selectedOptions.value[0].label;
  return "";
});

// Reset query when closing
watch(isOpen, (open) => {
  if (!open) clearQuery();
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
</script>

<template>
  <!-- The size-derived properties live on the root, for the control and its input. The
       teleported panel gets the ones its rows need as props (#137). -->
  <div class="cui-combobox" v-show="!hidden" ref="wrapperRef" :style="cfg.style">
    <label
      v-if="label"
      :id="listbox.labelId"
      :style="{ display: 'block', marginBottom: 'calc(0.25rem * var(--cui-density-scale, 1))', fontSize: '0.875rem', fontWeight: '500', color: 'var(--cui-text-secondary)' }"
    >{{ label }}</label>

    <!-- Input area -->
    <div
      ref="controlRef"
      class="cui-combobox__control"
      :class="{ 'cui-combobox__control--disabled': disabled }"
      :style="{
        '--_combobox-radius': RADIUS_SCALE[rounded],
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
        :autocomplete="autocomplete"
        :aria-describedby="describedBy"
        :aria-required="ariaRequired || undefined"
        v-bind="listbox.inputAttrs.value"
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
    <div v-if="error && errorMessage" :id="errorId" :style="{ fontSize: '0.75rem', color: 'var(--cui-error)', marginTop: 'calc(0.25rem * var(--cui-density-scale, 1))' }">
      {{ errorMessage }}
    </div>

    <!-- The value posts under `name` (#303), not the search text the input holds. -->
    <CuiFormValues :name="name" :value="modelValue" :multiple="multiple" :disabled="disabled" />

    <span class="cui-sr-only" role="status" aria-live="polite" aria-atomic="true">{{ listbox.announcement.value }}</span>

    <!-- Dropdown (teleported) -->
    <CuiListboxPanel
      ref="panelRef"
      :open="panelOpen"
      :anchor="controlRef"
      token-prefix="combobox"
      :color="color"
      :max-height="320"
      :max-visible="maxVisible"
      :font-size="cfg.style['--_combobox-font-size']"
      :item-padding="cfg.style['--_combobox-item-padding']"
      v-bind="listbox.panelAttrs.value"
      :aria-multiselectable="multiple || undefined"
      class="cui-combobox__dropdown"
    >
      <!-- Loading -->
      <!-- Status rows (presentational: a listbox holds only options; the live region above
           announces the results) -->
      <CuiListboxStatus v-if="isLoading && filteredOptions.length === 0">
        <CuiSpinner size="sm" show-label :label="messages.combobox.searching" />
      </CuiListboxStatus>
      <CuiListboxStatus v-else-if="showFailed && filteredOptions.length === 0">
        {{ messages.listbox.searchFailed }}
      </CuiListboxStatus>
      <CuiListboxStatus v-else-if="showNoResults">
        {{ noResultsText }}
      </CuiListboxStatus>
      <CuiListboxStatus v-else-if="showTypeMore">
        {{ messages.combobox.typeMore(minChars - query.length) }}
      </CuiListboxStatus>

      <!-- Options list -->
      <CuiListboxOption
        v-for="(option, i) in filteredOptions"
        :key="String(option.value)"
        :id="listbox.optionId(i)"
        :active="focusedIndex === i"
        :selected="selectedSet.has(option.value)"
        :disabled="!!option.disabled"
        :class="optionClass(i, option)"
        @select="selectOption(option)"
        @hover="focusedIndex = i"
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
      </CuiListboxOption>
    </CuiListboxPanel>
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

/* The panel and its option rows are painted by CuiListboxPanel, from this component's
   --cui-combobox-panel-* / --cui-combobox-item-* tokens (#137). */

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

.cui-combobox__control:focus-within:not(.cui-combobox__control--disabled) {
  border-color: var(--_combobox-focus-border);
  box-shadow: 0 0 0 2px var(--_combobox-focus-ring);
}
</style>

<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { useClickOutside } from "../composables/useClickOutside";
import { useListbox } from "../composables/useListbox";
import { useCuiId } from "../composables/useCuiId";
import type { HideableProps, ColorableProps, SizeableProps, DisableableProps, CuiRounded, NativeControlProps, FormControlProps } from "../types/common";
import CuiIcon from "./CuiIcon.vue";
import CuiBadge from "./CuiBadge.vue";
import CuiSpinner from "./CuiSpinner.vue";
import CuiFormValues from "./CuiFormValues.vue";
import CuiListboxPanel from "./CuiListboxPanel.vue";
import CuiListboxOption from "./CuiListboxOption.vue";
import CuiListboxStatus from "./CuiListboxStatus.vue";
import { INPUT_SIZE_SCALE, RADIUS_SCALE, nestedSize, scaleDensity } from "../utils/sizing";
import { useFieldDescribedBy } from "../composables/useFieldDescribedBy";
import { useMessages } from "../composables/useMessages";
import { IconCaretDown } from "../icons/generated/caret-down";
import { IconCheck } from "../icons/generated/check";
import { IconX } from "../icons/generated/x";

export interface SelectOption {
  value: string | number;
  label: string;
  icon?: string;
  group?: string;
  disabled?: boolean;
}

export interface CuiSelectProps
  extends NativeControlProps,
    HideableProps,
    ColorableProps,
    SizeableProps,
    DisableableProps,
    Pick<FormControlProps, "error" | "errorMessage" | "readonly"> {
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
  /** Border radius */
  rounded?: CuiRounded;
}

const props = withDefaults(defineProps<CuiSelectProps>(), {
  options: () => [],
  multiple: false,
  clearable: false,
  loading: false,
  color: "primary",
  size: "md",
  error: false,
  disabled: false,
  readonly: false,
  hidden: false,
  rounded: "md",
});

// Link our own error message into aria-describedby (#175).
const { errorId, describedBy } = useFieldDescribedBy(props);

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

  // Each option carries its index in the order shown — what the arrow keys walk and the
  // option ids count (#216) — computed once here rather than looked up per row per render.
  let index = 0;
  const section = (options: SelectOption[], group?: string) => ({ group, options: options.map((opt) => ({ opt, index: index++ })) });
  const result = [];
  if (ungrouped.length) result.push(section(ungrouped));
  for (const [group, options] of groups) result.push(section(options, group));
  return result;
});

// Every option in the order it is shown — ungrouped first, then each group. It used to be
// the order the options were given, so with interleaved groups the highlight jumped around
// the list. Disabled options stay in it; navigation skips them.
const displayOptions = computed(() => groupedOptions.value.flatMap((section) => section.options.map((o) => o.opt)));

// State
const isOpen = ref(false);
const highlightedIndex = ref(-1);
const triggerRef = ref<HTMLElement>();
const panelRef = ref<InstanceType<typeof CuiListboxPanel> | null>(null);

// Selection helpers. A Set, since every row asks on every render.
const selectedValues = computed(() => {
  const v = props.modelValue;
  if (props.multiple) return new Set<string | number>(Array.isArray(v) ? v : []);
  return new Set<string | number>(v != null && !Array.isArray(v) ? [v] : []);
});
const isSelected = (value: string | number) => selectedValues.value.has(value);

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

// Native form participation (#174) is CuiFormValues. `autocomplete` has no effect on
// Select: browsers ignore it on hidden inputs, and there is no native control to autofill.

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
  // Start the highlight on the current selection, scrolled into view.
  highlightedIndex.value = props.multiple ? -1 : displayOptions.value.findIndex((o) => o.value === props.modelValue && !o.disabled);
  listbox.scrollActiveIntoView();
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

// Chips are CuiBadge, as CuiCombobox's and CuiTagInput's are (#301); they are removable
// only while the select is editable, and onKeydown returns early otherwise. If focus was
// in the select (on the trigger, or the chip's own button) and the removal took it away,
// hand it back to the trigger rather than leaving it on <body>.
function removeChip(value: string | number) {
  if (!props.multiple || !Array.isArray(props.modelValue)) return;
  const hadFocus = !!triggerRef.value?.contains(document.activeElement);
  emit("update:modelValue", props.modelValue.filter((v) => v !== value));
  nextTick(() => {
    if (hadFocus && !triggerRef.value?.contains(document.activeElement)) triggerRef.value?.focus();
  });
}

function clear() {
  if (props.disabled || props.readonly) return;
  emit("update:modelValue", props.multiple ? [] : null);
}

// The ARIA combobox pattern, select-only (#216) — see useListbox: Home/End, type-ahead,
// Space and Enter, the highlight named by aria-activedescendant on the trigger.
const generatedId = useCuiId("select");
const groupId = (section: number) => `${listbox.listboxId}-group-${section}`;
const listbox = useListbox({
  id: props.id ?? generatedId,
  mode: "select-only",
  // Nothing to walk while the panel shows only its loading row.
  count: () => (props.loading ? 0 : displayOptions.value.length),
  isDisabled: (i) => !!displayOptions.value[i]?.disabled,
  label: (i) => displayOptions.value[i]?.label ?? "",
  activeIndex: highlightedIndex,
  isOpen: () => isOpen.value,
  open,
  select: (i) => selectOption(displayOptions.value[i]),
  close,
  hasLabel: () => false,
  labelledby: () => props.ariaLabelledby,
});

function onKeydown(e: KeyboardEvent) {
  // A key pressed on a chip's remove button belongs to that button: Enter or Space there
  // must click it, not open the panel.
  if (props.disabled || props.readonly || e.target !== triggerRef.value) return;
  // Backspace drops the last chip, as it does in CuiCombobox with an empty query.
  const modified = e.ctrlKey || e.metaKey || e.altKey;
  if (e.key === "Backspace" && !modified && props.multiple && hasValue.value) {
    e.preventDefault();
    removeChip((props.modelValue as Array<string | number>).at(-1)!);
    return;
  }
  listbox.onKeydown(e);
}

// Global listeners only while open, so a closed select holds none (#203).
useClickOutside(() => [triggerRef.value, panelRef.value?.el], close, { enabled: isOpen });

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
  return { minHeight: s.height, px: s.px, fontSize: s.fontSize, itemPadding: `${scaleDensity("0.5rem")} ${s.px}` };
});
// One step below the control, as CuiCombobox's and CuiTagInput's chips are.
const chipSize = computed(() => nestedSize(props.size));
const messages = useMessages();
// The prose props default to the message catalogue, so a localised app localises them (#215).
const placeholderText = computed(() => props.placeholder ?? messages.value.select.placeholder);
const noOptionsLabel = computed(() => props.noOptionsText ?? messages.value.select.noOptions);
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
        '--_select-min-height': dims.minHeight,
        '--_select-radius': RADIUS_SCALE[rounded],
        '--_select-px': dims.px,
        '--_select-font-size': dims.fontSize,
        '--_select-focus-ring': `var(--cui-${color}-focus-ring)`,
        '--_select-border': error ? 'var(--cui-error)' : `var(--cui-border-strong)`,
        '--_select-focus-border': error ? 'var(--cui-error)' : `var(--cui-${color})`,
      }"
    >
      <!-- Trigger -->
      <div
        ref="triggerRef"
        :id="id"
        :aria-describedby="describedBy"
        :aria-required="ariaRequired || undefined"
        v-bind="listbox.inputAttrs.value"
        class="cui-select__trigger"
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
            <CuiBadge
              v-for="(val, i) in modelValue"
              :key="String(val)"
              :color="color"
              :size="chipSize"
              :removable="!disabled && !readonly"
              @remove="removeChip(val)"
            >
              <span class="cui-select__chip-label">{{ selectedLabels[i] }}</span>
            </CuiBadge>
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
            <span class="cui-select__placeholder">{{ placeholderText }}</span>
          </template>
        </div>

        <!-- Actions -->
        <div class="cui-select__actions">
          <button
            v-if="clearable && hasValue && !disabled && !readonly"
            type="button"
            class="cui-select__clear"
              :aria-label="messages.clear"
            @click.stop="clear"
          >
            <CuiIcon :icon="IconX" size="0.75rem" />
          </button>
          <CuiIcon :icon="IconCaretDown" size="1rem" class="cui-select__chevron" :class="{ 'cui-select__chevron--open': isOpen }" />
        </div>
      </div>

    </div>

    <!-- Dropdown: the shared listbox panel, teleported to body (#216) -->
    <CuiListboxPanel
      ref="panelRef"
      :open="isOpen"
      :anchor="triggerRef"
      token-prefix="select"
      :color="color"
      :max-height="300"
      :font-size="dims.fontSize"
      :item-padding="dims.itemPadding"
      v-bind="listbox.panelAttrs.value"
      :aria-multiselectable="multiple || undefined"
      class="cui-select__dropdown"
    >
      <CuiListboxStatus v-if="loading">
        <CuiSpinner size="sm" show-label :label="messages.loading" />
      </CuiListboxStatus>
      <CuiListboxStatus v-else-if="normalizedOptions.length === 0">{{ noOptionsLabel }}</CuiListboxStatus>

      <template v-else>
        <!-- A named group is role="group", labelled by its header; the ungrouped section is
             presentational, so its options are the listbox's own. -->
        <div
          v-for="(section, si) in groupedOptions"
          :key="section.group ?? '__ungrouped'"
          :role="section.group ? 'group' : undefined"
          :aria-labelledby="section.group ? groupId(si) : undefined"
        >
          <div v-if="section.group" :id="groupId(si)" class="cui-select__group-header" :style="{ '--_select-px': dims.px }">
            {{ section.group }}
          </div>
          <!-- The cui-select__option--* classes are for consumer CSS written against them;
               the paint comes from CuiListboxOption's own state classes. -->
          <CuiListboxOption
            v-for="{ opt, index } in section.options"
            :key="String(opt.value)"
            :id="listbox.optionId(index)"
            :active="highlightedIndex === index"
            :selected="isSelected(opt.value)"
            :disabled="!!opt.disabled"
            class="cui-select__option"
            :class="{
              'cui-select__option--selected': isSelected(opt.value),
              'cui-select__option--highlighted': highlightedIndex === index,
              'cui-select__option--disabled': opt.disabled,
            }"
            @select="selectOption(opt)"
            @hover="highlightedIndex = index"
          >
            <!-- Checkbox for multi-select only -->
            <span v-if="multiple" class="cui-select__check">
              <CuiIcon v-if="isSelected(opt.value)" :icon="IconCheck" size="1rem" :color="color" />
            </span>
            <span class="cui-select__option-label">
              <slot name="option" :option="opt">
                <CuiIcon v-if="opt.icon" :name="opt.icon" size="sm" class="cui-select__option-icon" />
                {{ opt.label }}
              </slot>
            </span>
          </CuiListboxOption>
        </div>
      </template>
    </CuiListboxPanel>

    <CuiFormValues :name="name" :value="modelValue" :multiple="multiple" :disabled="disabled" />

    <!-- Error message -->
    <div v-if="error && errorMessage" :id="errorId" class="cui-select__error cui-field-error">
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

/* --- Trigger ---
   Themeable (#333, #454): zero specificity, so a consumer's plain `.cui-select__trigger { … }`
   or a `--cui-select-*` token on a container wins. The values are computed in the script and
   emitted as private `--_select-*` properties; each is read back through its public token.
   `min-height` is the control's height floor — it grows with its chips — so its slot is
   `min-height`, as CuiCombobox's is.

   `--cui-select-font-size` sizes the trigger and, through the listbox panel's prefix, the
   option rows: one token for control plus options, as CuiCombobox and CuiTagInput do. */
:where(.cui-select__trigger) {
  border-radius: var(--cui-select-radius, var(--_select-radius));
  min-height: var(--cui-select-min-height, var(--_select-min-height));
  padding-block: calc(0.25rem * var(--cui-density-scale, 1));
  padding-inline: var(--cui-select-px, var(--_select-px));
  border-color: var(--cui-select-border, var(--_select-border));
  font-size: var(--cui-select-font-size, var(--_select-font-size));
}

/* After the resting rule: both are zero specificity, so the later one wins. */
:where(.cui-select__trigger:focus-visible, .cui-select--open .cui-select__trigger) {
  border-color: var(--cui-select-focus-border, var(--_select-focus-border));
  box-shadow: 0 0 0 2px var(--cui-select-focus-ring, var(--_select-focus-ring));
}

.cui-select__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-width: 1px;
  border-style: solid;
  background: var(--cui-surface-base);
  cursor: pointer;
  transition: border-color var(--cui-duration-fast) ease, box-shadow var(--cui-duration-fast) ease;
  gap: calc(0.5rem * var(--cui-density-scale, 1));
  user-select: none;
}

.cui-select__trigger:focus-visible {
  outline: none;
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
  gap: calc(0.25rem * var(--cui-density-scale, 1));
  flex: 1;
  min-width: 0;
}

/* The trigger's floor less its own padding and borders. */
:where(.cui-select__value) {
  min-height: calc(var(--cui-select-min-height, var(--_select-min-height)) - 0.75rem);
}

.cui-select__label {
  display: flex;
  align-items: center;
  gap: calc(0.375rem * var(--cui-density-scale, 1));
  color: var(--cui-text-body);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cui-select__placeholder {
  color: var(--cui-text-tertiary);
}

/* --- Chips (multi-select): CuiBadge never wraps, so a long label is cut short with an
   ellipsis rather than spilling out of the trigger. --- */
.cui-select__value :deep(.cui-badge) {
  max-width: 100%;
}

.cui-select__value :deep(.cui-badge__content) {
  min-width: 0;
}

.cui-select__chip-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  /* The badge's line-height of 1; the scoped base sets 1.5 on a classed span (#351). */
  line-height: inherit;
}

/* --- Actions (clear + chevron) --- */
.cui-select__actions {
  display: flex;
  align-items: center;
  gap: calc(0.25rem * var(--cui-density-scale, 1));
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
  transition: color var(--cui-duration-fast) ease, background var(--cui-duration-fast) ease;
}

.cui-select__clear:hover {
  color: var(--cui-text-body);
  background: var(--cui-surface-dark-bg);
}

.cui-select__chevron {
  color: var(--cui-text-tertiary);
  transition: transform var(--cui-duration-base) var(--cui-ease-in-out);
  flex-shrink: 0;
}

.cui-select__chevron--open {
  transform: rotate(180deg);
}

/* --- Dropdown ---
   The dropdown, its options and its status rows are painted by CuiListboxPanel /
   CuiListboxOption / CuiListboxStatus, from --cui-select-panel-* / --cui-select-item-* (#216). */

/* --- Group header --- */
.cui-select__group-header {
  /* Inline padding matches the option rows', which follow the size (#216). */
  padding-block: calc(0.5rem * var(--cui-density-scale, 1)) calc(0.25rem * var(--cui-density-scale, 1));
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--cui-text-tertiary);
}

/* The header is teleported with the panel, so a token set on a container does not reach it;
   one set on `:root`, or the private value it carries, does. */
:where(.cui-select__group-header) {
  padding-inline: var(--cui-select-px, var(--_select-px));
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
  gap: calc(0.375rem * var(--cui-density-scale, 1));
  min-width: 0;
}

/* --- Error --- */
.cui-select__error {
  margin-top: calc(0.375rem * var(--cui-density-scale, 1));
}
</style>

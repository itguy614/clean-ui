import type { ComponentMeta } from "./types";

const ariaProps = [
  {
    name: "id",
    type: "string",
    description: "id of the native control — what a label's for attribute must point at. CuiFormField supplies it automatically",
  },
  { name: "name", type: "string", description: "Native control name, for form serialization and browser autofill" },
  { name: "autocomplete", type: "string", description: "Native autocomplete hint, e.g. email, street-address, off" },
  {
    name: "aria-describedby",
    type: "string",
    description: "id(s) of describing text. CuiFormField points this at its help text or error message",
  },
  { name: "aria-labelledby", type: "string", description: "id(s) of the labelling element. CuiFormField points this at its label" },
];

const meta: ComponentMeta = {
  name: "Combobox",
  description: "A searchable select with static or async options, single or multiple selection, and rich option rendering.",
  interactive: true,

  props: [
    { name: "modelValue", type: "string | number | array | null", default: "null", description: "Selected value(s)" },
    { name: "options", type: "ComboboxOption[]", default: "[]", description: "Static options array" },
    { name: "multiple", type: "boolean", default: "false", description: "Allow multiple selection" },
    { name: "fetchOptions", type: "(query) => Promise<Option[]>", description: "Async search function" },
    { name: "debounce", type: "number", default: "300", description: "Debounce delay for search (ms)" },
    { name: "minChars", type: "number", default: "0", description: "Min characters before searching" },
    { name: "maxVisible", type: "number", default: "8", description: "Max visible items before scrolling" },
    { name: "placeholder", type: "string", default: "Search...", description: "Placeholder text" },
    { name: "noResultsText", type: "string", default: "No results found", description: "Text when no options match" },
    {
      name: "size",
      type: "xs | sm | md | lg | xl",
      default: "md",
      description: "Size, from the shared input scale — matches CuiInput and CuiSelect at the same value",
    },
    { name: "rounded", type: "none | sm | md | lg | full", default: "md", description: "Border radius" },
    { name: "label", type: "string", description: "Label text" },
    { name: "error", type: "boolean", default: "false", description: "Error state" },
    { name: "errorMessage", type: "string", description: "Error message" },
    {
      name: "color",
      type: "primary | secondary | success | error | warning | info | surface | surface-light | surface-dark",
      default: "primary",
      description: "Color role",
    },
    { name: "disabled", type: "boolean", default: "false", description: "Disabled state" },
    { name: "loading", type: "boolean", default: "false", description: "External loading state" },
    { name: "hidden", type: "boolean", default: "false", description: "Hide the component" },
    ...ariaProps,
  ],

  slots: [
    { name: "option", payload: "{ option, selected }", description: "Renders one row of the dropdown" },
    { name: "selected", payload: "{ option }", description: "Renders a selected value in the control" },
  ],

  events: [
    { name: "update:modelValue", payload: "string | number | Array | null", description: "Fires when the selection changes (v-model)" },
    { name: "search", payload: "string", description: "Fires on input change with the current search query" },
  ],

  tokens: [
    { name: "--cui-combobox-min-height", default: "per size", description: "Control height floor — it grows with its tag rows" },
    { name: "--cui-combobox-padding", default: "per size", description: "Control padding" },
    { name: "--cui-combobox-font-size", default: "per size", description: "Control and option font size" },
    { name: "--cui-combobox-radius", default: "per rounded", description: "Control corner radius" },
    { name: "--cui-combobox-bg", default: "var(--cui-surface-base)", description: "Control background" },
    { name: "--cui-combobox-color", default: "var(--cui-text-body)", description: "Typed text color" },
    { name: "--cui-combobox-border-width", default: "1px", description: "Control border width" },
    { name: "--cui-combobox-panel-bg", default: "var(--cui-surface-base)", description: "Dropdown background" },
    { name: "--cui-combobox-panel-border", default: "1px solid var(--cui-border)", description: "Dropdown border" },
    { name: "--cui-combobox-panel-radius", default: "0.5rem", description: "Dropdown corner radius" },
    { name: "--cui-combobox-panel-shadow", default: "two-layer drop shadow", description: "Dropdown shadow" },
    { name: "--cui-combobox-panel-padding", default: "0.25rem", description: "Dropdown inner padding" },
    { name: "--cui-combobox-item-padding", default: "per size", description: "Option padding" },
    { name: "--cui-combobox-item-radius", default: "0.25rem", description: "Option corner radius" },
    { name: "--cui-combobox-item-color", default: "var(--cui-text-body)", description: "Option text color" },
    { name: "--cui-combobox-item-focus-bg", default: "var(--cui-primary-bg)", description: "Background of the keyboard-focused option" },
    { name: "--cui-combobox-item-selected-bg", default: "50% of the focus tint", description: "Background of a selected option" },
    { name: "--cui-combobox-item-disabled-color", default: "var(--cui-text-tertiary)", description: "Disabled option text color" },
  ],
};

export default meta;

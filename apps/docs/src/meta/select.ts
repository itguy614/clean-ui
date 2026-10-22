import type { ComponentMeta, PropRow } from "./types";
import { colorProp, disabledProp, hiddenProp, inputSizeProp, nativeControlProps, roundedProp } from "./shared";

/**
 * `nativeControlProps`, adjusted. CuiSelect's focusable surface is a `div[role="combobox"]`,
 * not a native control: `id` names the trigger rather than a labelable element; `name`
 * posts through hidden inputs (#174); `autocomplete` has nothing to land on.
 */
const selectAriaProps: PropRow[] = [
  {
    name: "name",
    type: "string",
    description:
      "Form field name. CuiSelect renders hidden inputs with it, so the value posts with a native form and reads from FormData — one input for a single value (empty when nothing is selected), one per value when multiple. Nothing posts while disabled",
  },
  {
    name: "autocomplete",
    type: "string",
    description: "Accepted for parity with the other fields, but has no effect: there is no native control to autofill, and browsers ignore autocomplete on hidden inputs",
  },
  {
    name: "id",
    type: "string",
    description:
      "id of the trigger. The trigger is a div[role=combobox], which is not a labelable element — a label's for attribute pointing here forms no association, so this alone will not name the control",
  },
  {
    name: "aria-labelledby",
    type: "string",
    description:
      "id(s) of the element naming the control. The only thing that names a CuiSelect. CuiFormField supplies it automatically",
  },
  // Shared wording, so it can't drift from the other fields'.
  nativeControlProps.find((p) => p.name === "aria-describedby")!,
];

const meta: ComponentMeta = {
  name: "Select",
  description:
    "A dropdown for choosing from a known list — single or multiple, with option groups, per-option icons, a loading state and full keyboard navigation.",
  interactive: true,

  props: [
    {
      name: "v-model",
      type: "string | number | null | Array<string | number>",
      description: "The selected value. An array when multiple is set, null when nothing is selected",
    },
    {
      name: "options",
      type: "Array<string | number | SelectOption>",
      default: "[]",
      description:
        "The options. A bare string or number becomes { value, label }; an object takes { value, label, icon?, group?, disabled? }",
    },
    { name: "multiple", type: "boolean", default: "false", description: "Allow several selections, shown as removable chips" },
    { name: "placeholder", type: "string", default: "Select... (messages.select.placeholder)", description: "Shown while nothing is selected" },
    { name: "clearable", type: "boolean", default: "false", description: "Show a clear button once something is selected" },
    {
      name: "loading",
      type: "boolean",
      default: "false",
      description: "Show a spinner in the panel instead of the options — for options you are still fetching",
    },
    { name: "noOptionsText", type: "string", default: "No options available (messages.select.noOptions)", description: "Shown when options is empty" },
    colorProp("Color role for the focus border, focus ring and the highlighted option"),
    inputSizeProp,
    roundedProp,
    {
      name: "error",
      type: "boolean",
      default: "false",
      description: "Error state — recolors the border to the error role and sets aria-invalid on the trigger",
    },
    { name: "errorMessage", type: "string", description: "Error message rendered below the control, when error is set" },
    disabledProp,
    { name: "readonly", type: "boolean", default: "false", description: "Readonly state — the panel will not open, but the trigger stays focusable" },
    hiddenProp,
    ...selectAriaProps,
  ],

  slots: [
    {
      name: "option",
      payload: "{ option: SelectOption }",
      description: "Replaces one row of the panel — a badge, an avatar, a two-line layout",
    },
    {
      name: "selected",
      payload: "{ option: SelectOption | null }",
      description: "Replaces the selected label in the trigger. Single-select only; multi-select always draws chips",
    },
  ],

  events: [
    {
      name: "update:modelValue",
      payload: "string | number | null | Array<string | number>",
      description: "Fires on selection, on removing a chip, and on clear (v-model)",
    },
  ],

  methods: [
    { name: "el", signature: "HTMLElement | undefined", description: "The trigger element — the focusable div[role=combobox]" },
    { name: "focus", signature: "() => void", description: "Focus the trigger" },
    { name: "blur", signature: "() => void", description: "Blur the trigger" },
    { name: "open", signature: "() => void", description: "Open the panel and position it. A no-op while disabled or readonly" },
    { name: "close", signature: "() => void", description: "Close the panel and drop the highlight" },
  ],

  // The dropdown is the shared listbox panel (#216), so it takes the same token set as
  // CuiCombobox and CuiTagInput, under the select prefix.
  tokens: [
    { name: "--cui-select-panel-bg", default: "var(--cui-surface-base)", description: "Dropdown background" },
    { name: "--cui-select-panel-border", default: "1px solid var(--cui-border)", description: "Dropdown border" },
    { name: "--cui-select-panel-radius", default: "0.5rem", description: "Dropdown corner radius" },
    { name: "--cui-select-panel-shadow", default: "two-layer drop shadow", description: "Dropdown shadow" },
    { name: "--cui-select-panel-padding", default: "0.25rem", description: "Dropdown inner padding" },
    { name: "--cui-select-font-size", default: "per size", description: "Option font size" },
    { name: "--cui-select-item-padding", default: "per size", description: "Option padding" },
    { name: "--cui-select-item-radius", default: "0.25rem", description: "Option corner radius" },
    { name: "--cui-select-item-color", default: "var(--cui-text-body)", description: "Option text color" },
    { name: "--cui-select-item-focus-bg", default: "var(--cui-primary-bg)", description: "Background of the highlighted option" },
    { name: "--cui-select-item-selected-bg", default: "50% of the focus tint", description: "Background of a selected option" },
    { name: "--cui-select-item-disabled-color", default: "var(--cui-text-tertiary)", description: "Disabled option text color" },
  ],
};

export default meta;

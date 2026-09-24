import type { ComponentMeta, PropRow } from "./types";
import { colorProp, disabledProp, hiddenProp, inputSizeProp, roundedProp } from "./shared";

/**
 * `nativeControlProps` minus `name` and `autocomplete`.
 *
 * CuiSelect renders no native form control at all — its focusable surface is a
 * `div[role="combobox"]` — so `name` and `autocomplete` have nothing to land on, and
 * `id` names the trigger rather than a labelable element.
 */
const selectAriaProps: PropRow[] = [
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
  {
    name: "aria-describedby",
    type: "string",
    description: "id(s) of describing text. CuiFormField points this at its help text or error message",
  },
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
    { name: "placeholder", type: "string", default: "Select...", description: "Shown while nothing is selected" },
    { name: "clearable", type: "boolean", default: "false", description: "Show a clear button once something is selected" },
    {
      name: "loading",
      type: "boolean",
      default: "false",
      description: "Show a spinner in the panel instead of the options — for options you are still fetching",
    },
    { name: "noOptionsText", type: "string", default: "No options available", description: "Shown when options is empty" },
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
};

export default meta;

import type { ComponentMeta } from "./types";
import { colorProp, disabledProp, hiddenProp, inputSizeProp, nativeControlProps, roundedProp } from "./shared";

const meta: ComponentMeta = {
  name: "Input",
  description:
    "Single-line text entry, with prefix/suffix adornments, attached buttons, a clear button, a password reveal toggle and validation states.",
  interactive: true,

  props: [
    {
      name: "v-model",
      type: "string | number",
      default: "''",
      description: "The input's value. Typed as string | number so type=\"number\" and v-model.number bind without a cast",
    },
    {
      name: "type",
      type: "text | password | email | url | tel | search | number | range",
      default: "text",
      description: "Native input type. password adds the reveal toggle automatically",
    },
    { name: "placeholder", type: "string", description: "Placeholder text. Not a substitute for a label" },
    colorProp("Color role for the focus border and focus ring"),
    inputSizeProp,
    roundedProp,
    {
      name: "clearable",
      type: "boolean",
      default: "false",
      description: "Show a clear button whenever the value is non-empty. 0 counts as non-empty",
    },
    {
      name: "error",
      type: "boolean",
      default: "false",
      description: "Error state — recolors the border to the error role and sets aria-invalid on the native input",
    },
    { name: "errorMessage", type: "string", description: "Error message rendered below the control, when error is set" },
    disabledProp,
    { name: "readonly", type: "boolean", default: "false", description: "Readonly state — selectable and copyable, not editable" },
    hiddenProp,
    ...nativeControlProps,
  ],

  slots: [
    { name: "prefix", description: "Icon or text inside the border, before the text — a currency symbol, a search glyph" },
    { name: "suffix", description: "Icon or text inside the border, after the text — a unit, a hint" },
    { name: "prefix-button", description: "A CuiButton merged into the left border, its inner corners squared off" },
    { name: "suffix-button", description: "A CuiButton merged into the right border, its inner corners squared off" },
  ],

  events: [
    { name: "update:modelValue", payload: "string | number", description: "Fires on every keystroke (v-model)" },
    {
      name: "clear",
      payload: "—",
      description: "Fires when the clear button is pressed, after update:modelValue has already emitted an empty string",
    },
  ],

  methods: [
    { name: "el", signature: "HTMLInputElement | null", description: "The native input, not the wrapper" },
    {
      name: "focus",
      signature: "(opts?: FocusOptions) => void",
      description: "Focus the native input. Forwards FocusOptions, so { preventScroll: true } works when restoring focus from an overlay",
    },
    { name: "blur", signature: "() => void", description: "Blur the native input" },
  ],
};

export default meta;

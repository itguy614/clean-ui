import type { ComponentMeta } from "./types";
import { colorProp, disabledProp, hiddenProp, inputSizeProp, nativeControlProps } from "./shared";

const meta: ComponentMeta = {
  name: "Masked Input",
  description:
    "A CuiInput that holds its value to a fixed format. v-model carries the raw characters; the separators live only in the display value.",
  interactive: true,

  props: [
    {
      name: "v-model",
      type: "string",
      default: "''",
      description: "The raw value — only the characters the mask's tokens matched, with every literal separator stripped",
    },
    {
      name: "mask",
      type: "string",
      description:
        "The format. # is a digit, A a letter, * alphanumeric; every other character is a literal the component inserts for you. Backslash escapes a token character as a literal. Required",
    },
    {
      name: "tokens",
      type: "Record<string, { pattern: RegExp }>",
      description: "Extra token characters, merged over the built-ins — e.g. { H: { pattern: /[0-9a-fA-F]/ } }",
    },
    {
      name: "fillChar",
      type: "string",
      default: "_",
      description: "What an unfilled token position shows. It is part of the visible value, not a placeholder",
    },
    { name: "placeholder", type: "string", description: "Placeholder text, shown only while the field is empty and unfocused" },
    colorProp("Color role for the focus border and focus ring"),
    inputSizeProp,
    { name: "clearable", type: "boolean", default: "false", description: "Show a clear button, which resets to the empty mask" },
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
    { name: "prefix", description: "Icon or text inside the border, before the text" },
    { name: "suffix", description: "Icon or text inside the border, after the text" },
    { name: "prefix-button", description: "A CuiButton merged into the left border" },
    { name: "suffix-button", description: "A CuiButton merged into the right border" },
  ],

  events: [
    {
      name: "update:modelValue",
      payload: "string",
      description: "Fires with the raw value — no separators, no fill characters (v-model)",
    },
    {
      name: "update:formattedValue",
      payload: "string",
      description: "Fires with the display value, separators and fill characters included (v-model:formattedValue)",
    },
  ],

  methods: [
    {
      name: "el",
      signature: "InstanceType<typeof CuiInput> | null",
      description:
        "The inner CuiInput component instance — not a DOM node. Reach the native input through its own el: maskedRef.value.el.el",
    },
    { name: "formattedValue", signature: "string", description: "The current display value, same as update:formattedValue carries" },
    {
      name: "focus",
      signature: "(opts?: FocusOptions) => void",
      description: "Focus the field and snap the caret to the first unfilled position",
    },
    { name: "blur", signature: "() => void", description: "Blur the field" },
  ],
};

export default meta;

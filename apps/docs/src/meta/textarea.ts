import type { ComponentMeta } from "./types";
import { colorProp, disabledProp, hiddenProp, inputSizeProp, nativeControlProps, roundedProp } from "./shared";

const meta: ComponentMeta = {
  name: "Textarea",
  description:
    "Multiline text entry, with optional auto-resize and a character counter. Shares CuiInput's border, focus and validation treatment.",
  interactive: true,

  props: [
    { name: "v-model", type: "string", default: "''", description: "The textarea's value" },
    { name: "placeholder", type: "string", description: "Placeholder text. Not a substitute for a label" },
    colorProp("Color role for the focus border and focus ring"),
    inputSizeProp,
    roundedProp,
    {
      name: "rows",
      type: "number",
      default: "3",
      description: "Visible rows. With autoResize this is the floor the box never shrinks below",
    },
    { name: "autoResize", type: "boolean", default: "false", description: "Grow the box to fit its content as you type" },
    { name: "maxRows", type: "number", description: "Row ceiling for autoResize — past it the box scrolls instead of growing" },
    {
      name: "maxLength",
      type: "number",
      description: "Character limit. Setting it also shows the counter. Typing past the limit is truncated as you type",
    },
    {
      name: "error",
      type: "boolean",
      default: "false",
      description: "Error state — recolors the border to the error role and sets aria-invalid on the native textarea",
    },
    { name: "errorMessage", type: "string", description: "Error message rendered below the control, when error is set" },
    disabledProp,
    { name: "readonly", type: "boolean", default: "false", description: "Readonly state — selectable and copyable, not editable" },
    hiddenProp,
    ...nativeControlProps,
  ],

  events: [{ name: "update:modelValue", payload: "string", description: "Fires on every keystroke (v-model)" }],

  methods: [
    { name: "el", signature: "HTMLTextAreaElement | null", description: "The native textarea, not the wrapper" },
    {
      name: "focus",
      signature: "(opts?: FocusOptions) => void",
      description: "Focus the native textarea. Forwards FocusOptions, so { preventScroll: true } works",
    },
    { name: "blur", signature: "() => void", description: "Blur the native textarea" },
  ],

  tokens: [
    { name: "--cui-textarea-radius", default: "per rounded", description: "Corner radius of the field" },
    { name: "--cui-textarea-border", default: "var(--cui-border-strong)", description: "Border color (an invalid field keeps the error color)" },
    { name: "--cui-textarea-px", default: "per size", description: "Horizontal padding of the text" },
    { name: "--cui-textarea-py", default: "per size", description: "Vertical padding of the text" },
    { name: "--cui-textarea-font-size", default: "per size", description: "Font size of the text" },
    { name: "--cui-textarea-focus-border", default: "var(--cui-primary)", description: "Border color while focused" },
    { name: "--cui-textarea-focus-ring", default: "var(--cui-primary-focus-ring)", description: "Focus ring color" },
  ],
};

export default meta;

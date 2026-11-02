import type { ComponentMeta } from "./types";
import { colorProp, disabledProp, hiddenProp, inputSizeProp, nativeControlProps } from "./shared";

const meta: ComponentMeta = {
  name: "Pin Input",
  description:
    "A one-time code or PIN, drawn as a row of boxes. One real input underneath takes the typing, a paste and SMS autofill; the boxes show each character and where the caret is.",
  interactive: true,

  props: [
    { name: "v-model", type: "string", default: "''", description: "The code typed so far, with only accepted characters" },
    { name: "length", type: "number", default: "6", description: "Number of characters, and of boxes" },
    {
      name: "type",
      type: "digits | alphanumeric",
      default: "digits",
      description: "Which characters are accepted. digits also opens a numeric keypad on touch devices",
    },
    { name: "uppercase", type: "boolean", default: "false", description: "Upper-case letters as they are typed or pasted" },
    {
      name: "mask",
      type: "boolean",
      default: "false",
      description: "Show a dot in place of each character. The input becomes a password input",
    },
    { name: "label", type: "string", description: "Label above the boxes. It names the input" },
    {
      name: "description",
      type: "string",
      description: "Help text under the label, linked by aria-describedby. Say how long the code is here",
    },
    colorProp("Color role for the caret box's border and focus ring"),
    inputSizeProp,
    {
      name: "error",
      type: "boolean",
      default: "false",
      description: "Error state for the whole code: every box takes the error border, and the input gets aria-invalid",
    },
    { name: "errorMessage", type: "string", description: "Error message under the boxes, linked by aria-describedby" },
    { name: "required", type: "boolean", default: "false", description: "Mark the label with an asterisk and set aria-required" },
    disabledProp,
    { name: "readonly", type: "boolean", default: "false", description: "Show the code without letting it be changed" },
    hiddenProp,
    ...nativeControlProps.map((row) =>
      row.name === "autocomplete" ? { ...row, default: "one-time-code", description: "Native autocomplete hint. one-time-code lets the browser offer a code from an SMS" } : row,
    ),
  ],

  events: [
    { name: "update:modelValue", payload: "string", description: "Fires on every change (v-model)" },
    { name: "complete", payload: "string", description: "Fires with the code when the last character is filled, and again when an edit reaches the last box of a full code. Correcting a middle character does not fire it" },
  ],

  methods: [
    { name: "el", signature: "HTMLElement | null", description: "The root element" },
    { name: "focus", signature: "(opts?: FocusOptions) => void", description: "Focus the code, with the caret in the first empty box" },
    { name: "blur", signature: "() => void", description: "Blur the code" },
  ],

  tokens: [
    { name: "--cui-pin-input-height", default: "per size", description: "Width and height of each box" },
    { name: "--cui-pin-input-gap", default: "per size", description: "Space between boxes" },
    { name: "--cui-pin-input-font-size", default: "per size", description: "Character size" },
    { name: "--cui-pin-input-color", default: "var(--cui-text-body)", description: "Character color" },
    { name: "--cui-pin-input-bg", default: "var(--cui-surface-base)", description: "Box background" },
    { name: "--cui-pin-input-border", default: "1px solid var(--cui-border-strong)", description: "Box border" },
    { name: "--cui-pin-input-radius", default: "var(--cui-button-radius)", description: "Box corner radius" },
    { name: "--cui-pin-input-focus-border", default: "var(--cui-{color})", description: "Border of the box the caret is in" },
    { name: "--cui-pin-input-focus-ring", default: "var(--cui-{color}-focus-ring)", description: "Ring around the box the caret is in" },
  ],
};

export default meta;

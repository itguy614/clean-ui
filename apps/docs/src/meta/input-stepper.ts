import type { ComponentMeta } from "./types";

const meta: ComponentMeta = {
  name: "Input Stepper",
  description:
    "A numeric input with increment/decrement buttons — for quantities, counters, and settings that adjust in discrete steps. Supports horizontal and vertical orientations, wrap-around, and zero-padded display.",
  interactive: true,

  props: [
    { name: "modelValue", type: "number", default: "0", description: "Current value (v-model)" },
    { name: "min", type: "number", description: "Minimum value" },
    { name: "max", type: "number", description: "Maximum value" },
    { name: "step", type: "number", default: "1", description: "Step increment" },
    { name: "orientation", type: "horizontal | vertical", default: "horizontal", description: "Button layout direction" },
    {
      name: "size",
      type: "xs | sm | md | lg | xl",
      default: "md",
      description: "Size, from the shared input scale — matches CuiInput and CuiSelect at the same value",
    },
    { name: "color", type: "primary | secondary | success | error | warning | info", default: "primary", description: "Button color role" },
    { name: "pad", type: "number", description: "Zero-pad display to this width (e.g. 2 shows 05)" },
    { name: "wrap", type: "boolean", default: "false", description: "Wrap around from max to min and vice versa" },
    { name: "disabled", type: "boolean", default: "false", description: "Disabled state" },
    { name: "label", type: "string", description: "Label text above the control" },
    { name: "hidden", type: "boolean", default: "false", description: "Hide the component (v-show)" },
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
  ],

  events: [{ name: "update:modelValue", payload: "number", description: "Fires when the value changes (v-model)" }],

  tokens: [
    { name: "--cui-input-stepper-height", default: "per size", description: "Control height" },
    { name: "--cui-input-stepper-field-width", default: "3 × font size", description: "Width of the numeric field" },
    { name: "--cui-input-stepper-font-size", default: "per size", description: "Value and label font size" },
    { name: "--cui-input-stepper-border", default: "1px solid var(--cui-border-strong)", description: "Control border" },
    { name: "--cui-input-stepper-radius", default: "var(--cui-button-radius)", description: "Corner radius" },
    { name: "--cui-input-stepper-bg", default: "var(--cui-surface-base)", description: "Field background" },
    { name: "--cui-input-stepper-color", default: "var(--cui-text-body)", description: "Value color" },
    { name: "--cui-input-stepper-label-color", default: "var(--cui-text-secondary)", description: "Label color" },
    {
      name: "--cui-control-min-target",
      default: "24px",
      description: "Shared minimum target size (WCAG 2.5.8), applied to every form control",
    },
  ],
};

export default meta;

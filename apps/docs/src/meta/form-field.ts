import type { ComponentMeta } from "./types";
import { hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Form Field",
  description:
    "Wraps any control with a label, required marker, help text and error message — and wires the three ids that tie them together. Inside a CuiForm, a name also binds the control's value and error.",

  props: [
    { name: "label", type: "string", description: "Label text. Rendered as a real <label> with for and an id, both of which reach the control through the slot bindings" },
    { name: "labelPosition", type: "top | left | floating", default: "top", description: "top stacks label over control; left puts them side by side with an 8rem label column; floating puts the label inside the control: resting over an empty one, and shrunk into the top of the box above the value on focus or a value, with the control one size step taller (md 48px, lg 56px, xl 64px). floating needs an md, lg or xl native input or textarea (CuiInput without an attached button, CuiTextarea, CuiMaskedInput, a horizontal CuiInputStepper) given the field's id through the slot bindings; any other control, or an xs or sm one, gets a top label and a console warning" },
    { name: "for", type: "string", default: "auto", description: "The control's id. Omit it and the field generates one once, at setup — not in a computed, so it survives re-renders" },
    { name: "name", type: "string", description: "Field name — also the key into the form's values and errors. With a name and a parent CuiForm the field binds value and error automatically. Dot-paths work: address.city" },
    { name: "required", type: "boolean", default: "false", description: "Show the required marker. It is decoration only — see Known gaps" },
    { name: "requiredText", type: "string", description: "Replace the asterisk with a word, rendered as a small error-tinted chip" },
    { name: "helpText", type: "string", description: "Explanatory line below the control. Replaced by the error message while there is one" },
    { name: "error", type: "boolean", default: "false", description: "Error state. Ignored when the field is form-bound — the form is the source of truth then" },
    { name: "errorMessage", type: "string", description: "Error text. Also ignored when form-bound" },
    { name: "disabled", type: "boolean", default: "false", description: "Disabled state, handed to the control through the slot bindings and merged with the parent form's" },
    hiddenProp,
  ],

  slots: [
    {
      name: "default",
      payload: "{ id, ariaLabelledby, ariaDescribedby, error, disabled, modelValue, onUpdate:modelValue, readonly }",
      description:
        "The control. Spread the bindings with v-bind=\"f\". id, error and disabled are always there; ariaLabelledby only when there is a label; ariaDescribedby only when there is help text or an error to point at; the model bindings and readonly only when the field is form-bound",
    },
  ],
};

export default meta;

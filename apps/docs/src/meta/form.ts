import type { ComponentMeta } from "./types";
import { hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Form",
  description:
    "A form-level layer over the field components: value tracking, error aggregation, submit handling, and one library-agnostic validation hook. Fields stay usable standalone — binding is opt-in, via a name on CuiFormField.",

  props: [
    { name: "modelValue", type: "FormValues", default: "{}", description: "The value bag (v-model). Seeds the form and stays in sync. It is deep-cloned on the way in, so writing a dot-path never mutates your object" },
    { name: "resolver", type: "(values) => FormErrors | Promise<FormErrors>", description: "Validation. Return a map of field name to message; {} means valid. Sync or async — adapt zod, valibot, yup or your own predicate to this one signature" },
    { name: "validateOn", type: "submit | change", default: "submit", description: "When eager validation starts. submit validates on submit and then revalidates each field as it changes; change validates from the first keystroke, so it wants a cheap synchronous resolver" },
    { name: "disabled", type: "boolean", default: "false", description: "Disable every bound field. Merged with each field's own disabled, not overridden by it" },
    { name: "readonly", type: "boolean", default: "false", description: "Mark every bound field readonly. Passed through the slot bindings, so it only reaches name-bound fields" },
    hiddenProp,
  ],

  slots: [
    {
      name: "default",
      payload: "{ values, errors, submitted, submitting }",
      description: "The fields. submitting drives a submit button's loading state without a manual flag of your own",
    },
  ],

  events: [
    { name: "submit", payload: "FormValues", description: "A submit that passed validation. The native submit is intercepted and the form carries novalidate, so browser bubbles never appear" },
    { name: "submit-invalid", payload: "FormErrors", description: "A submit that failed validation, with the full error map" },
    { name: "update:modelValue", payload: "FormValues", description: "Fires on every bound-field change, as a fresh object — a parent watching without deep: true still reacts" },
  ],

  methods: [
    { name: "validate", signature: "() => Promise<FormErrors>", description: "Run the resolver now and publish the result. A slower run that has been superseded is discarded rather than overwriting a newer one" },
    { name: "submit", signature: "() => Promise<void>", description: "Submit programmatically, exactly as the form's own submit event does. Re-entrant calls while a submit is in flight are ignored" },
    { name: "reset", signature: "(values?: FormValues) => void", description: "Reset to the given values, or back to modelValue. Clears errors and the submitted flag" },
    { name: "setErrors", signature: "(errors: FormErrors) => void", description: "Set the error map by hand — how you land a 422's field errors on the right fields. Bumps the validation token, so an in-flight resolver cannot overwrite what the server just said" },
    { name: "values", signature: "Ref<FormValues>", description: "The live value bag" },
    { name: "errors", signature: "Ref<FormErrors>", description: "The live error map" },
    { name: "submitting", signature: "Ref<boolean>", description: "True while a submit is in flight, including an async resolver" },
  ],
};

export default meta;

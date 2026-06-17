import type { InjectionKey, Ref } from "vue";

/** A form's value bag. Keys are field names (dot-paths allowed, e.g. "address.city"). */
export type FormValues = Record<string, unknown>;

/** Validation errors keyed by field name. An empty object means "valid". */
export type FormErrors = Record<string, string>;

/**
 * A resolver turns the current values into an errors map. It is library-agnostic:
 * adapt zod/valibot/yup/custom logic to this signature. Return `{}` when valid.
 * May be sync or async.
 */
export type FormResolver = (values: FormValues) => FormErrors | Promise<FormErrors>;

/** When validation runs. Always validates on submit; this controls eager behaviour. */
export type FormValidateOn = "submit" | "change";

/**
 * Shared context a `CuiForm` provides to descendant `CuiFormField`s.
 * Field components never inject this directly — they stay standalone; only the
 * form-aware `CuiFormField` wrapper wires a field to the form.
 */
export interface FormContext {
  /** Reactive value bag. */
  values: Ref<FormValues>;
  /** Reactive errors keyed by field name. */
  errors: Ref<FormErrors>;
  /** Whether the form has been submitted at least once (drives revalidation). */
  submitted: Ref<boolean>;
  /** Form-wide disabled flag (fields merge this with their own). */
  disabled: Ref<boolean>;
  /** Form-wide readonly flag. */
  readonly: Ref<boolean>;
  /** Read a field's value (supports dot-paths). */
  getValue: (name: string) => unknown;
  /** Write a field's value (supports dot-paths); revalidates per `validateOn`. */
  setValue: (name: string, value: unknown) => void;
  /** Re-run validation and update just this field's error. */
  validateField: (name: string) => void;
  /** Track a mounted field (for aggregation + pruning stale errors). */
  registerField: (name: string) => void;
  /** Stop tracking a field on unmount. */
  unregisterField: (name: string) => void;
}

export const FormContextKey: InjectionKey<FormContext> = Symbol("cui-form");

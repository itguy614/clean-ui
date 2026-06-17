<script setup lang="ts">
import { ref, computed, provide, watch } from "vue";
import type { HideableProps, DisableableProps } from "../types/common";
import {
  FormContextKey,
  type FormValues,
  type FormErrors,
  type FormResolver,
  type FormValidateOn,
} from "./form-context";

export interface CuiFormProps extends HideableProps, DisableableProps {
  /** Form values (v-model). Use to seed initial values and stay in sync. */
  modelValue?: FormValues;
  /** Library-agnostic validation: (values) => errors map (sync or async). */
  resolver?: FormResolver;
  /**
   * When eager validation kicks in. `"submit"` (default) validates on submit,
   * then revalidates a field whenever it changes. `"change"` validates from the
   * very first keystroke.
   */
  validateOn?: FormValidateOn;
  /** Make every field readonly. */
  readonly?: boolean;
}

const props = withDefaults(defineProps<CuiFormProps>(), {
  validateOn: "submit",
  disabled: false,
  readonly: false,
  hidden: false,
});

const emit = defineEmits<{
  "update:modelValue": [values: FormValues];
  /** Fired after a submit that passed validation. */
  submit: [values: FormValues];
  /** Fired after a submit that failed validation. */
  "submit-invalid": [errors: FormErrors];
}>();

// --- Value bag ----------------------------------------------------------------
// Deep-clone the seed so nested objects aren't shared with the parent's object
// (in-place writes to a dot-path must not mutate the caller's state).
function seed(source?: FormValues): FormValues {
  if (!source) return {};
  try {
    return structuredClone(source);
  } catch {
    return { ...source };
  }
}

// Internal source of truth. We keep our own ref so the form works uncontrolled
// (no v-model) too; when controlled we sync both ways.
const values = ref<FormValues>(seed(props.modelValue));
const errors = ref<FormErrors>({});
const submitted = ref(false);
const submitting = ref(false);

// Monotonic token so a slower async validation can't clobber a newer one.
let validateSeq = 0;

// External modelValue changes flow in (e.g. parent reset/prefill).
watch(
  () => props.modelValue,
  (next) => {
    if (next && next !== values.value) values.value = seed(next);
  },
  { deep: true },
);

// --- Dot-path get/set (supports nested schemas like "address.city") ----------
function getPath(obj: FormValues, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

function setPath(obj: FormValues, path: string, value: unknown): void {
  const keys = path.split(".");
  let cursor = obj as Record<string, unknown>;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (typeof cursor[key] !== "object" || cursor[key] === null) cursor[key] = {};
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[keys[keys.length - 1]] = value;
}

// --- Validation ---------------------------------------------------------------
async function runResolver(): Promise<FormErrors> {
  if (!props.resolver) return {};
  return (await props.resolver(values.value)) ?? {};
}

/** Validate the whole form; sets `errors` and returns the errors map. */
async function validate(): Promise<FormErrors> {
  const seq = ++validateSeq;
  const result = await runResolver();
  // Only publish to the UI if a newer validation hasn't started meanwhile.
  if (seq === validateSeq) errors.value = result;
  return result;
}

/**
 * Re-run validation but update only the changed field's error, leaving untouched
 * fields pristine. Resolvers validate the whole object, so in `"change"` mode this
 * expects a cheap/sync resolver (one run per keystroke).
 */
async function validateField(name: string): Promise<void> {
  const seq = ++validateSeq;
  const result = await runResolver();
  if (seq !== validateSeq) return; // superseded by a newer validation
  const next = { ...errors.value };
  if (result[name]) next[name] = result[name];
  else delete next[name];
  errors.value = next;
}

function getValue(name: string): unknown {
  return getPath(values.value, name);
}

function setValue(name: string, value: unknown): void {
  setPath(values.value, name, value);
  // Emit a fresh object so parents using a non-deep watcher still react.
  emit("update:modelValue", { ...values.value });
  if (props.validateOn === "change" || submitted.value) void validateField(name);
}

/**
 * Drop a field's error when it unmounts (e.g. a conditionally-shown field) so
 * stale errors for fields the user can no longer fix don't linger in the map.
 */
function unregisterField(name: string): void {
  if (!(name in errors.value)) return;
  const next = { ...errors.value };
  delete next[name];
  errors.value = next;
}

// --- Submit / reset (also exposed) -------------------------------------------
async function submit(): Promise<void> {
  if (submitting.value) return; // guard against concurrent double-submit
  submitting.value = true;
  submitted.value = true;
  try {
    const result = await validate();
    if (Object.keys(result).length === 0) emit("submit", values.value);
    else emit("submit-invalid", result);
  } finally {
    submitting.value = false;
  }
}

function reset(next?: FormValues): void {
  values.value = seed(next ?? props.modelValue);
  errors.value = {};
  submitted.value = false;
  emit("update:modelValue", { ...values.value });
}

/**
 * Imperatively set the error map — typically to surface server-side validation
 * (e.g. a 422 response) on the matching fields. Bumps the validation token so an
 * in-flight resolver run can't overwrite what the server just told us.
 */
function setErrors(next: FormErrors): void {
  validateSeq++;
  errors.value = { ...next };
}

provide(FormContextKey, {
  values,
  errors,
  submitted,
  disabled: computed(() => props.disabled),
  readonly: computed(() => props.readonly),
  getValue,
  setValue,
  validateField,
  unregisterField,
});

defineExpose({ validate, reset, submit, setErrors, values, errors, submitting });
</script>

<template>
  <form v-show="!hidden" class="cui-form" novalidate @submit.prevent="submit">
    <slot :values="values" :errors="errors" :submitted="submitted" :submitting="submitting" />
  </form>
</template>

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
// Deep-reactive internal copy seeded from modelValue. We keep our own ref so the
// form works uncontrolled (no v-model) too; when controlled we sync both ways.
const values = ref<FormValues>({ ...(props.modelValue ?? {}) });
const errors = ref<FormErrors>({});
const submitted = ref(false);
const registered = new Set<string>();

// External modelValue changes flow in (e.g. parent reset/prefill).
watch(
  () => props.modelValue,
  (next) => {
    if (next && next !== values.value) values.value = { ...next };
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
  const result = await runResolver();
  errors.value = result;
  return result;
}

/** Validate, but only update the error for a single field (used on change). */
async function validateField(name: string): Promise<void> {
  const result = await runResolver();
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
  emit("update:modelValue", values.value);
  if (props.validateOn === "change" || submitted.value) void validateField(name);
}

function registerField(name: string): void {
  registered.add(name);
}

function unregisterField(name: string): void {
  registered.delete(name);
}

// --- Submit / reset (also exposed) -------------------------------------------
async function submit(): Promise<void> {
  submitted.value = true;
  const result = await validate();
  if (Object.keys(result).length === 0) emit("submit", values.value);
  else emit("submit-invalid", result);
}

function reset(next?: FormValues): void {
  values.value = { ...(next ?? props.modelValue ?? {}) };
  errors.value = {};
  submitted.value = false;
  emit("update:modelValue", values.value);
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
  registerField,
  unregisterField,
});

defineExpose({ validate, reset, submit, values, errors });
</script>

<template>
  <form v-show="!hidden" class="cui-form" novalidate @submit.prevent="submit">
    <slot :values="values" :errors="errors" :submitted="submitted" />
  </form>
</template>

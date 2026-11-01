<script setup lang="ts">
import { useMessages } from "../composables/useMessages";
import { computed, inject, onBeforeUnmount, onMounted, useTemplateRef, watch } from "vue";
import { useCuiId } from "../composables/useCuiId";
import type { HideableProps, DisableableProps } from "../types/common";
import { warnOnce } from "../utils/devWarn";
import { FormContextKey } from "./form-context";
import { useFloatingLabelProvider } from "./form-field-context";

/**
 * `floating` (#191) rests the label inside an empty control and floats it above on focus
 * or a value. It needs a control whose focus surface is a native `<input>`/`<textarea>`
 * (CuiInput, CuiTextarea, CuiMaskedInput, CuiInputStepper); with any other it is `top`.
 */
export type LabelPosition = "top" | "left" | "floating";

export interface CuiFormFieldProps extends HideableProps, DisableableProps {
  /** Label text */
  label?: string;
  /** Label position */
  labelPosition?: LabelPosition;
  /** HTML for attribute — ties label to a control by id */
  for?: string;
  /**
   * Field name. When set AND nested in a `CuiForm`, the field binds its value
   * and error to the form automatically (see the scoped-slot bindings). Omit it
   * to use the field standalone with manual `error` / `errorMessage` props.
   */
  name?: string;
  /** Mark field as required */
  required?: boolean;
  /** Custom required indicator text (replaces asterisk) */
  requiredText?: string;
  /** Help text below the control */
  helpText?: string;
  /** Show error state (standalone mode; ignored when form-bound) */
  error?: boolean;
  /** Error message below the control (standalone mode; ignored when form-bound) */
  errorMessage?: string;
}

const props = withDefaults(defineProps<CuiFormFieldProps>(), {
  labelPosition: "top",
  required: false,
  error: false,
  disabled: false,
  hidden: false,
});

// Optional form context — null when used standalone (no hard dependency).
const form = inject(FormContextKey, null);
const formBound = computed(() => !!props.name && !!form);

// Resolved error/message: from the form when bound, else from props.
const resolvedError = computed(() =>
  formBound.value ? !!form!.errors.value[props.name!] : !!props.error,
);
const resolvedMessage = computed(() =>
  formBound.value ? form!.errors.value[props.name!] : props.errorMessage,
);
const showError = computed(() => resolvedError.value && resolvedMessage.value);

const isDisabled = computed(() => props.disabled || (form?.disabled.value ?? false));

// Generated once in setup, so it is stable across re-renders and matches the server render.
// Called unconditionally: skipping useId() when `for` is set would shift the id of every
// later component in the app, so a server/client difference in `for` would mismatch them all.
const generatedId = useCuiId("field");
const fieldId = props.for ?? generatedId;
// Ids for the label and the help/error text, so the control can point at them.
// `for`/`id` alone is not enough: it only forms an association with *labelable*
// elements, which leaves a control like CuiSelect — whose focusable surface is a
// `div[role="combobox"]` — with no accessible name at all (#78).
const messages = useMessages();
const labelId = `${fieldId}-label`;
const descriptionId = `${fieldId}-description`;

// The <label for> does nothing when its control isn't labelable (CuiCheckbox, CuiRadio,
// CuiToggle, CuiSelect, CuiTimePicker, the groups — see the aria-labelledby note above):
// `control` is then null, and the click does what a native label would instead (#181).
const ACTIVATED = new Set(["checkbox", "switch", "radio"]);
const elementDisabled = (el: Element) => el.matches(":disabled, [aria-disabled='true']");

function onLabelClick(e: MouseEvent) {
  const label = e.currentTarget as HTMLLabelElement;
  if (label.control) return; // a native control: the browser's label activation has it
  // This label's own tree, not the document: ids can repeat across apps on one page, and a
  // shadow root's elements aren't in the document at all.
  const root = label.getRootNode() as Document | ShadowRoot;
  const el = root.getElementById?.(fieldId) ?? null;
  if (!el || elementDisabled(el)) return;
  // A group (a radiogroup's div) can't take focus itself: its tab stop, or first control.
  const target = (el as HTMLElement).tabIndex >= 0 ? el : el.querySelector<HTMLElement>('[tabindex="0"]');
  if (!(target instanceof HTMLElement) || elementDisabled(target)) return;
  target.focus();
  // As a native checkbox's or radio's label does, it toggles or selects too — the control's
  // own label only: a group's label moves focus in, it doesn't pick an option.
  if (target === el && ACTIVATED.has(target.getAttribute("role") ?? "")) target.click();
}

// Bindings handed to the default slot. `v-bind="f"` on a field component wires
// v-model + error in one shot. Standalone mode omits the model bindings.
const slotBindings = computed(() => {
  const base: Record<string, unknown> = {
    id: fieldId,
    error: resolvedError.value,
    disabled: isDisabled.value,
  };
  if (props.label) base.ariaLabelledby = labelId;
  // Required-ness is a *state*, not part of the name: exposed in forms mode and in AT field
  // summaries, and independent of whether the field has a label at all (#175).
  if (props.required) base.ariaRequired = true;
  // Only when there is something to describe — a dangling aria-describedby
  // pointing at an element that isn't rendered is worse than none.
  if (showError.value || props.helpText) base.ariaDescribedby = descriptionId;
  if (formBound.value) {
    base.modelValue = form!.getValue(props.name!);
    base["onUpdate:modelValue"] = (value: unknown) => form!.setValue(props.name!, value);
    base.readonly = form!.readonly.value;
  }
  return base;
});

// Floating label (#191). The control carrying this field's id marks itself if it supports
// floating (see form-field-context.ts); the layout and the resting/floated states are all
// CSS. Without a marked control the field stays a top label, and says why once, here.
useFloatingLabelProvider(() => (props.labelPosition === "floating" ? fieldId : null));

const rootEl = useTemplateRef<HTMLElement>("rootEl");
function checkFloatingSupport() {
  if (props.labelPosition !== "floating" || !props.label || !rootEl.value) return;
  if (rootEl.value.querySelector("[data-cui-float-label]")) return;
  warnOnce(
    `[clean-ui] CuiFormField: labelPosition="floating" needs a control with a native <input> or ` +
      `<textarea> (CuiInput, CuiTextarea, CuiMaskedInput, CuiInputStepper) given the field's id ` +
      `(v-bind the slot props). The control in "${props.label}" isn't one, so its label is ` +
      `shown on top instead.`,
  );
}
onMounted(checkFloatingSupport);
watch(() => [props.labelPosition, props.label], checkFloatingSupport, { flush: "post" });

// Clear this field's error from the form when it unmounts (e.g. conditionally
// shown fields) so stale errors don't linger in the aggregated map.
onBeforeUnmount(() => {
  if (props.name && form) form.unregisterField(props.name);
});
</script>

<template>
  <div
    ref="rootEl"
    v-show="!hidden"
    class="cui-form-field"
    :class="[
      `cui-form-field--${labelPosition}`,
      { 'cui-form-field--error': resolvedError },
    ]"
  >
    <!-- Label -->
    <label
      v-if="label"
      :id="labelId"
      :for="fieldId"
      class="cui-form-field__label"
      @click="onLabelClick"
    >
      <span class="cui-form-field__label-text">{{ label }}</span>
      <!-- The asterisk is decorative and aria-hidden, so it says nothing on its own. The
           state is carried by `aria-required` (forwarded through the slot bindings); this
           puts it in the visible label's text too, which is what a sighted screen-reader
           user hears when the label is read (#175). A `<template>` rather than two
           identical `v-if`s, so the `v-else-if` cannot silently re-anchor. -->
      <template v-if="required && !requiredText">
        <span class="cui-form-field__required" aria-hidden="true">*</span>
        <span class="cui-sr-only">{{ messages.formField.required }}</span>
      </template>
      <span v-else-if="required" class="cui-form-field__required-text">{{ requiredText }}</span>
    </label>

    <!-- Control + footer -->
    <div class="cui-form-field__body">
      <!-- Control slot -->
      <div class="cui-form-field__control">
        <slot v-bind="slotBindings" />
      </div>

      <!-- Footer: help text or error message -->
      <div v-if="showError" class="cui-form-field__error cui-field-error" :id="descriptionId">
        {{ resolvedMessage }}
      </div>
      <div v-else-if="helpText" class="cui-form-field__help" :id="descriptionId">
        {{ helpText }}
      </div>
    </div>
  </div>
</template>

<style scoped>

/* --- Base layout --- */
.cui-form-field {
  display: flex;
}

/* `floating` is `top` until its control says it can float (below), which is the fallback. */
.cui-form-field--top,
.cui-form-field--floating {
  flex-direction: column;
  gap: calc(0.375rem * var(--cui-density-scale, 1));
}

.cui-form-field--left {
  flex-direction: row;
  align-items: flex-start;
  gap: calc(1rem * var(--cui-density-scale, 1));
}

/* --- Label --- */
.cui-form-field__label {
  display: flex;
  align-items: center;
  gap: calc(0.25rem * var(--cui-density-scale, 1));
  font-size: 0.875rem;
  font-weight: 500;
  /* A private hook, so the floating label's resting state recolours it without a rule
     that outranks a consumer's own colour for the label (#191). */
  color: var(--_form-field-label-color, var(--cui-text-body));
  line-height: 1.4;
}

.cui-form-field--left .cui-form-field__label {
  min-width: 8rem;
  padding-top: calc(0.5rem * var(--cui-density-scale, 1)); /* align with input text */
  flex-shrink: 0;
}

/* The label is a flex row, so its height is whatever its tallest child is — and that must
   not depend on whether the field happens to be required, or a required field's control
   sits lower than the optional one beside it (#134).

   `line-height: inherit` on the markers, not a height on the label: the label already
   declares `line-height: 1.4`, but inheritance loses to any rule that matches the child
   directly — the docs' prose styles set spans to 1.5, and the scoped base sets 1.5 on every
   `cui-*` element. That made the marker's line box
   21px against the label text's 19.6px, and no height on the label can cap a child that
   is taller than it. Forcing the child to take the parent's computed value is what
   actually closes it. */
.cui-form-field__label-text {
  line-height: inherit;
}

.cui-form-field__required {
  color: var(--cui-error);
  font-weight: 600;
  line-height: inherit;
}

.cui-form-field__required-text {
  line-height: inherit;
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--cui-error);
  padding: calc(0.0625rem * var(--cui-density-scale, 1)) calc(0.375rem * var(--cui-density-scale, 1));
  border-radius: 0.25rem;
  background: var(--cui-error-bg);
}

/* --- Body (control + footer) --- */
.cui-form-field__body {
  display: flex;
  flex-direction: column;
  gap: calc(0.375rem * var(--cui-density-scale, 1));
  flex: 1;
  min-width: 0;
}

.cui-form-field__control {
  display: flex;
  flex-direction: column;
}

/* --- Floating label (#191) --- see form-field-context.ts for the mechanism.
   The label shares the control's grid cell, so it rests centred in an input. Floating is
   transform only: into the room `padding-top` reserves above the control, where a top label
   sits, so it needs no masking chip and never meets the help or error text. */
.cui-form-field--floating:has([data-cui-float-label]) {
  /* 14px → 12px floated. */
  --_form-field-float-scale: 0.8571;
  --_form-field-float-gap: calc(0.25rem * var(--cui-density-scale, 1));
  /* The floated label's line box: 0.875rem × line-height 1.4 × the scale. */
  --_form-field-float-line: calc(0.875rem * 1.4 * var(--_form-field-float-scale));
  /* The control's horizontal padding and font size, from the marker's size (md by default).
     form-field-float-sync.test.ts holds these to utils/sizing.ts. */
  --_form-field-float-px: 0.75rem;
  --_form-field-float-fs: 1rem;
  /* Where the control's text starts: its padding plus its 1px border. */
  --_form-field-float-inset: calc(var(--_form-field-float-px) * var(--cui-density-scale, 1) + 1px);
  /* A textarea's resting box: its first line plus top and bottom padding and borders, so
     the label's centre lands on that line. Its py is half its px at every size, so
     2 × py = px. */
  --_form-field-float-rest: calc(var(--_form-field-float-px) * var(--cui-density-scale, 1) + 1.6 * var(--_form-field-float-fs) + 2px);
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  row-gap: calc(0.375rem * var(--cui-density-scale, 1));
  padding-top: calc(var(--_form-field-float-line) + var(--_form-field-float-gap));
}

.cui-form-field--floating:has([data-cui-float-label~="xs"]) { --_form-field-float-px: 0.5rem; --_form-field-float-fs: 0.75rem; }
.cui-form-field--floating:has([data-cui-float-label~="sm"]) { --_form-field-float-px: 0.625rem; --_form-field-float-fs: 0.8125rem; }
.cui-form-field--floating:has([data-cui-float-label~="lg"]) { --_form-field-float-px: 0.875rem; --_form-field-float-fs: 1.0625rem; }
.cui-form-field--floating:has([data-cui-float-label~="xl"]) { --_form-field-float-px: 1rem; --_form-field-float-fs: 1.125rem; }
/* TEXTAREA_SIZE_SCALE's px differs from the input's. */
.cui-form-field--floating:has([data-cui-float-label="multiline xs"]) { --_form-field-float-px: 0.5rem; }
.cui-form-field--floating:has([data-cui-float-label="multiline sm"]) { --_form-field-float-px: 0.75rem; }
.cui-form-field--floating:has([data-cui-float-label="multiline md"]) { --_form-field-float-px: 1rem; }
.cui-form-field--floating:has([data-cui-float-label="multiline lg"]) { --_form-field-float-px: 1.25rem; }
.cui-form-field--floating:has([data-cui-float-label="multiline xl"]) { --_form-field-float-px: 1.5rem; }

/* The body's children join the field's grid: the control in row 1 beside the label, the
   help or error text in row 2. */
.cui-form-field--floating:has([data-cui-float-label]) > .cui-form-field__body {
  display: contents;
}

.cui-form-field--floating:has([data-cui-float-label]) > .cui-form-field__body > .cui-form-field__control {
  grid-area: 1 / 1;
}

.cui-form-field--floating:has([data-cui-float-label]) > .cui-form-field__body > :not(.cui-form-field__control) {
  grid-area: 2 / 1;
}

.cui-form-field--floating:has([data-cui-float-label]) > .cui-form-field__label {
  /* 1 left to right, -1 right to left: the side the label floats back to. */
  --_form-field-float-dir: 1;
  grid-area: 1 / 1;
  /* Above the control's background. */
  z-index: 1;
  justify-self: start;
  align-self: stretch;
  min-width: 0;
  /* Floated it may use the field's whole width, at its smaller scale. */
  max-width: calc(100% / var(--_form-field-float-scale));
  margin-inline-start: var(--_form-field-float-inset);
  transform-origin: left center;
  /* Floated: back to the field's start edge, above the control. */
  transform:
    translateX(calc(-1 * var(--_form-field-float-dir) * var(--_form-field-float-inset)))
    translateY(calc(-50% - var(--_form-field-float-gap) - var(--_form-field-float-line) / 2))
    scale(var(--_form-field-float-scale));
  transition:
    transform var(--cui-duration-fast) var(--cui-ease-in-out),
    color var(--cui-duration-fast) ease;
}

.cui-form-field--floating:has([data-cui-float-label]) > .cui-form-field__label:dir(rtl) {
  --_form-field-float-dir: -1;
  transform-origin: right center;
}

.cui-form-field--floating:has([data-cui-float-label~="multiline"]) > .cui-form-field__label {
  align-self: start;
  height: var(--_form-field-float-rest);
}

.cui-form-field--floating:has([data-cui-float-label]) > .cui-form-field__label > .cui-form-field__label-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Resting: nothing focused in the field, and the control empty — its single-space
   placeholder showing. A control's own placeholder is not `" "`, so it never rests over
   one; nor while the browser has autofilled it, which can show a value before the page can
   read it. A browser without `:autofill` drops this rule, and the label just stays up. */
.cui-form-field--floating:not(:focus-within):has([data-cui-float-label][placeholder=" "]:placeholder-shown:not(:autofill)) > .cui-form-field__label {
  --_form-field-label-color: var(--cui-text-secondary);
  transform: none;
  /* Over the control: out of the way of its clicks and caret, and clear of a trailing clear
     button or password toggle. */
  pointer-events: none;
  max-width: calc(100% - var(--_form-field-float-inset) - 2rem);
}

/* --- Help text --- */
.cui-form-field__help {
  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--cui-text-secondary);
}
</style>

import type { ComponentMeta } from "./types";
import { disabledProp, hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Time Picker",
  description:
    "A time field with a popover holding vertical steppers for hours and minutes, in 12-hour (AM/PM) or 24-hour form.",
  interactive: true,

  props: [
    { name: "modelValue", type: "string", default: '""', description: 'Time value (v-model). "HH:mm" in 24-hour form, "hh:mm AM" in 12-hour. Both are accepted on the way in; the emitted shape follows format' },
    { name: "format", type: "12 | 24", default: "12", description: "Clock format. It drives the AM/PM column, the hour bounds (1–12 vs 0–23) and the emitted string" },
    { name: "minuteStep", type: "number", default: "1", description: "How far one step moves the minute stepper — 15 for quarter-hour slots" },
    { name: "minTime", type: "string", description: 'Earliest selectable time, as "HH:mm" or "hh:mm AM/PM" (the forms the model takes). The steppers stop there instead of wrapping, their aria-valuemin/max follow it, and nothing earlier is committed. An invalid range, or min after max, warns in development and is ignored' },
    { name: "maxTime", type: "string", description: "Latest selectable time. Same form and rules as minTime. An AM/PM button with no selectable time is disabled" },
    { name: "placeholder", type: "string", description: 'Text shown when there is no value. Defaults to "hh:mm AM", or "hh:mm" in 24-hour form' },
    { name: "label", type: "string", description: "Label text above the trigger. It names the trigger through aria-labelledby" },
    { name: "size", type: "xs | sm | md | lg | xl", default: "md", description: "Trigger height, padding and font size, taken from the shared input scale so it lines up with CuiInput and CuiDatePicker" },
    disabledProp,
    hiddenProp,
    { name: "id", type: "string", description: "id of the trigger. CuiFormField supplies it automatically" },
    { name: "aria-describedby", type: "string", description: "id(s) of describing text. CuiFormField points this at its help text or error message" },
    { name: "aria-labelledby", type: "string", description: "id(s) of the labelling element. This is what actually names the control — the trigger is a div[role=combobox], not a labelable element. CuiFormField wires it for you" },
  ],

  events: [
    { name: "update:modelValue", payload: "string", description: "Fires on every hour, minute and AM/PM change — not only on close" },
  ],

  tokens: [
    { name: "--cui-time-picker-height", default: "per size", description: "Trigger height" },
    { name: "--cui-time-picker-px", default: "per size", description: "Trigger horizontal padding" },
    { name: "--cui-time-picker-font-size", default: "per size", description: "Trigger font size" },
    { name: "--cui-time-picker-color", default: "var(--cui-text-body)", description: "Trigger text colour (an empty trigger shows its placeholder in --cui-text-tertiary)" },
    { name: "--cui-time-picker-bg", default: "var(--cui-surface-base)", description: "Trigger background" },
    { name: "--cui-time-picker-border", default: "var(--cui-border-strong)", description: "Trigger border color" },
    { name: "--cui-time-picker-radius", default: "var(--cui-radius-md)", description: "Trigger corner radius" },
    { name: "--cui-time-picker-pressed-bg", default: "var(--cui-primary-bg)", description: "Background of the selected AM or PM button. Set it where the panel can see it: the panel is teleported to <body>, so on :root or <body>, not on the picker's container" },
    { name: "--cui-time-picker-pressed-color", default: "var(--cui-primary)", description: "Text color of the selected AM or PM button" },
  ],

  methods: [
    { name: "focus", signature: "(options?: FocusOptions) => void", description: "Focus the trigger" },
    { name: "blur", signature: "() => void", description: "Blur the trigger" },
    { name: "el", signature: "HTMLElement | null", description: "The root element. The trigger is the focusable part, not this" },
  ],
};

export default meta;

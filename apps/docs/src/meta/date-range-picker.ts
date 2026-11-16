import type { ComponentMeta } from "./types";
import { disabledProp, hiddenProp, nativeControlProps } from "./shared";

const meta: ComponentMeta = {
  name: "Date Range Picker",
  description:
    "Start and end dates from one calendar, with the same constraints as CuiDatePicker plus the option to refuse a range that spans a blackout date.",
  interactive: true,

  props: [
    { name: "modelValue", type: "{ start, end }", description: "Selected range (v-model). Each side is an ISO string, a Date, or null" },
    { name: "format", type: "string", default: "MM/DD/YYYY", description: "Display pattern for both fields. It also sets their width, in ch" },
    { name: "valueType", type: "iso | date", default: "iso", description: "What each side of the emitted range is — an ISO string or a Date object" },
    { name: "highlightToday", type: "boolean", default: "true", description: "Tint today in the grid" },
    { name: "minDate", type: "string", description: "Earliest selectable date, as an ISO string" },
    { name: "maxDate", type: "string", description: "Latest selectable date, as an ISO string" },
    { name: "disabledDate", type: "(date: Date) => boolean", description: "Per-date predicate — return true to disable" },
    { name: "disabledDates", type: "(string | { from, to })[]", description: "Blackout list: ISO strings, inclusive { from, to } ranges, or a mix" },
    { name: "blockSpanningBlackout", type: "boolean", default: "true", description: "Refuse a range that contains a disabled date. The second click is ignored rather than erroring — the range simply does not commit" },
    { name: "separator", type: "string", default: "→", description: "Text between the two fields" },
    { name: "startPlaceholder", type: "string", description: "Placeholder for the start field. Defaults to the format, lower-cased" },
    { name: "endPlaceholder", type: "string", description: "Placeholder for the end field. Defaults to the format, lower-cased" },
    { name: "label", type: "string", description: "Label text above the control. It names both date inputs through aria-labelledby" },
    { name: "size", type: "xs | sm | md | lg | xl", default: "md", description: "Trigger height, padding and font size, from the shared input scale, so it lines up with CuiInput, CuiDatePicker and CuiTimePicker" },
    disabledProp,
    hiddenProp,
    ...nativeControlProps,
  ],

  events: [
    { name: "update:modelValue", payload: "{ start, end }", description: "Fires once, when the second date completes the range. Picking start first does not emit" },
  ],

  tokens: [
    { name: "--cui-date-range-picker-height", default: "per size", description: "Trigger height" },
    { name: "--cui-date-range-picker-px", default: "per size", description: "Trigger horizontal padding" },
    { name: "--cui-date-range-picker-font-size", default: "per size", description: "Font size of the start and end fields" },
    { name: "--cui-date-range-picker-bg", default: "var(--cui-surface-base)", description: "Trigger background" },
    { name: "--cui-date-range-picker-border", default: "var(--cui-border-strong)", description: "Trigger border color" },
    { name: "--cui-date-range-picker-radius", default: "var(--cui-radius-md)", description: "Trigger corner radius" },
    { name: "--cui-date-range-picker-pressed-bg", default: "var(--cui-primary)", description: "Background of the range's start and end days. Set it where the calendar can see it: the panel is teleported to <body>, so on :root or <body>, not on the picker's container" },
    { name: "--cui-date-range-picker-pressed-color", default: "var(--cui-primary-text)", description: "Text color of the range's start and end days" },
  ],
};

export default meta;

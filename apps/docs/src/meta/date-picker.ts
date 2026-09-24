import type { ComponentMeta } from "./types";
import { disabledProp, hiddenProp, nativeControlProps } from "./shared";

const meta: ComponentMeta = {
  name: "Date Picker",
  description:
    "A masked date field with a calendar popover — custom formats, min/max bounds, blackout dates, a month-only mode, and month/year drill-down.",
  interactive: true,

  props: [
    { name: "modelValue", type: "string | Date | null", description: "Selected date (v-model). An ISO yyyy-mm-dd string, or a Date when valueType is date" },
    { name: "format", type: "string", default: "MM/DD/YYYY", description: "Display pattern. MM, DD, YYYY and MMM; it also derives the input mask and the placeholder" },
    { name: "valueType", type: "iso | date", default: "iso", description: "What v-model emits — an ISO string or a Date object" },
    { name: "mode", type: "date | month", default: "date", description: "date opens on the day grid; month opens on the month grid and commits as soon as a month is picked" },
    { name: "fillDay", type: "first | last", default: "first", description: "In month mode, which day of the chosen month the emitted value lands on" },
    { name: "highlightToday", type: "boolean", default: "true", description: "Tint today in the grid, and show the Today shortcut under it" },
    { name: "minDate", type: "string", description: "Earliest selectable date, as an ISO string" },
    { name: "maxDate", type: "string", description: "Latest selectable date, as an ISO string" },
    { name: "disabledDate", type: "(date: Date) => boolean", description: "Per-date predicate — return true to disable. Runs for all 42 cells of the visible month" },
    { name: "disabledDates", type: "(string | { from, to })[]", description: "Blackout list: ISO strings, inclusive { from, to } ranges, or a mix" },
    { name: "placeholder", type: "string", description: "Field placeholder. Defaults to the format, lower-cased" },
    { name: "label", type: "string", description: "Label text above the field. It renders as plain text with no for association — see Known gaps" },
    { name: "size", type: "sm | md | lg", default: "md", description: "Field height and font size, matching CuiInput at the same value" },
    disabledProp,
    hiddenProp,
    ...nativeControlProps,
  ],

  events: [
    { name: "update:modelValue", payload: "string | Date | null", description: "Fires when a date is selected in the grid, typed into the field, or chosen via Today" },
  ],

  methods: [
    { name: "focus", signature: "(options?: FocusOptions) => void", description: "Focus the field. Always passes preventScroll — the panel opens beside a trigger the user is already looking at" },
    { name: "blur", signature: "() => void", description: "Blur the field" },
    { name: "el", signature: "HTMLElement | null", description: "The root element" },
  ],
};

export default meta;

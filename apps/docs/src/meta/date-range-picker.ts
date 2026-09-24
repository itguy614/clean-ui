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
    { name: "label", type: "string", description: "Label text above the control. It renders as plain text with no for association — see Known gaps" },
    { name: "size", type: "sm | md | lg", default: "md", description: "Declared for parity with CuiDatePicker. The trigger does not currently vary with it" },
    disabledProp,
    hiddenProp,
    ...nativeControlProps,
  ],

  events: [
    { name: "update:modelValue", payload: "{ start, end }", description: "Fires once, when the second date completes the range. Picking start first does not emit" },
  ],
};

export default meta;

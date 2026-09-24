import type { ComponentMeta } from "./types";
import { disabledProp, hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Transfer List",
  description:
    "Two panels and a column of arrows for moving items between available and selected, with drag-and-drop and ordering on the selected side.",
  interactive: true,

  props: [
    { name: "items", type: "TransferListItem[]", description: "Every item, on both sides. Required. { value, label, description?, icon?, disabled? }" },
    { name: "modelValue", type: "(string | number)[]", default: "[]", description: "Values on the right-hand panel (v-model). Order is meaningful and preserved — this is the array the reorder arrows rewrite" },
    { name: "sourceTitle", type: "string", default: "Available", description: "Heading over the left panel" },
    { name: "targetTitle", type: "string", default: "Selected", description: "Heading over the right panel" },
    { name: "filterable", type: "boolean", default: "true", description: "Show a search field on each panel. Filtering is on label and description, case-insensitive" },
    { name: "sourcePlaceholder", type: "string", default: "Filter...", description: "Placeholder for the left search field" },
    { name: "targetPlaceholder", type: "string", default: "Filter...", description: "Placeholder for the right search field" },
    { name: "height", type: "string", default: "320px", description: "Max height of each scrolling list, as a CSS length" },
    { name: "size", type: "sm | md | lg", default: "md", description: "Item padding and font size" },
    disabledProp,
    hiddenProp,
  ],

  slots: [
    { name: "item", payload: "{ item, side }", description: "Replaces an item's body on both panels. side is 'source' or 'target'. The drag handle stays outside the slot" },
  ],

  events: [
    { name: "update:modelValue", payload: "(string | number)[]", description: "Fires on transfer, reorder and drop. Always the full right-hand array, in display order" },
  ],
};

export default meta;

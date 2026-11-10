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
    { name: "sourceTitle", type: "string", default: "Available (messages.transferList.source)", description: "Heading over the left panel" },
    { name: "targetTitle", type: "string", default: "Selected (messages.transferList.target)", description: "Heading over the right panel" },
    { name: "filterable", type: "boolean", default: "true", description: "Show a search field on each panel. Filtering is on label and description, case-insensitive" },
    { name: "sourcePlaceholder", type: "string", default: "Filter... (messages.transferList.filterPlaceholder)", description: "Placeholder for the left search field" },
    { name: "targetPlaceholder", type: "string", default: "Filter... (messages.transferList.filterPlaceholder)", description: "Placeholder for the right search field" },
    { name: "height", type: "string", default: "320px", description: "Max height of each scrolling list, as a CSS length" },
    { name: "size", type: "xs | sm | md | lg | xl", default: "md", description: "Item padding and font size. Styled at sm, md and lg; xs and xl take the nearest" },
    disabledProp,
    hiddenProp,
  ],

  slots: [
    { name: "item", payload: "{ item, side }", description: "Replaces an item's body on both panels. side is 'source' or 'target'. The drag handle stays outside the slot" },
  ],

  events: [
    { name: "update:modelValue", payload: "(string | number)[]", description: "Fires on transfer, reorder and drop. Always the full right-hand array, in display order" },
  ],

  tokens: [
    { name: "--cui-transfer-list-gap", default: "calc(0.5rem * density)", description: "Gap between the two panels and the move buttons" },
    { name: "--cui-transfer-list-bg", default: "var(--cui-surface-base)", description: "Panel background" },
    { name: "--cui-transfer-list-border", default: "1px solid var(--cui-border)", description: "Panel border shorthand" },
    { name: "--cui-transfer-list-radius", default: "0.5rem", description: "Panel corner radius" },
    { name: "--cui-transfer-list-px", default: "per size", description: "A row's horizontal padding" },
    { name: "--cui-transfer-list-py", default: "per size", description: "A row's vertical padding" },
    { name: "--cui-transfer-list-font-size", default: "per size", description: "A row's font size" },
    { name: "--cui-transfer-list-color", default: "var(--cui-text-body)", description: "A row's text color" },
    { name: "--cui-transfer-list-pressed-bg", default: "var(--cui-primary-bg)", description: "Background of a row marked for transfer" },
    { name: "--cui-transfer-list-focus-ring", default: "var(--cui-primary-focus-ring)", description: "Focus-visible outline color on a row" },
  ],
};

export default meta;

import type { ComponentMeta } from "./types";
import { disabledProp, hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Transfer List",
  description:
    "Two panels and a column of arrows for moving items between available and selected, with pointer drag between the lists (a ghost and a placeholder) and a sortable selected side (drag, keyboard grab, move buttons).",
  interactive: true,

  props: [
    { name: "items", type: "TransferListItem[]", description: "Every item, on both sides. Required. { value, label, description?, icon?, disabled? }" },
    { name: "modelValue", type: "(string | number)[]", default: "[]", description: "Values on the right-hand panel (v-model). Order is meaningful and preserved — this is the array a drag, a keyboard move or the reorder arrows rewrite" },
    { name: "sourceOrder", type: "(string | number)[]", description: "Order of the left list (v-model:sourceOrder). Unset, the left list is the unselected items in items order and cannot be reordered. Set, it is orderable: items it names come first in its order (values not on the left are ignored), the rest follow in items order. A reorder, or a row dropped into the left list at a slot, emits update:sourceOrder with every left value in order" },
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
    { name: "item", payload: "{ item, side }", description: "Replaces an item's body on both panels. side is 'source' or 'target'. On the target the sortable's drag handle stays outside the slot" },
  ],

  events: [
    { name: "update:sourceOrder", payload: "(string | number)[]", description: "Only with sourceOrder set: the left list was reordered, or a selected row was dropped into it at a slot. The whole left order. When a drop also changes the selected list, this fires first, then update:modelValue, once each" },
    { name: "update:modelValue", payload: "(string | number)[]", description: "Fires on transfer, on a reorder (once per drop, grab or button click) and on a drop between panels. Always the full right-hand array, in display order" },
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

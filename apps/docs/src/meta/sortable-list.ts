import type { ComponentMeta } from "./types";
import { disabledProp, hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Sortable List",
  description:
    "A reorderable list. Drag an item by its handle, grab it with the keyboard, or use its move buttons; the order is the v-model.",
  interactive: true,

  props: [
    { name: "modelValue", type: "T[]", description: "The items, in order (v-model). Replaced, never mutated: a move emits the new array. Required" },
    { name: "itemKey", type: "string | (item: T) => string | number", default: "id", description: "What identifies an item across reorders: the name of its key property, or a function. A primitive item is its own key. Keys must be unique and stable, so an item keeps its DOM and focus as it moves" },
    { name: "itemLabel", type: "(item: T) => string", description: "An item's name for assistive tech: its handle, its move buttons and every announcement. Unset, an object's label, name, title or text, or the item itself if it is a string" },
    { name: "label", type: "string", default: "Reorderable list (messages.sortableList.label)", description: "The list's accessible name" },
    { name: "orientation", type: "horizontal | vertical", default: "vertical", description: "The axis the items lie along: drag, arrow keys and move buttons follow it" },
    { name: "moveButtons", type: "boolean", default: "true", description: "Show Move up / Move down buttons on each item: the single-pointer alternative to dragging that WCAG 2.5.7 asks for. Turn them off only where another non-drag way to reorder is offered" },
    disabledProp,
    hiddenProp,
  ],

  slots: [
    { name: "item", payload: "{ item, index, grabbed, dragging }", description: "An item's content, beside its handle and move buttons. Default: the item's label" },
    { name: "handle", payload: "{ item, index }", description: "The drag handle's content, its grip icon. The button around it (the drag surface, the keyboard grab control) stays" },
  ],

  events: [
    { name: "update:modelValue", payload: "T[]", description: "The new order, after a drop (pointer or keyboard) or a move button. Not fired while an item is only grabbed or being dragged, nor when it is dropped where it started" },
    { name: "reorder", payload: "{ item: T, from: number, to: number }", description: "The one item that moved, with its old and new index. Fires with update:modelValue" },
  ],

  methods: [
    { name: "el", signature: "Ref<HTMLElement | null>", description: "The list's root element" },
    { name: "focus", signature: "() => void", description: "Focuses the list's tab stop: the handle of the item last focused, or the first" },
  ],

  tokens: [
    { name: "--cui-sortable-list-gap", default: "calc(0.5rem * density)", description: "Gap between items, and inside one" },
    { name: "--cui-sortable-list-bg", default: "var(--cui-surface-base)", description: "An item's background" },
    { name: "--cui-sortable-list-border", default: "1px solid var(--cui-border)", description: "An item's border shorthand" },
    { name: "--cui-sortable-list-radius", default: "var(--cui-radius-md)", description: "An item's corner radius" },
    { name: "--cui-sortable-list-px", default: "calc(0.5rem * density)", description: "An item's horizontal padding" },
    { name: "--cui-sortable-list-py", default: "calc(0.5rem * density)", description: "An item's vertical padding" },
    { name: "--cui-sortable-list-color", default: "var(--cui-text-body)", description: "An item's text color" },
    { name: "--cui-sortable-list-font-size", default: "inherit", description: "An item's font size" },
    { name: "--cui-sortable-list-pressed-bg", default: "var(--cui-primary-bg)", description: "Background of an item grabbed with the keyboard" },
    { name: "--cui-sortable-list-pressed-border", default: "1px solid var(--cui-primary-border)", description: "Border of an item grabbed with the keyboard" },
    { name: "--cui-sortable-list-focus-ring", default: "var(--cui-primary-focus-ring)", description: "Focus-visible outline color on a handle" },
    { name: "--cui-sortable-list-drag-rotate", default: "2deg", description: "The dragged item's tilt. 0deg keeps it level. Not applied under reduced motion" },
    { name: "--cui-sortable-list-drag-scale", default: "1.02", description: "How much larger the dragged item floats. 1 keeps its size. Not applied under reduced motion" },
    { name: "--cui-sortable-list-drag-opacity", default: "0.9", description: "The dragged item's opacity. 1 makes it opaque" },
  ],
};

export default meta;

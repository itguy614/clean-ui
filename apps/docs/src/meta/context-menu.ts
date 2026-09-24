import type { ComponentMeta } from "./types";
import { disabledProp, hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Context Menu",
  description:
    "A menu that opens at the pointer on right-click, at the focused element on Shift+F10, or wherever you ask via openAt(). Fills itself with the same item components CuiDropdown uses.",
  interactive: true,

  props: [
    {
      name: "trigger",
      type: "contextmenu | longpress | auto",
      default: "contextmenu",
      description:
        "Which gestures open it. auto is both — the native event for mouse and pen, a hold for touch. Turning on long-press makes the wrapped content unselectable by touch",
    },
    { name: "minWidth", type: "string", default: "12rem", description: "Minimum width of the menu panel" },
    {
      name: "longPressDelay",
      type: "number",
      default: "500",
      description: "How long a touch must be held before the menu opens, in ms",
    },
    {
      name: "longPressTolerance",
      type: "number",
      default: "10",
      description: "Movement that cancels a hold, in px — a drag or a scroll is not a press",
    },
    { ...disabledProp, description: "Prevents the menu opening by any route, including openAt()" },
    hiddenProp,
  ],

  slots: [
    { name: "default", description: "The content the gesture applies to. The wrapper is display: contents, so it adds no box" },
    { name: "menu", description: "Menu items — CuiDropdownItem, CuiDropdownCheckItem, CuiDropdownDivider, CuiDropdownHeader" },
  ],

  events: [
    { name: "open", payload: "x: number, y: number", description: "Opened, with the viewport coordinates it opened at" },
    { name: "close", payload: "—", description: "Closed, by Escape, a click outside, a scroll, or a selection" },
  ],
};

export default meta;

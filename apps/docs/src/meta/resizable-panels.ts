import type { ComponentMeta } from "./types";
import { hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Resizable Panels",
  description:
    "A split pane with a draggable handle between two panels. Horizontal or vertical, with minimum sizes for each side and an optional collapse threshold for the first.",
  interactive: true,

  props: [
    {
      name: "orientation",
      type: "horizontal | vertical",
      default: "horizontal",
      description: "Split axis — horizontal puts the panels side by side, vertical stacks them",
    },
    {
      name: "initialSize",
      type: "number",
      default: "50",
      description:
        "Starting size of the first panel, as a percentage of the container. Double-clicking the handle returns to this value",
    },
    {
      name: "minFirst",
      type: "number",
      default: "100",
      description: "Minimum size of the first panel, in px. Dragging stops here",
    },
    { name: "minSecond", type: "number", default: "100", description: "Minimum size of the second panel, in px" },
    {
      name: "collapseThreshold",
      type: "number",
      default: "0",
      description:
        "Drag the first panel below this width in px and it collapses to nothing; 0 disables collapsing. Set minFirst below it, or the drag stops before it can be reached",
    },
    hiddenProp,
  ],

  slots: [
    { name: "first", description: "Left (horizontal) or top (vertical) panel. Scrolls on its own overflow" },
    { name: "second", description: "Right or bottom panel. Takes whatever room the first one leaves" },
  ],

  events: [
    {
      name: "resize",
      payload: "number",
      description: "The first panel's new size as a percentage. Fires on every pointer move during a drag, on each key that moves the handle, and once on double-click reset (clamped to minFirst/minSecond)",
    },
    {
      name: "collapse",
      payload: "boolean",
      description: "Fires when the first panel crosses collapseThreshold in either direction — by drag, arrow keys or Enter, or a double-click reset reopening it",
    },
  ],

  methods: [
    { name: "el", signature: "HTMLElement | null", description: "The root element" },
    { name: "focus", signature: "(opts?: FocusOptions) => void", description: "Focus the handle" },
    { name: "blur", signature: "() => void", description: "Blur the handle" },
  ],
};

export default meta;

import type { ComponentMeta } from "./types";
import { colorOrCssProp, hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Divider",
  description:
    "A horizontal or vertical rule, optionally with a label sitting in a gap in the line. Use it to group content within a region — a page's structure should come from headings and landmarks, not from lines.",

  props: [
    { name: "orientation", type: "horizontal | vertical", default: "horizontal", description: "Line direction" },
    { name: "variant", type: "solid | dashed | dotted", default: "solid", description: "Line style" },
    {
      name: "label",
      type: "string",
      default: "—",
      description: "Text label, drawn in a gap in the line. The default slot overrides it",
    },
    {
      name: "labelPosition",
      type: "start | center | end",
      default: "center",
      description: "Where the label sits along the line. start and end drop the line segment on that side",
    },
    {
      name: "spacing",
      type: "string",
      default: "0",
      description:
        "Margin above and below (horizontal) or left and right (vertical). A raw CSS length, not the Tailwind spacing scale",
    },
    colorOrCssProp(
      "Line and label color — unset means var(--cui-border) for the line and the tertiary text color for the label",
    ),
    hiddenProp,
  ],

  slots: [
    {
      name: "default",
      description: "Label content — a badge, an icon, a step counter. Takes the place of the label prop",
    },
  ],

  tokens: [
    { name: "--cui-divider-border", default: "1px <variant> var(--cui-border)", description: "The line's whole border shorthand (width, style, colour). Overrides the variant and color props" },
    { name: "--cui-divider-color", default: "var(--cui-text-tertiary)", description: "The label's text colour only, not the line (that is --cui-divider-border). Overrides the color prop" },
    { name: "--cui-divider-font-size", default: "0.75rem", description: "The label's text size" },
  ],
};

export default meta;

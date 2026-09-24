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
};

export default meta;

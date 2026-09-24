import type { ComponentMeta } from "./types";
import { colorProp, hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Timeline",
  description:
    "A vertical run of events — an activity feed, a changelog, an order's progress. Composed from CuiTimeline and CuiTimelineItem.",

  parts: [
    {
      name: "CuiTimeline",
      props: [hiddenProp],
      slots: [{ name: "default", description: "CuiTimelineItem elements, in the order they should read" }],
    },
    {
      name: "CuiTimelineItem",
      props: [
        colorProp("Colour of the dot, or of the icon and its tinted disc"),
        {
          name: "icon",
          type: "string",
          description: "Icon name — replaces the plain dot with a larger tinted disc. Must be in the static icon registry",
        },
        { name: "title", type: "string", description: "Event title" },
        { name: "timestamp", type: "string", description: "Timestamp or meta text, set beside the title" },
        {
          name: "last",
          type: "boolean",
          default: "false",
          description: "Drop the connector line below the marker, and the trailing space. Set it on the final item",
        },
        hiddenProp,
      ],
      slots: [
        { name: "default", description: "Body text under the title" },
        { name: "icon", description: "Replaces the dot entirely — an avatar, a spinner, a number" },
      ],
    },
  ],
};

export default meta;

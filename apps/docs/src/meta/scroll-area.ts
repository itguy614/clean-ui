import type { ComponentMeta } from "./types";
import { hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Scroll Area",
  description:
    "A scroll container that fades its content out at an edge with more past it, and can mark that edge with an arrow or a scroll button. Once its content overflows it becomes a named, focusable region, so a keyboard can scroll it.",
  interactive: true,

  props: [
    { name: "orientation", type: "vertical | horizontal", default: "vertical", description: "Which axis scrolls" },
    {
      name: "fade",
      type: "boolean",
      default: "true",
      description: "Fade the content out at each edge that has more past it, with a mask, so it works on any background",
    },
    {
      name: "indicator",
      type: "none | arrow | button",
      default: "none",
      description:
        "An arrow at each edge with more content. `arrow` is decorative; `button` scrolls by about three-quarters of the visible size when clicked. Neither is focusable",
    },
    {
      name: "indicatorVisibility",
      type: "auto | always",
      default: "auto",
      description: "`auto` shows an indicator only where there is more; `always` shows both, disabling the one with nothing to reveal",
    },
    {
      name: "startIcon",
      type: "string | Component",
      default: "caret",
      description: "The start edge's icon: a registered name or an icon component. The default caret follows the page direction",
    },
    { name: "endIcon", type: "string | Component", default: "caret", description: "The end edge's icon" },
    {
      name: "region",
      type: "boolean",
      default: "true",
      description:
        "Whether an overflowing scroll area is a named, focusable region. Turn it off when the content is itself keyboard-navigable, such as a toolbar's buttons",
    },
    { name: "ariaLabel", type: "string", default: '"Scrollable content"', description: "The region's name (message `scrollArea.region`)" },
    { name: "ariaLabelledby", type: "string", description: "id(s) of an element naming the region; takes precedence over ariaLabel" },
    hiddenProp,
  ],

  slots: [
    { name: "default", description: "The scrolling content" },
    {
      name: "indicator-start",
      payload: "{ edge: 'start', hasMore: boolean, scroll: () => void }",
      description: "Replaces the start indicator. Rendered beside the scroller, hidden from assistive tech",
    },
    {
      name: "indicator-end",
      payload: "{ edge: 'end', hasMore: boolean, scroll: () => void }",
      description: "Replaces the end indicator",
    },
  ],

  methods: [
    { name: "el", signature: "HTMLElement | null", description: "The scrolling element" },
    { name: "update", signature: "() => void", description: "Re-measure. Content changes are followed on their own; call this after a change it can't see" },
    { name: "scrollByPage", signature: '(edge: "start" | "end") => void', description: "Scroll about three-quarters of the visible size toward an edge" },
  ],

  tokens: [
    { name: "--cui-scroll-area-fade-size", default: "1.5rem", description: "Depth of the edge fade" },
    { name: "--cui-scroll-area-fade-color", default: "var(--cui-surface-base)", description: "Colour of an overlay fade (useScrollArea's `fade: \"overlay\"`)" },
    { name: "--cui-scroll-area-indicator-size", default: "2rem", description: "Width and height of an indicator" },
    { name: "--cui-scroll-area-indicator-bg", default: "var(--cui-surface-base)", description: "Indicator background" },
    { name: "--cui-scroll-area-indicator-color", default: "var(--cui-text-secondary)", description: "Indicator icon colour" },
    { name: "--cui-scroll-area-focus-ring", default: "var(--cui-primary-focus-ring)", description: "Focus outline of the region" },
  ],
};

export default meta;

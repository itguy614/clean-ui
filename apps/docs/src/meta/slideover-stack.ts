import type { ComponentMeta } from "./types";

const meta: ComponentMeta = {
  name: "SlideoverStack",
  description:
    "A provider that coordinates the slideovers (and drawers) inside it as one stack: they keep their order, one shared backdrop, and a depth-aware layout, instead of each overlay fighting the others. Wrap the panels in it, and open them in any order. Panels still teleport to the body; the stack reaches them by inject, not DOM nesting. It renders no element of its own.",
  interactive: false,

  parts: [
    {
      name: "CuiSlideoverStack",
      props: [
        {
          name: "push",
          type: "inward | outward",
          default: "inward",
          description:
            "Which way panels already open move when another is added. inward: they slide toward the open side while the newest enters at the docked edge. outward: they stay put and the newest attaches on the open side. A closing panel reverses it",
        },
        {
          name: "modal",
          type: "boolean",
          default: "true",
          description:
            "Whether the stack's panels are modal. false keeps every panel active: none is made inert, nothing traps focus, and Escape closes the focused panel. A panel's own modal prop overrides it",
        },
        {
          name: "mode",
          type: "auto | peek",
          default: "auto",
          description:
            "auto attaches panels edge to edge and narrows them to fit, falling back to peeking when they would be squeezed below minWidth. peek always peeks",
        },
        {
          name: "gap",
          type: "number",
          default: "32",
          description: "Room in px kept free on the open side of the viewport. The stack never reaches it, so there is always somewhere to click to dismiss. 32 is the 2rem a lone slideover leaves",
        },
        {
          name: "minWidth",
          type: "number",
          default: "320",
          description: "The narrowest a panel may be squeezed to, in px. Past it the stack stops narrowing and peeks",
        },
        {
          name: "peekOffset",
          type: "number",
          default: "32",
          description: "In peek mode, how far each lower panel's edge shows beyond the one above it, in px",
        },
        {
          name: "maxPeek",
          type: "number",
          default: "3",
          description: "In peek mode, how many layers show their own edge. Deeper ones share the last one's edge, so the cascade never runs out of room",
        },
        {
          name: "peekBelow",
          type: "sm | md | lg | xl | 2xl",
          default: "sm",
          description: "Below this breakpoint the stack peeks even when the panels would fit",
        },
      ],
      slots: [{ name: "default", description: "The CuiSlideover and CuiDrawer panels to coordinate. Their open state stays their own (v-model:visible)" }],
    },
    {
      name: "CuiSlideover / CuiDrawer",
      props: [
        {
          name: "modal",
          type: "boolean",
          default: "the stack's modal (true alone)",
          description:
            "A modal panel traps focus and, in a stack, makes every panel beneath it inert. Bind :modal=\"false\" to open it co-active: the panels beneath stay interactive and focus moves freely between them. Unset, it inherits the stack's modal",
        },
      ],
    },
  ],
};

export default meta;

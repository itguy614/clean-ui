import type { ComponentMeta, PropRow } from "./types";
import { hiddenProp, roundedProp, titleAsProp, visibleProp } from "./shared";

/** Shared by CuiModal and CuiSlideover — both drive the same CuiBackdrop. */
export const backdropProps: PropRow[] = [
  { name: "backdropOpacity", type: "number", default: "0.5", description: "Backdrop darkness, 0–1" },
  { name: "backdropBlur", type: "none | sm | md | lg | string", default: "none", description: "Backdrop blur amount" },
  { name: "backdropColor", type: "string", default: "black", description: "Backdrop color — any CSS color" },
  { name: "backdropImage", type: "string", description: "Backdrop image URL, layered over the color" },
  { name: "backdropGradient", type: "string", description: "Backdrop CSS gradient, layered over the color" },
];

/** The header/body/footer trio, reused verbatim by CuiSlideover. */
export const modalHeaderProps: PropRow[] = [
  { name: "title", type: "string", description: "Title text. The default slot replaces it entirely" },
  titleAsProp("h2"),
  { name: "noCloseButton", type: "boolean", default: "false", description: "Hide the X close button" },
  hiddenProp,
];

export const modalBodyProps: PropRow[] = [
  { name: "noPadding", type: "boolean", default: "false", description: "Remove the default padding" },
  hiddenProp,
];

export const modalFooterProps: PropRow[] = [
  {
    name: "align",
    type: "left | right | center | between",
    default: "right",
    description: "How the footer's children are distributed",
  },
  hiddenProp,
];

const meta: ComponentMeta = {
  name: "Modal",
  description:
    "Dialog overlay with a focus trap, background scroll lock and a configurable backdrop. Assemble it from the header/body/footer sub-components, or pass a title and let it build them for you.",
  interactive: true,

  parts: [
    {
      name: "CuiModal",
      props: [
        visibleProp("false"),
        {
          name: "size",
          type: "sm | md | lg | xl | full | string",
          default: "md",
          description: "Panel max-width — a named step (24/32/48/64rem) or any CSS length",
        },
        roundedProp,
        {
          name: "title",
          type: "string",
          description: "Simple mode: renders a CuiModalHeader and wraps the default slot in a CuiModalBody",
        },
        titleAsProp("h2"),
        {
          name: "persistent",
          type: "boolean",
          default: "false",
          description: "Block closing via Escape and backdrop click. The X button still closes",
        },
        { name: "noCloseButton", type: "boolean", default: "false", description: "Hide the X close button in simple mode" },
        {
          name: "allowNested",
          type: "boolean",
          default: "false",
          description: "Permit opening on top of another overlay. Without it, opening this one dismisses the rest",
        },
        ...backdropProps,
        hiddenProp,
      ],
      slots: [
        {
          name: "default",
          description:
            "With title set, the body content. Without it, the whole panel — supply CuiModalHeader / CuiModalBody / CuiModalFooter yourself",
        },
      ],
      events: [
        { name: "update:visible", payload: "boolean", description: "Open state changed — what v-model:visible binds to" },
        { name: "close", payload: "—", description: "Fires once the exit animation has finished" },
      ],
    },
    {
      name: "CuiModalHeader",
      props: modalHeaderProps,
      slots: [
        { name: "default", description: "Replaces the title entirely" },
        { name: "actions", description: "Trailing controls, placed before the close button" },
      ],
      events: [{ name: "close", payload: "—", description: "The X button was pressed — you close the modal" }],
    },
    {
      name: "CuiModalBody",
      props: modalBodyProps,
      slots: [{ name: "default", description: "Body content. Scrolls, with a shadow at whichever edge has more to show" }],
    },
    {
      name: "CuiModalFooter",
      props: modalFooterProps,
      slots: [{ name: "default", description: "Footer content, usually actions" }],
    },
  ],
};

export default meta;

import type { ComponentMeta } from "./types";
import { hiddenProp, titleAsProp, visibleProp } from "./shared";
import { backdropProps, modalBodyProps, modalFooterProps, modalHeaderProps } from "./modal";

/**
 * The panel is its own component, but everything inside it is CuiModal's — the same
 * header, body and footer, down to the file. They are repeated here rather than linked
 * to because a reader assembling a slideover should not have to go and read the Modal
 * page to find out what `align` does.
 */
const meta: ComponentMeta = {
  name: "Slideover",
  description:
    "A panel that slides in from any edge of the viewport. Shares CuiModal's overlay behaviour — focus trap, scroll lock, backdrop — and is assembled from the same header/body/footer sub-components.",
  interactive: true,

  parts: [
    {
      name: "CuiSlideover",
      props: [
        visibleProp("false"),
        {
          name: "side",
          type: "right | left | top | bottom",
          default: "right",
          description: "Which edge the panel slides from",
        },
        {
          name: "size",
          type: "sm | md | lg | xl | full | string",
          default: "md",
          description:
            "Panel width for left/right (20–48rem), height for top/bottom (25–80vh), or any CSS length",
        },
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
      events: [{ name: "close", payload: "—", description: "The X button was pressed — you close the panel" }],
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

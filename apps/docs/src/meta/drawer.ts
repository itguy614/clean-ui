import type { ComponentMeta } from "./types";
import { hiddenProp, titleAsProp, visibleProp } from "./shared";
import { backdropProps, modalBodyProps, modalFooterProps, modalHeaderProps, overlayEvents, overlayFocusProps } from "./modal";

const meta: ComponentMeta = {
  name: "Drawer",
  description:
    "A bottom sheet you can drag: flick it down to dismiss, drag it between heights, scroll its content without closing it. Modal, with CuiModal's focus trap, scroll lock and backdrop, and assembled from the same header/body/footer sub-components. Attributes you pass — class, style, data-testid and the rest — land on the panel (.cui-drawer__panel), the element actually rendered.",
  interactive: true,

  parts: [
    {
      name: "CuiDrawer",
      props: [
        visibleProp("false"),
        {
          name: "title",
          type: "string",
          description: "Simple mode: renders a CuiModalHeader and wraps the default slot in a CuiModalBody",
        },
        titleAsProp("h2"),
        {
          name: "snapPoints",
          type: "(number | string)[]",
          description:
            "Heights the sheet rests at: fractions of the viewport height (0.4, 1) or px (320, \"320px\"). A drag settles on the nearest, or closes. Unset, the sheet is as tall as its content",
        },
        {
          name: "activeSnapPoint",
          type: "number | string",
          default: "first of snapPoints",
          description: "The snap point the sheet rests at, as v-model:active-snap-point. It opens at this one, and returns to the first each time it reopens",
        },
        {
          name: "persistent",
          type: "boolean",
          default: "false",
          description: "Block closing via Escape, backdrop click and dragging. The X button still closes",
        },
        { name: "noCloseButton", type: "boolean", default: "false", description: "Hide the X close button in simple mode" },
        { name: "noHandle", type: "boolean", default: "false", description: "Hide the grab handle. Touch and pen can still drag from the sheet; a mouse can no longer drag at all" },
        { name: "noDrag", type: "boolean", default: "false", description: "Turn dragging off. The sheet closes only by its controls, Escape and the backdrop" },
        ...overlayFocusProps,
        ...backdropProps,
        hiddenProp,
      ],
      slots: [
        {
          name: "default",
          description:
            "With title set, the body content. Without it, the whole sheet: supply CuiModalHeader / CuiModalBody / CuiModalFooter yourself, and an aria-label if there is no title to name the dialog",
        },
      ],
      events: [
        ...overlayEvents,
        { name: "update:activeSnapPoint", payload: "number | string", description: "The sheet settled on another snap point. What v-model:active-snap-point binds to" },
      ],
    },
    { name: "CuiModalHeader", props: modalHeaderProps, events: [{ name: "close", payload: "—", description: "The X button was pressed. You close the sheet" }] },
    { name: "CuiModalBody", props: modalBodyProps },
    { name: "CuiModalFooter", props: modalFooterProps },
  ],

  tokens: [
    { name: "--cui-drawer-width", default: "100%", description: "Width of the sheet, centred on the screen. Set it for a sheet narrower than the viewport" },
    { name: "--cui-drawer-height", default: "per snap points", description: "Height of the sheet. Overrides the tallest snap point, so the rest positions go with it" },
    { name: "--cui-drawer-radius", default: "var(--cui-radius-lg)", description: "Radius of the sheet's top corners" },
  ],
};

export default meta;

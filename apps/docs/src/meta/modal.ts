import type { ComponentMeta, EventRow, PropRow } from "./types";
import { hiddenProp, roundedProp, titleAsProp, visibleProp } from "./shared";

/** Shared by CuiModal and CuiSlideover — both drive the same CuiBackdrop. */
export const backdropProps: PropRow[] = [
  { name: "backdropOpacity", type: "number", default: "0.5", description: "Backdrop darkness, 0–1" },
  { name: "backdropBlur", type: "none | sm | md | lg | string", default: "none", description: "Backdrop blur amount" },
  { name: "backdropColor", type: "string", default: "black", description: "Backdrop color — any CSS color" },
  { name: "backdropImage", type: "string", description: "Backdrop image URL, layered over the color" },
  { name: "backdropGradient", type: "string", description: "Backdrop CSS gradient, layered over the color" },
];

/** Where focus goes on open and close — shared by CuiModal and CuiSlideover (#374). */
export const overlayFocusProps: PropRow[] = [
  {
    name: "initialFocus",
    type: "string | HTMLElement | (() => HTMLElement | null)",
    description:
      "Element focused on open, inside the panel — a selector (scoped to the panel), an element, or a function returning one. Wins over a field the content focused itself on mount. Unset, or naming nothing it can focus, the panel is focused. A heading needs tabindex=\"-1\" to take focus",
  },
  {
    name: "returnFocus",
    type: "string | HTMLElement | (() => HTMLElement | null) | false",
    description:
      "Element focused once closed, in place of the opener. A function is called at close time, so it can name an element that did not exist at open. false leaves focus where it is. Unset, or naming nothing it can focus (gone, hidden or disabled by then), focus returns to the opener",
  },
];

/** after-enter / after-leave — also forwarded by CuiConfirmDialog, which wraps CuiModal. */
export const overlayLifecycleEvents: EventRow[] = [
  {
    name: "after-enter",
    payload: "—",
    description: "The entry animation has finished and focus is in place. Once per open; not at all if it closes first",
  },
  {
    name: "after-leave",
    payload: "—",
    description: "The exit has finished and focus has been returned — after close. Once per close",
  },
];

/** The events that report an overlay's entry and exit, shared by CuiModal and CuiSlideover. */
export const overlayEvents: EventRow[] = [
  { name: "update:visible", payload: "boolean", description: "Open state changed — what v-model:visible binds to" },
  { name: "close", payload: "—", description: "Fires once the exit animation has finished" },
  ...overlayLifecycleEvents,
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
    "Dialog overlay with a focus trap, background scroll lock and a configurable backdrop. Assemble it from the header/body/footer sub-components, or pass a title and let it build them for you. Attributes you pass — class, style, data-testid and the rest — land on the dialog panel (.cui-modal), the element actually rendered, rather than being dropped at its teleported root.",
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
        ...overlayFocusProps,
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
      events: overlayEvents,
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

  tokens: [
    {
      name: "--cui-modal-width",
      default: "per size",
      description:
        "Panel max-width (sm 24rem … xl 64rem). Overrides every modal's size prop beneath where it is set, CuiConfirmDialog's included",
    },
    { name: "--cui-modal-radius", default: "per rounded", description: "Panel corner radius" },
    { name: "--cui-modal-header-bg", default: "var(--cui-surface-base)", description: "CuiModalHeader's fill" },
    { name: "--cui-modal-header-gap", default: "0.75rem (density)", description: "Space between the header's title, actions and close button" },
    { name: "--cui-modal-header-px", default: "1.5rem (density)", description: "CuiModalHeader's horizontal padding. The top and bottom padding follow the density and have no token" },
    { name: "--cui-modal-header-color", default: "var(--cui-text-emphasis)", description: "The header title's colour" },
    { name: "--cui-modal-header-font-size", default: "1.125rem", description: "The header title's size" },
    { name: "--cui-modal-header-hover-bg", default: "var(--cui-primary-bg)", description: "The close button's fill on hover" },
    { name: "--cui-modal-header-hover-color", default: "var(--cui-text-body)", description: "The close button's colour on hover" },
    { name: "--cui-modal-body-px", default: "1.5rem (density)", description: "CuiModalBody's horizontal padding. noPadding removes it whatever this says" },
    { name: "--cui-modal-body-py", default: "0.75rem (density)", description: "CuiModalBody's vertical padding" },
    { name: "--cui-modal-body-color", default: "var(--cui-text-secondary)", description: "Body text colour" },
    { name: "--cui-modal-body-font-size", default: "0.875rem", description: "Body text size" },
    { name: "--cui-modal-footer-bg", default: "var(--cui-surface-base)", description: "CuiModalFooter's fill" },
    { name: "--cui-modal-footer-gap", default: "0.5rem (density)", description: "Space between the footer's children" },
    { name: "--cui-modal-footer-px", default: "1.5rem (density)", description: "CuiModalFooter's horizontal padding. The top and bottom padding follow the density and have no token" },
  ],
};

export default meta;

import type { ComponentMeta } from "./types";
import { overlayFocusProps, overlayLifecycleEvents } from "./modal";
import { hiddenProp, titleAsProp, visibleProp } from "./shared";

const meta: ComponentMeta = {
  name: "Confirm Dialog",
  description:
    "A CuiModal preset for confirming an action, destructive or routine — role icon, matching confirm button, and an optional type-the-word gate.",
  interactive: true,

  props: [
    visibleProp("false"),
    {
      name: "title",
      type: "string",
      default: "Are you sure?",
      description: "Dialog title. The default comes from the message catalog, so it localizes with the rest",
    },
    titleAsProp("h2"),
    { name: "message", type: "string", description: "Body text. The default slot replaces it and may contain markup" },
    {
      name: "variant",
      type: "danger | warning | info | primary",
      default: "danger",
      description:
        "Picks the icon and the confirm button's color role — error, warning, info, primary respectively. Use primary for a routine, non-destructive confirm",
    },
    {
      name: "confirmColor",
      type: "CuiColor",
      default: "from variant",
      description: "Confirm button color role, overriding the variant's. The icon tile keeps the variant's color",
    },
    { name: "confirmText", type: "string", default: "Confirm", description: "Confirm button label" },
    { name: "cancelText", type: "string", default: "Cancel", description: "Cancel button label" },
    {
      name: "confirmWord",
      type: "string",
      description:
        "Require this word to be typed before the confirm button enables. Matched case-insensitively and trimmed",
    },
    {
      name: "confirmPrompt",
      type: "string",
      default: "Please type \"…\" to confirm.",
      description: "Prompt above the confirmation input. Rendered as plain text — markup in it will not be parsed",
    },
    {
      name: "icon",
      type: "string | Component | false",
      default: "from variant",
      description:
        "Override the variant's icon with a registered name or an icon component. false renders no icon tile, and the title sits flush left",
    },
    {
      name: "loading",
      type: "boolean",
      default: "false",
      description: "Spinner on the confirm button, and disables it. You own the flag — confirm does not set it",
    },
    ...overlayFocusProps,
    hiddenProp,
  ],

  slots: [
    { name: "default", description: "Replaces the message text, for markup a plain string cannot express" },
  ],

  events: [
    { name: "update:visible", payload: "boolean", description: "Open state changed — what v-model:visible binds to" },
    {
      name: "confirm",
      payload: "—",
      description: "Confirm was pressed. The dialog stays open, so you can await the work and close it yourself",
    },
    {
      name: "cancel",
      payload: "—",
      description: "Cancel or the X was pressed. Escape and a backdrop click close the dialog without emitting this",
    },
    ...overlayLifecycleEvents,
  ],

  tokens: [
    { name: "--cui-confirm-dialog-bg", default: "var(--cui-<variant>-bg)", description: "Fill of the icon tile and the typed-word prompt. The default is the variant's tint" },
    { name: "--cui-confirm-dialog-border", default: "var(--cui-<variant>-border)", description: "Border colour of the icon tile and the typed-word prompt" },
    { name: "--cui-confirm-dialog-color", default: "var(--cui-<variant>)", description: "Icon colour on the tile" },
    { name: "--cui-confirm-dialog-gap", default: "0.875rem (density)", description: "Space between the icon tile, the text and the close button" },
    { name: "--cui-confirm-dialog-px", default: "1.5rem (density)", description: "Horizontal padding of the title row" },
    { name: "--cui-modal-width", default: "per size", description: "Panel max-width, shared with CuiModal" },
  ],
};

export default meta;

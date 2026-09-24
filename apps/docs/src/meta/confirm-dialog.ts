import type { ComponentMeta } from "./types";
import { hiddenProp, titleAsProp } from "./shared";

const meta: ComponentMeta = {
  name: "Confirm Dialog",
  description:
    "A CuiModal preset for confirming a destructive or irreversible action — role icon, matching confirm button, and an optional type-the-word gate.",
  interactive: true,

  props: [
    { name: "v-model:visible", type: "boolean", default: "false", description: "Whether the dialog is open" },
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
      type: "danger | warning | info",
      default: "danger",
      description: "Picks the icon and the confirm button's color role — error, warning, info respectively",
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
      type: "string",
      description: "Override the variant's icon with a name from the static icon registry",
    },
    {
      name: "loading",
      type: "boolean",
      default: "false",
      description: "Spinner on the confirm button, and disables it. You own the flag — confirm does not set it",
    },
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
  ],
};

export default meta;

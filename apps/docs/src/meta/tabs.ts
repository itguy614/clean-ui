import type { ComponentMeta } from "./types";
import { colorProp, disabledProp, hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Tabs",
  description:
    "Tabbed interface built from CuiTabs and CuiTab — underline or segmented, horizontal or vertical, with closeable tabs and animated panel transitions.",
  interactive: true,

  parts: [
    {
      name: "CuiTabs",
      props: [
        {
          name: "modelValue",
          type: "string",
          description: "Value of the active tab (v-model). Unset, the first enabled tab activates itself",
        },
        { name: "variant", type: "underline | segmented", default: "underline", description: "Tab bar style" },
        {
          name: "orientation",
          type: "horizontal | vertical",
          default: "horizontal",
          description: "Layout direction. Also sets aria-orientation and swaps the arrow keys that move between tabs",
        },
        colorProp("Active tab indicator, label and focus ring"),
        {
          name: "keepAlive",
          type: "boolean",
          default: "true",
          description: "Keep inactive panels mounted and hidden with v-show. false mounts a panel only while active",
        },
        { name: "transition", type: "fade | slide | none", default: "fade", description: "Panel entrance animation" },
        hiddenProp,
      ],
      slots: [{ name: "default", description: "CuiTab children. The tab buttons are rendered by CuiTabs, not here" }],
      events: [
        { name: "update:modelValue", payload: "string", description: "The active tab changed (v-model)" },
        {
          name: "close",
          payload: "string",
          description:
            "A closeable tab's close button was activated. Nothing is removed for you — drop the tab from your own list",
        },
      ],
    },
    {
      name: "CuiTab",
      props: [
        { name: "value", type: "string", description: "Unique identifier, matched against CuiTabs' v-model (required)" },
        {
          name: "label",
          type: "string",
          description: "Tab button text (required). A #label slot replaces what is rendered, but not this prop",
        },
        { ...disabledProp, description: "Skip this tab — not activatable by click or arrow key" },
        { name: "closeable", type: "boolean", default: "false", description: "Render a close button in the tab" },
        { ...hiddenProp, description: "Hide this tab's panel (v-show). The tab button stays in the bar" },
      ],
      slots: [
        { name: "default", description: "Panel content, shown when this tab is active" },
        {
          name: "label",
          description:
            "Tab button content — a badge, an icon, a status dot. Keep the tab's text inside it: the button's accessible name comes from what it renders",
        },
      ],
    },
  ],
};

export default meta;

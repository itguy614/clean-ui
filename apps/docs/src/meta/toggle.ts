import type { ComponentMeta, PropRow } from "./types";
import { COLOR_ROLES, clampedSizeProp, colorProp, disabledProp, hiddenProp, nativeControlProps } from "./shared";

/** `AriaLabelableProps` — the three of `nativeControlProps` a *group* can use. */
const groupAriaProps: PropRow[] = [
  { name: "id", type: "string", description: "id of the group container" },
  {
    name: "aria-labelledby",
    type: "string",
    description:
      "id(s) of the element naming this group. The only thing that can name it — a label's for attribute cannot point at a div[role=group]. CuiFormField supplies it automatically",
  },
  {
    name: "aria-describedby",
    type: "string",
    description: "id(s) of describing text. CuiFormField points this at its help text or error message",
  },
];

const meta: ComponentMeta = {
  name: "Toggle",
  description:
    "Pill-shaped switches for on/off settings that take effect immediately. Works standalone, or inside a CuiToggleGroup for multi-select.",
  interactive: true,

  parts: [
    {
      name: "CuiToggle",
      props: [
        {
          name: "v-model",
          type: "boolean",
          description: "Standalone binding. Ignored in group mode — the group owns the state there",
        },
        {
          name: "value",
          type: "string | number",
          description: "The value this toggle contributes to the group's array. Group mode only",
        },
        { name: "label", type: "string", description: "Label text. The default slot replaces it" },
        { name: "description", type: "string", description: "Secondary line below the label. The #description slot replaces it" },
        {
          name: "showLabels",
          type: "boolean",
          default: "false",
          description: "Print ON inside the track when the switch is on. Rendered at md and lg only — sm has no room for it",
        },
        {
          name: "color",
          type: COLOR_ROLES,
          default: "from group, else primary",
          description: "Color role for the knob, track fill and focus ring. Overrides the group's color",
        },
        clampedSizeProp("sm, md and lg", "md", "Switch size"),
        disabledProp,
        { name: "readonly", type: "boolean", default: "false", description: "Readonly state — no toggling, but not dimmed like disabled" },
        hiddenProp,
        ...nativeControlProps,
      ],
      slots: [
        { name: "default", description: "Replaces the label text" },
        { name: "description", description: "Replaces the description text" },
      ],
      events: [
        {
          name: "update:modelValue",
          payload: "boolean",
          description: "Fires on toggle in standalone mode only — in group mode the group emits instead",
        },
      ],
      methods: [
        { name: "el", signature: "HTMLElement | undefined", description: "The root label element, which is the focusable one" },
        { name: "focus", signature: "() => void", description: "Focus the toggle" },
      ],
    },
    {
      name: "CuiToggleGroup",
      props: [
        {
          name: "v-model",
          type: "Array<string | number>",
          default: "[]",
          description: "The values that are on — a group is always an array, never a boolean",
        },
        colorProp("Color role inherited by every toggle that does not set its own"),
        {
          name: "orientation",
          type: "horizontal | vertical | auto",
          default: "auto",
          description: "Layout axis. auto is horizontal for ≤2 options and vertical for 3+",
        },
        disabledProp,
        { name: "readonly", type: "boolean", default: "false", description: "Make every toggle readonly" },
        {
          name: "error",
          type: "boolean",
          default: "false",
          description: "Error state — wraps the options in a tinted bordered container and sets aria-invalid",
        },
        { name: "errorMessage", type: "string", description: "Error message rendered below the options" },
        {
          name: "label",
          type: "string",
          description:
            "Accessible name for the group. It is written to aria-label and is NOT rendered — pair the group with a visible label of your own, or with CuiFormField",
        },
        hiddenProp,
        ...groupAriaProps,
      ],
      slots: [{ name: "default", description: "The CuiToggle children" }],
      events: [
        {
          name: "update:modelValue",
          payload: "Array<string | number>",
          description: "Fires with the new selection whenever a child is toggled (v-model)",
        },
      ],
    },
  ],
};

export default meta;

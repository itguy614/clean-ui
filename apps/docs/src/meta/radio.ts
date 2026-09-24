import type { ComponentMeta, PropRow } from "./types";
import { COLOR_ROLES, colorProp, disabledProp, hiddenProp, nativeControlProps } from "./shared";

/** `AriaLabelableProps` — the three of `nativeControlProps` a *group* can use. */
const groupAriaProps: PropRow[] = [
  { name: "id", type: "string", description: "id of the group container" },
  {
    name: "aria-labelledby",
    type: "string",
    description:
      "id(s) of the element naming this group. The only thing that can name it — a label's for attribute cannot point at a div[role=radiogroup]. CuiFormField supplies it automatically",
  },
  {
    name: "aria-describedby",
    type: "string",
    description: "id(s) of describing text. CuiFormField points this at its help text or error message",
  },
];

const meta: ComponentMeta = {
  name: "Radio",
  description:
    "Single-selection from a set of options. Works standalone, or inside a CuiRadioGroup for managed state, arrow-key navigation and validation.",
  interactive: true,

  parts: [
    {
      name: "CuiRadioGroup",
      props: [
        {
          name: "v-model",
          type: "string | number | boolean",
          description: "The selected value — one value, not an array. It is compared to each child's value with ===",
        },
        {
          name: "name",
          type: "string",
          default: "auto-generated",
          description: "Shared name for the children's hidden native inputs. Left unset, the group generates one",
        },
        colorProp("Color role inherited by every radio that does not set its own"),
        {
          name: "orientation",
          type: "horizontal | vertical | auto",
          default: "auto",
          description: "Layout axis. auto is horizontal for ≤2 options and vertical for 3+. Ignored when variant is buttons",
        },
        {
          name: "variant",
          type: "default | buttons",
          default: "default",
          description: "default draws classic radio circles; buttons draws a segmented control built on CuiButtonGroup",
        },
        {
          name: "size",
          type: "xs | sm | md | lg | xl",
          default: "md",
          description: "Segment size, from the shared button scale. Only read when variant is buttons",
        },
        disabledProp,
        { name: "readonly", type: "boolean", default: "false", description: "Make every radio readonly" },
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
      slots: [{ name: "default", description: "The CuiRadio children" }],
      events: [
        {
          name: "update:modelValue",
          payload: "string | number | boolean",
          description: "Fires with the newly selected value (v-model)",
        },
      ],
    },
    {
      name: "CuiRadio",
      props: [
        {
          name: "value",
          type: "string | number | boolean",
          description: "The value this radio represents. Required — it is what the group compares against",
        },
        {
          name: "v-model",
          type: "string | number | boolean",
          description: "Standalone binding. Ignored in group mode — the group owns the state there",
        },
        { name: "label", type: "string", description: "Label text. The default slot replaces it" },
        { name: "description", type: "string", description: "Secondary line below the label. The #description slot replaces it" },
        {
          name: "color",
          type: COLOR_ROLES,
          default: "from group, else primary",
          description: "Overrides the group's color for this one radio",
        },
        disabledProp,
        { name: "readonly", type: "boolean", default: "false", description: "Readonly state — no selecting, but not dimmed like disabled" },
        hiddenProp,
        ...nativeControlProps,
      ],
      slots: [
        { name: "default", description: "Replaces the label text" },
        { name: "description", description: "Replaces the description text. Not rendered by the buttons variant" },
      ],
      events: [
        {
          name: "update:modelValue",
          payload: "string | number | boolean",
          description: "Fires on selection in standalone mode only — in group mode the group emits instead",
        },
      ],
      methods: [
        {
          name: "el",
          signature: "HTMLElement | undefined",
          description: "The focusable root — the label, or the button under the buttons variant",
        },
        { name: "focus", signature: "() => void", description: "Focus the radio" },
      ],
    },
  ],
};

export default meta;

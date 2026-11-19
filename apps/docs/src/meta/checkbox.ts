import type { ComponentMeta, PropRow } from "./types";
import { COLOR_ROLES, colorProp, disabledProp, hiddenProp, inputSizeProp, nativeControlProps } from "./shared";

/**
 * `AriaLabelableProps` — the three of `nativeControlProps` that a *group* takes.
 *
 * A group has no native control of its own, so `name` and `autocomplete` would be
 * meaningless on it: the browser only reads those off a real form control.
 */
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
  name: "Checkbox",
  description:
    "Checkboxes for multi-selection, boolean toggles, and indeterminate “select all” patterns. Works standalone or inside a CuiCheckboxGroup.",
  interactive: true,

  parts: [
    {
      name: "CuiCheckboxGroup",
      props: [
        {
          name: "v-model",
          type: "Array<string | number>",
          default: "[]",
          description: "The selected values — a group is always an array, never a boolean",
        },
        colorProp("Color role inherited by every checkbox that does not set its own"),
        { ...inputSizeProp, description: "Size inherited by every checkbox that does not set its own, from the shared input scale (the label's font size)" },
        {
          name: "orientation",
          type: "horizontal | vertical | auto",
          default: "auto",
          description: "Layout axis. auto is horizontal for ≤2 options and vertical for 3+",
        },
        disabledProp,
        { name: "readonly", type: "boolean", default: "false", description: "Make every checkbox readonly" },
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
      slots: [{ name: "default", description: "The CuiCheckbox children" }],
      events: [
        {
          name: "update:modelValue",
          payload: "Array<string | number>",
          description: "Fires with the new selection whenever a child is toggled (v-model)",
        },
      ],
    },
    {
      name: "CuiCheckbox",
      props: [
        {
          name: "value",
          type: "string | number",
          description: "The value this checkbox contributes to the group's array. Group mode only",
        },
        {
          name: "v-model",
          type: "boolean",
          description: "Standalone binding. Ignored in group mode — the group owns the state there",
        },
        { name: "label", type: "string", description: "Label text. The default slot replaces it" },
        { name: "description", type: "string", description: "Secondary line below the label. The #description slot replaces it" },
        {
          name: "color",
          type: COLOR_ROLES,
          default: "from group, else primary",
          description: "Overrides the group's color for this one checkbox",
        },
        {
          ...inputSizeProp,
          default: "from group, else md",
          description:
            "Size of the label text, from the shared input scale (xs 12px, sm 13px, md 16px, lg 17px, xl 18px). The 1.25rem box stays the same size at every step and is centred on the label's first line",
        },
        {
          name: "indeterminate",
          type: "boolean",
          default: "false",
          description: "Draw the mixed-state dash and expose aria-checked=\"mixed\". Visual/semantic only — it does not change the value",
        },
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
        { name: "focus", signature: "() => void", description: "Focus the checkbox" },
      ],
    },
  ],

  tokens: [
    { name: "--cui-checkbox-border", default: "per state", description: "Border color of the box (the color role when checked, the neutral border otherwise)" },
    { name: "--cui-checkbox-bg", default: "per state", description: "Fill of the box (the role tint when checked, none otherwise)" },
    { name: "--cui-checkbox-hover-border", default: "var(--cui-primary)", description: "Border color of an unchecked box under the pointer" },
    { name: "--cui-checkbox-font-size", default: "per size", description: "Font size of the label (a length, not a percentage), whatever the size prop says. Set it on :root or a container, as the grid's column manager does" },
    { name: "--cui-checkbox-focus-ring", default: "var(--cui-primary-focus-ring)", description: "Focus ring color" },
  ],
};

export default meta;

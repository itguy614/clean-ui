import type { PropRow } from "./types";

/**
 * Prop rows shared by many components, mirroring the mixins in the library's
 * `types/common.ts`. They were written out per component and had already started to
 * drift in wording; a mixin described in five places is the same problem the metadata
 * modules exist to solve.
 */

/** `NativeControlProps` — every component wrapping a real form control. */
export const nativeControlProps: PropRow[] = [
  {
    name: "id",
    type: "string",
    description:
      "id of the native control — what a label's for attribute must point at. CuiFormField supplies it automatically",
  },
  { name: "name", type: "string", description: "Native control name, for form serialization and browser autofill" },
  { name: "autocomplete", type: "string", description: "Native autocomplete hint, e.g. email, street-address, off" },
  {
    name: "aria-describedby",
    type: "string",
    description: "id(s) of describing text. CuiFormField points this at its help text or error message",
  },
  {
    name: "aria-labelledby",
    type: "string",
    description: "id(s) of the labelling element. CuiFormField points this at its label",
  },
];

/** `HideableProps`. */
export const hiddenProp: PropRow = {
  name: "hidden",
  type: "boolean",
  default: "false",
  description: "Hide the component (v-show)",
};

/** `DisableableProps`. */
export const disabledProp: PropRow = {
  name: "disabled",
  type: "boolean",
  default: "false",
  description: "Disabled state",
};

/** `SizeableProps`, for a control that sizes itself from `INPUT_SIZE_SCALE`. */
export const inputSizeProp: PropRow = {
  name: "size",
  type: "xs | sm | md | lg | xl",
  default: "md",
  description: "Size, from the shared input scale — matches CuiInput and CuiSelect at the same value",
};

/** `CuiRounded`. */
export const roundedProp: PropRow = {
  name: "rounded",
  type: "none | sm | md | lg | full",
  default: "md",
  description: "Border radius",
};

import type { ComponentMeta } from "./types";
import { colorProp, hiddenProp, roundedProp } from "./shared";

const meta: ComponentMeta = {
  name: "Fieldset",
  description:
    "Groups related fields in a real <fieldset> with a <legend>, optionally collapsible. Disabling it disables every control inside, natively.",

  props: [
    { name: "legend", type: "string", description: "Legend text. Required — the group's name" },
    { name: "description", type: "string", description: "Explanatory line under the legend. Hidden while collapsed" },
    { name: "variant", type: "outline | subtle | ghost", default: "outline", description: "outline is a border only, subtle adds the colour's tinted fill, ghost drops both and the padding with them" },
    colorProp("Border colour, and the fill under variant=subtle. surface is the neutral default; surface-light/dark are its other two intensities", "surface"),
    roundedProp,
    { name: "collapsible", type: "boolean", default: "false", description: "Make the legend a toggle and show a chevron. Off, the legend is inert text" },
    { name: "v-model:expanded", type: "boolean", default: "true", description: "Whether the content is showing. Only meaningful with collapsible" },
    { name: "disabled", type: "boolean", default: "false", description: "Sets the native disabled attribute on the <fieldset>, which disables every form control inside it — no per-field prop needed" },
    hiddenProp,
  ],

  slots: [
    { name: "default", description: "The fields. Laid out as a vertical flex column with a 1rem gap" },
  ],

  events: [
    { name: "update:expanded", payload: "boolean", description: "Fires when the legend is clicked" },
  ],
};

export default meta;

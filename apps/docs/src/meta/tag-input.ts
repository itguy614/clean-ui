import type { ComponentMeta } from "./types";
import { hiddenProp, inputSizeProp, nativeControlProps, roundedProp } from "./shared";

const meta: ComponentMeta = {
  name: "Tag Input",
  description: "Free-form or suggestion-driven tag entry, with optional async search and per-tag colors.",
  interactive: true,

  props: [
    { name: "modelValue", type: "string[]", default: "[]", description: "Selected tags (v-model)" },
    { name: "suggestions", type: "TagOption[]", default: "[]", description: "Predefined tag suggestions" },
    { name: "fetchSuggestions", type: "(query) => Promise<TagOption[]>", description: "Async search function" },
    { name: "allowCreate", type: "boolean", default: "true", description: "Allow creating tags not in suggestions" },
    { name: "maxTags", type: "number", default: "0", description: "Maximum tags allowed (0 = unlimited)" },
    { name: "debounce", type: "number", default: "300", description: "Debounce for async search (ms)" },
    { name: "minChars", type: "number", default: "0", description: "Min chars before searching" },
    { name: "placeholder", type: "string", default: "Add tag...", description: "Placeholder text" },
    {
      name: "color",
      type: "primary | secondary | success | error | warning | info",
      default: "primary",
      description: "Default tag color",
    },
    { name: "createText", type: "string", default: "Create", description: "Text for the create option" },
    { name: "label", type: "string", description: "Label text" },
    inputSizeProp,
    roundedProp,
    { name: "error", type: "boolean", default: "false", description: "Error state" },
    { name: "errorMessage", type: "string", description: "Error message text" },
    { name: "noSuggestionsText", type: "string", default: "No suggestions", description: "Text when no suggestions match" },
    { name: "disabled", type: "boolean", default: "false", description: "Disabled state" },
    hiddenProp,
    ...nativeControlProps,
  ],

  slots: [{ name: "suggestion", payload: "{ suggestion }", description: "Renders one row of the suggestions list" }],

  events: [{ name: "update:modelValue", payload: "string[]", description: "Fires when tags change (v-model)" }],

  tokens: [
    { name: "--cui-tag-input-min-height", default: "per size", description: "Control height floor — it grows with its tag rows" },
    { name: "--cui-tag-input-padding", default: "per size", description: "Control padding" },
    { name: "--cui-tag-input-font-size", default: "per size", description: "Control and suggestion font size" },
    { name: "--cui-tag-input-radius", default: "per rounded", description: "Control corner radius" },
    { name: "--cui-tag-input-bg", default: "var(--cui-surface-base)", description: "Control background" },
    { name: "--cui-tag-input-color", default: "var(--cui-text-body)", description: "Typed text color" },
    { name: "--cui-tag-input-border-width", default: "1px", description: "Control border width" },
    { name: "--cui-tag-input-panel-bg", default: "var(--cui-surface-base)", description: "Suggestions panel background" },
    { name: "--cui-tag-input-panel-border", default: "1px solid var(--cui-border)", description: "Suggestions panel border" },
    { name: "--cui-tag-input-panel-radius", default: "0.5rem", description: "Suggestions panel corner radius" },
    { name: "--cui-tag-input-panel-shadow", default: "two-layer drop shadow", description: "Suggestions panel shadow" },
    { name: "--cui-tag-input-panel-padding", default: "0.25rem", description: "Suggestions panel inner padding" },
    { name: "--cui-tag-input-item-padding", default: "0.4375rem 0.625rem", description: "Suggestion padding" },
    { name: "--cui-tag-input-item-radius", default: "0.25rem", description: "Suggestion corner radius" },
    { name: "--cui-tag-input-item-color", default: "var(--cui-text-body)", description: "Suggestion text color" },
    { name: "--cui-tag-input-item-focus-bg", default: "var(--cui-primary-bg)", description: "Background of the focused suggestion" },
  ],
};

export default meta;

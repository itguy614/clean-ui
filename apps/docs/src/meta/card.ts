import type { ComponentMeta } from "./types";

const hidden = {
  name: "hidden",
  type: "boolean",
  default: "false",
  description: "Hide the component (v-show)",
};

const meta: ComponentMeta = {
  name: "Card",
  description:
    "Container for grouped content, composed from header, media, body and footer sub-components.",

  parts: [
    {
      name: "CuiCard",
      props: [
        {
          name: "variant",
          type: "elevated | outline | ghost",
          default: "elevated",
          description: "Visual style (elevated: border + shadow, outline: border only, ghost: none)",
        },
        { name: "rounded", type: "none | sm | md | lg | full", default: "lg", description: "Border radius" },
        hidden,
      ],
      slots: [{ name: "default", description: "Card sub-components, in any order" }],
    },
    {
      name: "CuiCardHeader",
      props: [
        { name: "title", type: "string", description: "Convenience title text" },
        { name: "subtitle", type: "string", description: "Convenience subtitle text" },
        hidden,
      ],
      slots: [
        { name: "default", description: "Replaces the title/subtitle pair entirely" },
        { name: "actions", description: "Trailing controls — buttons, menus, badges" },
      ],
    },
    {
      name: "CuiCardBody",
      props: [{ name: "noPadding", type: "boolean", default: "false", description: "Remove default padding" }, hidden],
      slots: [{ name: "default", description: "Body content" }],
    },
    {
      name: "CuiCardFooter",
      props: [
        {
          name: "align",
          type: "left | right | center | between",
          default: "right",
          description: "Align footer content",
        },
        hidden,
      ],
      slots: [{ name: "default", description: "Footer content, usually actions" }],
    },
    {
      name: "CuiCardMedia",
      props: [
        { name: "src", type: "string", description: "Image URL" },
        { name: "alt", type: "string", default: "''", description: "Alt text for the image" },
        {
          name: "aspect",
          type: "auto | video | square | string",
          default: "video",
          description: "Aspect ratio (video = 16:9, square = 1:1, or a custom ratio such as \"4 / 3\")",
        },
        { name: "position", type: "top | bottom", default: "top", description: "Position in the card" },
        hidden,
      ],
      slots: [{ name: "default", description: "Replaces the <img> — a video, canvas or gradient" }],
    },
  ],

  tokens: [
    { name: "--cui-card-bg", default: "per variant", description: "Card background" },
    { name: "--cui-card-border", default: "per variant", description: "Card border shorthand" },
    { name: "--cui-card-shadow", default: "per variant", description: "Card box-shadow" },
    { name: "--cui-card-radius", default: "per rounded", description: "Corner radius" },
    { name: "--cui-card-header-padding", default: "1rem 1.125rem 0.375rem", description: "Header padding (density-scaled)" },
    { name: "--cui-card-header-gap", default: "0.75rem", description: "Gap between header content and actions" },
    { name: "--cui-card-header-actions-gap", default: "0.5rem", description: "Gap between individual actions" },
    { name: "--cui-card-title-font-size", default: "1.0625rem", description: "Title size" },
    { name: "--cui-card-title-color", default: "var(--cui-text-emphasis)", description: "Title color" },
    { name: "--cui-card-title-font-weight", default: "600", description: "Title weight" },
    { name: "--cui-card-subtitle-font-size", default: "0.8125rem", description: "Subtitle size" },
    { name: "--cui-card-subtitle-color", default: "var(--cui-text-secondary)", description: "Subtitle color" },
    { name: "--cui-card-body-padding", default: "0.5rem 1.125rem", description: "Body padding (density-scaled)" },
    {
      name: "--cui-card-footer-padding",
      default: "0.375rem 1.125rem 1rem",
      description: "Footer padding (density-scaled)",
    },
    { name: "--cui-card-footer-gap", default: "0.5rem", description: "Gap between footer children" },
    { name: "--cui-card-footer-justify", default: "per align", description: "Footer justify-content" },
    { name: "--cui-card-media-aspect", default: "per aspect", description: "Media aspect ratio" },
    { name: "--cui-card-media-fit", default: "cover", description: "Media object-fit" },
  ],
};

export default meta;

import type { ComponentMeta } from "./types";
import { disabledProp, hiddenProp } from "./shared";

const radiusDefault = "var(--cui-card-radius, var(--cui-radius-lg))";

const meta: ComponentMeta = {
  name: "List",
  description:
    "A vertical list of rows — a leading icon, a title and subtitle, a trailing chevron or control — rendered as a real <ul>/<li>. Each row is a link, a button or plain content; the inset variant draws a settings-app grouped list.",
  interactive: true,

  parts: [
    {
      name: "CuiList",
      props: [
        {
          name: "variant",
          type: "plain | inset",
          default: "plain",
          description:
            "plain: rows on the page background. inset: the rows read as one rounded card — each row paints the card fill and border, the first and last round their outer corners",
        },
        {
          name: "as",
          type: "ul | ol | div",
          default: "ul",
          description: "List element. ul/ol render li items (announced as a list); div renders plain rows",
        },
        {
          name: "divided",
          type: "boolean",
          default: "false",
          description: "Draw a divider between rows. An inset list always has them",
        },
        {
          name: "rounded",
          type: "none | sm | md | lg | full",
          description:
            "Outer corner radius of an inset list, and the hover fill's radius on a plain one. Unset, an inset list follows --cui-card-radius and a plain row is square",
        },
        hiddenProp,
      ],
      slots: [{ name: "default", description: "CuiListItem children" }],
    },
    {
      name: "CuiListItem",
      props: [
        { name: "title", type: "string", description: "Primary line, kept to one line and cut off with …" },
        { name: "subtitle", type: "string", description: "Secondary line, kept to one line and cut off with …" },
        { name: "icon", type: "string | Component", description: "Leading icon: a registered name or an icon component" },
        { name: "chevron", type: "boolean", default: "false", description: "Show a trailing chevron (hidden from assistive technology)" },
        { name: "href", type: "string", description: "Render the row as an <a>" },
        { name: "to", type: "string | object", description: "Render the row as a <router-link>" },
        {
          name: "as",
          type: "string",
          description:
            "Render the row as this element, e.g. label round a control. href and to win over it; as=button is a type=button button. Other elements are not made focusable. With none of the three, a row with a click listener is a <button>, one without a <div>",
        },
        { ...disabledProp, description: "Disable the row: a button is disabled, a link loses its target, click is not emitted. A plain row is only dimmed" },
        { ...hiddenProp, description: "Remove the item (v-if, so an inset list rounds the right corners)" },
      ],
      slots: [
        { name: "icon", description: "Leading content — an image, an avatar. Replaces the icon prop" },
        { name: "default", description: "Replaces the title and subtitle" },
        { name: "subtitle-prefix", description: "Inline before the subtitle text, e.g. a CuiStatusDot" },
        { name: "trailing", description: "Trailing content — a badge, a value, a toggle. Replaces the chevron" },
      ],
      events: [{ name: "click", payload: "MouseEvent", description: "The row was activated. Its presence makes a plain row a <button>; not emitted while disabled" }],
      methods: [
        { name: "focus", signature: "(options?: FocusOptions) => void", description: "Focus the row element" },
        { name: "blur", signature: "() => void", description: "Blur the row element" },
      ],
    },
  ],

  tokens: [
    { name: "--cui-list-bg", default: "var(--cui-card-bg, var(--cui-surface-base))", description: "Inset row fill" },
    { name: "--cui-list-border", default: "var(--cui-card-border, 1px solid var(--cui-border))", description: "Inset outer border shorthand" },
    { name: "--cui-list-radius", default: radiusDefault, description: "Inset outer corner radius, and the hover fill's" },
    { name: "--cui-list-hover-bg", default: "var(--cui-surface-bg)", description: "Fill under a hovered interactive row" },
    { name: "--cui-list-active-bg", default: "var(--cui-list-hover-bg)", description: "Fill under a pressed row" },
    { name: "--cui-list-focus-ring", default: "var(--cui-primary-focus-ring)", description: "Row focus ring colour" },
    { name: "--cui-list-px", default: "1rem", description: "Row horizontal padding, and the divider inset (density-scaled)" },
    { name: "--cui-list-py", default: "0.75rem", description: "Row vertical padding (density-scaled)" },
    { name: "--cui-list-gap", default: "0.75rem", description: "Gap between icon, text and trailing content (density-scaled)" },
    { name: "--cui-list-color", default: "var(--cui-text-emphasis)", description: "Row text, and so the title" },
    { name: "--cui-list-font-size", default: "0.9375rem", description: "Title size" },
    { name: "--cui-list-subtitle-color", default: "var(--cui-text-body)", description: "Subtitle colour — 7:1 on the fill and the hover fill" },
    { name: "--cui-list-subtitle-font-size", default: "0.8125rem", description: "Subtitle size" },
    { name: "--cui-list-divider-color", default: "var(--cui-border)", description: "Divider colour" },
  ],
};

export default meta;

import type { ComponentMeta } from "./types";
import { hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Sidebar",
  description:
    "The layout shell of a side navigation: a named <nav> column with a header, a scrolling content area and a footer, which sizes to its container and, below a viewport breakpoint, moves into a slideover. The links inside are a CuiList, in collapsible CuiSidebarGroups.",
  interactive: true,

  parts: [
    {
      name: "CuiSidebar",
      props: [
        { name: "label", type: "string", default: "Sidebar", description: "Accessible name of the <nav> landmark. A page with a sidebar and another navigation has two; they must be told apart" },
        {
          name: "collapse-below",
          type: "sm | md | lg | xl | 2xl | never",
          default: "lg",
          description:
            "The viewport below which the sidebar leaves the page and its content moves into a slideover. never keeps it inline at every width: for a sidebar nested in a container, a panel or a drawer of its own",
        },
        { name: "side", type: "left | right", default: "left", description: "Which edge the sidebar sits on, and the drawer slides from" },
        {
          name: "sticky",
          type: "boolean",
          default: "false",
          description:
            "Stick to the top of the page while it scrolls, below --cui-navbar-height (0 without a navbar), filling the rest of the viewport. Off, it sizes to its container",
        },
        {
          name: "toggle",
          type: "boolean",
          default: "true",
          description: "Show the menu button that opens the drawer while collapsed. Turn it off to open the drawer from your own button through v-model:open",
        },
        { name: "v-model:open", type: "boolean", default: "false", description: "Whether the drawer is open. Only meaningful while collapsed; it closes when the viewport grows past the breakpoint" },
        hiddenProp,
      ],
      slots: [{ name: "default", description: "CuiSidebarHeader, CuiSidebarContent and CuiSidebarFooter" }],
      methods: [
        { name: "toggle", signature: "() => void", description: "Open or close the drawer. No effect while the sidebar is inline" },
      ],
    },
    {
      name: "CuiSidebarHeader",
      props: [
        { name: "title", type: "string", description: "The title" },
        { name: "subtitle", type: "string", description: "A line under the title" },
        { name: "icon", type: "string | Component", description: "Leading icon: a registered name or an icon component" },
        hiddenProp,
      ],
      slots: [
        { name: "default", description: "Replaces the title and subtitle" },
        { name: "icon", description: "Replaces the icon prop" },
        { name: "suffix", description: "Trailing content, e.g. a version badge" },
      ],
    },
    {
      name: "CuiSidebarContent",
      props: [hiddenProp],
      slots: [{ name: "default", description: "Links and groups. This is the part that scrolls; the header and footer stay put" }],
    },
    {
      name: "CuiSidebarFooter",
      props: [hiddenProp],
      slots: [{ name: "default", description: "Anything pinned under the links: an account menu, a version, a sign-out" }],
    },
    {
      name: "CuiSidebarGroup",
      props: [
        { name: "label", type: "string", description: "The group's heading, shown in capitals. The #label slot replaces it" },
        { name: "v-model:expanded", type: "boolean", description: "Whether the group is open. Left unbound, the group keeps its own state" },
        {
          name: "default-expanded",
          type: "boolean",
          default: "false",
          description:
            "Open at first render. Without it, and without v-model:expanded, a group opens on mount if it holds the current page: a link marked aria-current, which a router-link that is exactly active sets",
        },
        hiddenProp,
      ],
      slots: [
        { name: "default", description: "The group's links, typically a CuiList" },
        { name: "label", description: "Replaces the label prop" },
      ],
    },
  ],

  tokens: [
    { name: "--cui-sidebar-bg", default: "var(--cui-surface-base)", description: "Sidebar fill" },
    { name: "--cui-sidebar-border", default: "var(--cui-border)", description: "The rule between the sidebar and the page" },
    { name: "--cui-sidebar-radius", default: "var(--cui-radius-md, 0.375rem)", description: "Corner radius of a link and a group heading" },
    { name: "--cui-sidebar-pressed-bg", default: "var(--cui-surface-bg)", description: "Fill of the current page's link" },
    { name: "--cui-sidebar-pressed-border", default: "var(--cui-border)", description: "Border of the current page's link" },
    { name: "--cui-sidebar-pressed-color", default: "var(--cui-text-emphasis)", description: "Text of the current page's link" },
    { name: "--cui-sidebar-footer-border", default: "var(--cui-border)", description: "The rule above the footer" },
    { name: "--cui-sidebar-group-color", default: "var(--cui-text-tertiary)", description: "A group heading's text" },
    { name: "--cui-sidebar-group-font-size", default: "0.75rem", description: "A group heading's size" },
    { name: "--cui-sidebar-group-hover-bg", default: "var(--cui-surface-bg)", description: "Fill under a hovered group heading" },
    { name: "--cui-sidebar-group-border", default: "var(--cui-border)", description: "The guide rule beside a group's links" },
    { name: "--cui-sidebar-group-focus-ring", default: "var(--cui-primary-focus-ring)", description: "A group heading's focus ring" },
    { name: "--cui-navbar-height", default: "0px", description: "Read by a sticky sidebar for its top offset, so a sticky navbar can sit above it. Set it on :root or the page container" },
  ],
};

export default meta;

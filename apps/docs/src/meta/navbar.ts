import type { ComponentMeta } from "./types";
import { hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Navbar",
  description:
    "The application header: a <header> landmark with a brand, a named <nav> and a trailing actions area. Below a viewport breakpoint the nav moves into a slideover behind a labelled menu button, and a CuiNavbarMenu changes from a dropdown to a collapsible group, so the navigation is written once. Optionally sticky.",
  interactive: true,

  parts: [
    {
      name: "CuiNavbar",
      props: [
        { name: "label", type: "string", default: "Main", description: "Accessible name of the <nav> landmark. A page with a navbar and a sidebar has two navigations; they must be told apart" },
        {
          name: "collapse-below",
          type: "sm | md | lg | xl | 2xl | never",
          default: "lg",
          description:
            "The viewport below which the nav leaves the bar for a slideover behind a menu button. never keeps it in the bar at every width. Brand and actions always stay in the bar",
        },
        {
          name: "sticky",
          type: "boolean",
          default: "false",
          description:
            "Stick to the top of the page. It gains a border and a shadow once the page has scrolled, and sets --cui-navbar-height on the document, with a matching scroll-padding-top so a focused element is never left under the bar",
        },
        {
          name: "toggle",
          type: "boolean",
          default: "true",
          description: "Show the menu button that opens the drawer while collapsed. Turn it off to open the drawer from your own button",
        },
        { name: "v-model:open", type: "boolean", default: "false", description: "Whether the drawer is open. Only meaningful while collapsed; it closes when the viewport grows past the breakpoint" },
        hiddenProp,
      ],
      slots: [{ name: "default", description: "CuiNavbarBrand, CuiNavbarNav and CuiNavbarActions, in the order they should sit" }],
      methods: [
        { name: "toggle", signature: "() => void", description: "Open or close the drawer. No effect while the nav is in the bar" },
        { name: "toggleAttrs", signature: "ComputedRef<{ 'aria-expanded': boolean; 'aria-controls': string; 'aria-label': string }>", description: "What a button of your own binds (v-bind) to open the drawer: its state, the drawer's id and the translated menu name" },
      ],
    },
    {
      name: "CuiNavbarBrand",
      props: [{ name: "href", type: "string", description: "Make the brand a link, typically to the home page. Without it the brand is plain content" }, hiddenProp],
      slots: [{ name: "default", description: "A logo, a name; or a router-link for a routed brand" }],
    },
    {
      name: "CuiNavbarNav",
      props: [hiddenProp],
      slots: [
        {
          name: "default",
          description:
            "Links (CuiNavbarLink, <a> or router-link) and CuiNavbarMenus. Written once: in the bar while there is room, in the drawer below the breakpoint, never both. The current page's link carries aria-current=\"page\"",
        },
      ],
    },
    {
      name: "CuiNavbarMenu",
      props: [
        { name: "label", type: "string", description: "The menu's name: the trigger's text in the bar, the group's heading in the drawer" },
        { name: "icon", type: "string | Component", description: "Leading icon of the trigger and of the group's heading: a registered name or an icon component" },
        hiddenProp,
      ],
      slots: [
        { name: "default", description: "Links, typically CuiNavbarLinks. In the bar each becomes a menu item of a dropdown and choosing one closes it; in the drawer they sit in a collapsible group" },
        { name: "label", description: "Replaces the label prop" },
        { name: "suffix", description: "Trailing content on the trigger (before its caret) and on the group's heading: a badge or a count" },
      ],
    },
    {
      name: "CuiNavbarLink",
      props: [
        { name: "to", type: "string | object", description: "Render the link as a router-link to this route" },
        { name: "href", type: "string", description: "Render the link as an <a> to this URL. to takes precedence" },
        { name: "icon", type: "string | Component", description: "Leading icon: a registered name or an icon component. Decorative, hidden from assistive technology" },
        { name: "active", type: "boolean", description: "Mark this the current page (aria-current=\"page\"), or, false, not. Left unset, a router-link marks the current page itself" },
        { name: "disabled", type: "boolean", default: "false", description: "Drop the link's target so it can neither be focused nor followed, and dim it" },
        hiddenProp,
      ],
      slots: [
        { name: "default", description: "The label. Without one the link is icon-only and needs an aria-label (a warning in development says so)" },
        { name: "suffix", description: "Trailing content: a badge, a count, a chevron or an external-link marker. In the drawer and in menus it sits at the end of the row" },
      ],
    },
    {
      name: "CuiNavbarActions",
      props: [hiddenProp],
      slots: [{ name: "default", description: "Plain content for the trailing edge: buttons, a theme switcher, an account menu. The navbar gives it no special support" }],
    },
  ],

  tokens: [
    { name: "--cui-navbar-bg", default: "var(--cui-surface-base)", description: "Bar fill" },
    { name: "--cui-navbar-border", default: "var(--cui-border)", description: "The rule under the bar. A sticky bar shows it once scrolled" },
    { name: "--cui-navbar-px", default: "1.5rem", description: "Horizontal padding of the bar" },
    { name: "--cui-navbar-gap", default: "0.75rem", description: "Space between the brand, the nav and the actions" },
    { name: "--cui-navbar-link-gap", default: "0.5rem", description: "Space between a CuiNavbarLink's icon, label and suffix" },
    { name: "--cui-navbar-focus-ring", default: "var(--cui-primary-focus-ring)", description: "A CuiNavbarLink's focus ring" },
    { name: "--cui-navbar-radius", default: "var(--cui-radius-md, 0.375rem)", description: "Corner radius of a link" },
    { name: "--cui-navbar-color", default: "var(--cui-text-secondary)", description: "A nav link's text" },
    { name: "--cui-navbar-font-size", default: "0.875rem", description: "A nav link's size" },
    { name: "--cui-navbar-hover-bg", default: "var(--cui-surface-bg)", description: "Fill under a hovered link" },
    { name: "--cui-navbar-hover-color", default: "var(--cui-text-emphasis)", description: "Text of a hovered link" },
    { name: "--cui-navbar-pressed-bg", default: "var(--cui-surface-bg)", description: "Fill of the current page's link" },
    { name: "--cui-navbar-pressed-border", default: "var(--cui-border)", description: "Border of the current page's link" },
    { name: "--cui-navbar-pressed-color", default: "var(--cui-text-emphasis)", description: "Text of the current page's link" },
    { name: "--cui-navbar-height", default: "(measured)", description: "An output, not a setting: a sticky navbar writes its measured height here on the document, for a sticky CuiSidebar's offset and for scroll-padding-top" },
  ],
};

export default meta;

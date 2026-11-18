/**
 * The one list of documentation pages (#516). The sidebar renders it and the search filters it;
 * nothing else keeps a copy. A command palette would read it too.
 *
 * `keywords` are what people type that the label does not say: synonyms ("dialog" for Modal),
 * the name in another library ("switch" for Toggle), the job the page does ("calendar" for Date
 * Picker). Matching ignores case, spaces and hyphens, so "date picker" and "date-picker" need
 * no second entry. `__tests__/pages.test.ts` fails on a page with no keyword and on a route
 * that has no entry here, or the reverse.
 */
export interface DocPage {
  id: string;
  label: string;
  path: string;
  group: string;
  keywords: string[];
}

/** Links outside any collapsible group, at the top of the navigation. */
export const STANDALONE_GROUP = "Getting Started";

export const PAGES: readonly DocPage[] = [
  // Getting Started
  { id: "overview", label: "Overview", path: "/", group: "Getting Started", keywords: ["home", "intro", "introduction", "about", "start"] },
  { id: "installation", label: "Installation", path: "/installation", group: "Getting Started", keywords: ["install", "setup", "npm", "pnpm", "yarn", "get started", "plugin", "css import", "ssr", "nuxt"] },
  { id: "changelog", label: "Changelog", path: "/changelog", group: "Getting Started", keywords: ["releases", "release notes", "versions", "history", "what's new", "breaking changes", "migration"] },

  // Foundations
  { id: "colors", label: "Colors", path: "/foundations/colors", group: "Foundations", keywords: ["colors", "palette", "tokens", "roles", "scale", "contrast", "semantic"] },
  { id: "icons", label: "Icons", path: "/foundations/icons", group: "Foundations", keywords: ["phosphor", "svg", "glyph", "register icons", "icon names"] },
  { id: "themes", label: "Themes", path: "/foundations/themes", group: "Foundations", keywords: ["theme", "dark mode", "presets", "navy", "forest", "branding", "customise", "customize", "css variables", "custom properties"] },
  { id: "typography", label: "Typography", path: "/foundations/typography", group: "Foundations", keywords: ["fonts", "headings", "text", "prose", "type", "font size", "code text"] },
  { id: "localization", label: "Localization", path: "/foundations/localization", group: "Foundations", keywords: ["i18n", "l10n", "translation", "translate", "messages", "language", "locale", "rtl"] },
  { id: "motion", label: "Motion", path: "/foundations/motion", group: "Foundations", keywords: ["animation", "transition", "easing", "duration", "reduced motion", "prefers-reduced-motion"] },
  { id: "density", label: "Density", path: "/foundations/density", group: "Foundations", keywords: ["compact", "spacing", "comfortable", "dense", "size scale"] },
  { id: "utilities", label: "Utilities", path: "/foundations/utilities", group: "Foundations", keywords: ["helpers", "functions", "sizing", "responsive", "classes", "sr-only", "scrollbar"] },

  // Layout
  { id: "container", label: "Container", path: "/components/container", group: "Layout", keywords: ["wrapper", "max width", "page width", "centered", "section"] },
  { id: "divider", label: "Divider", path: "/components/divider", group: "Layout", keywords: ["separator", "rule", "hr", "line"] },
  { id: "flex", label: "Flex", path: "/components/flex", group: "Layout", keywords: ["flexbox", "row", "column", "align", "justify", "layout"] },
  { id: "flex-item", label: "Flex Item", path: "/components/flex-item", group: "Layout", keywords: ["flexbox", "grow", "shrink", "basis", "child"] },
  { id: "grid", label: "Grid", path: "/components/grid", group: "Layout", keywords: ["columns", "css grid", "responsive", "layout", "rows"] },
  { id: "grid-item", label: "Grid Item", path: "/components/grid-item", group: "Layout", keywords: ["span", "column span", "cell", "child"] },
  { id: "panel", label: "Panel", path: "/components/panel", group: "Layout", keywords: ["pane", "region", "section", "surface", "box", "app shell"] },
  { id: "resizable-panels", label: "Resizable Panels", path: "/components/resizable-panels", group: "Layout", keywords: ["split", "split pane", "splitter", "resize", "drag", "divider handle"] },
  { id: "scroll-area", label: "Scroll Area", path: "/components/scroll-area", group: "Layout", keywords: ["scroll", "scrollbar", "overflow", "scroll shadows", "scrollable"] },
  { id: "sidebar", label: "Sidebar", path: "/components/sidebar", group: "Layout", keywords: ["drawer", "side nav", "side menu", "navigation", "menu", "collapsible", "app shell", "sidebar group"] },
  { id: "spacer", label: "Spacer", path: "/components/spacer", group: "Layout", keywords: ["gap", "space", "margin", "padding", "whitespace"] },
  { id: "stack", label: "Stack", path: "/components/stack", group: "Layout", keywords: ["vstack", "hstack", "vertical", "horizontal", "spacing", "gap", "layout"] },

  // Form Controls
  { id: "checkbox", label: "Checkbox", path: "/components/checkbox", group: "Form Controls", keywords: ["check", "tick", "checkbox group", "multi select", "indeterminate", "boolean"] },
  { id: "color-picker", label: "Color Picker", path: "/components/color-picker", group: "Form Controls", keywords: ["color picker", "swatch", "hex", "hue", "eyedropper", "palette"] },
  { id: "combobox", label: "Combobox", path: "/components/combobox", group: "Form Controls", keywords: ["autocomplete", "autosuggest", "typeahead", "search select", "dropdown", "select", "async search", "listbox"] },
  { id: "date-picker", label: "Date Picker", path: "/components/date-picker", group: "Form Controls", keywords: ["calendar", "date", "day", "month", "year"] },
  { id: "date-range-picker", label: "Date Range", path: "/components/date-range-picker", group: "Form Controls", keywords: ["date range picker", "range", "calendar", "from to", "start end", "period", "date picker"] },
  { id: "fieldset", label: "Fieldset", path: "/components/fieldset", group: "Form Controls", keywords: ["group", "legend", "form section", "collapsible", "form group"] },
  { id: "file-upload", label: "File Upload", path: "/components/file-upload", group: "Form Controls", keywords: ["upload", "dropzone", "drag and drop", "attachment", "file input", "browse"] },
  { id: "form", label: "Form", path: "/components/form", group: "Form Controls", keywords: ["validation", "submit", "validate", "errors", "form fields"] },
  { id: "form-field", label: "Form Field", path: "/components/form-field", group: "Form Controls", keywords: ["label", "help text", "description", "error message", "field", "floating label", "required"] },
  { id: "input", label: "Input", path: "/components/input", group: "Form Controls", keywords: ["text field", "text input", "textbox", "password", "email", "search", "clearable", "number"] },
  { id: "input-stepper", label: "Input Stepper", path: "/components/input-stepper", group: "Form Controls", keywords: ["number input", "spinner", "increment", "decrement", "plus minus", "quantity", "numeric"] },
  { id: "masked-input", label: "Masked Input", path: "/components/masked-input", group: "Form Controls", keywords: ["mask", "format", "phone", "credit card", "pattern", "input mask"] },
  { id: "pin-input", label: "Pin Input", path: "/components/pin-input", group: "Form Controls", keywords: ["otp", "one time code", "verification code", "passcode", "code input", "2fa", "digits"] },
  { id: "radio", label: "Radio", path: "/components/radio", group: "Form Controls", keywords: ["radio group", "radio button", "option", "single choice", "choice", "segmented"] },
  { id: "rating", label: "Rating", path: "/components/rating", group: "Form Controls", keywords: ["stars", "star rating", "review", "score", "feedback"] },
  { id: "select", label: "Select", path: "/components/select", group: "Form Controls", keywords: ["dropdown", "picker", "choose", "options", "listbox", "multiselect", "multi select", "combobox"] },
  { id: "slider", label: "Slider", path: "/components/slider", group: "Form Controls", keywords: ["range", "range slider", "track", "thumb", "volume"] },
  { id: "tag-input", label: "Tag Input", path: "/components/tag-input", group: "Form Controls", keywords: ["tags", "chips", "token field", "multi value", "labels", "keywords", "badge input"] },
  { id: "textarea", label: "Textarea", path: "/components/textarea", group: "Form Controls", keywords: ["multiline", "multi line", "text area", "comment box", "message", "auto resize", "character count"] },
  { id: "time-picker", label: "Time Picker", path: "/components/time-picker", group: "Form Controls", keywords: ["time", "clock", "hours", "minutes", "am pm"] },
  { id: "toggle", label: "Toggle", path: "/components/toggle", group: "Form Controls", keywords: ["switch", "on off", "boolean", "toggle group", "setting", "flip"] },
  { id: "transfer-list", label: "Transfer List", path: "/components/transfer-list", group: "Form Controls", keywords: ["dual list", "dual listbox", "move items", "shuttle", "two lists", "pick list"] },

  // Actions
  { id: "button", label: "Button", path: "/components/button", group: "Actions", keywords: ["btn", "cta", "link button", "click", "submit", "icon button", "loading", "variant"] },
  { id: "button-group", label: "Button Group", path: "/components/button-group", group: "Actions", keywords: ["segmented", "split button", "joined buttons", "attached", "toggle buttons"] },
  { id: "copy-button", label: "Copy Button", path: "/components/copy-button", group: "Actions", keywords: ["clipboard", "copy", "copy to clipboard", "copy paste"] },
  { id: "toolbar", label: "Toolbar", path: "/components/toolbar", group: "Actions", keywords: ["action bar", "button bar", "tools", "toolbar group", "roving focus", "menu bar"] },

  // Feedback
  { id: "alert", label: "Alert", path: "/components/alert", group: "Feedback", keywords: ["message", "notice", "callout", "warning", "error", "info", "success", "notification", "inline message"] },
  { id: "banner", label: "Banner", path: "/components/banner", group: "Feedback", keywords: ["announcement", "site wide", "notice", "top bar", "dismissible", "promo"] },
  { id: "empty-state", label: "Empty State", path: "/components/empty-state", group: "Feedback", keywords: ["no results", "no data", "placeholder", "blank slate", "zero state", "nothing here"] },
  { id: "skeleton", label: "Skeleton", path: "/components/skeleton", group: "Feedback", keywords: ["loading", "placeholder", "shimmer", "loader", "content placeholder"] },
  { id: "spinner", label: "Spinner", path: "/components/spinner", group: "Feedback", keywords: ["loading", "loader", "busy", "activity", "progress", "wait"] },
  { id: "status-dot", label: "Status Dot", path: "/components/status-dot", group: "Feedback", keywords: ["indicator", "online", "offline", "presence", "badge", "health", "state"] },
  { id: "toast", label: "Toast", path: "/components/toast", group: "Feedback", keywords: ["snackbar", "notification", "notify", "flash message", "use toast", "toast provider", "popup message"] },

  // Data Display
  { id: "accordion", label: "Accordion", path: "/components/accordion", group: "Data Display", keywords: ["collapse", "collapsible", "expand", "faq", "disclosure", "details", "expandable"] },
  { id: "avatar", label: "Avatar", path: "/components/avatar", group: "Data Display", keywords: ["profile picture", "user image", "initials", "avatar group", "photo", "profile"] },
  { id: "badge", label: "Badge", path: "/components/badge", group: "Data Display", keywords: ["tag", "chip", "pill", "label", "count", "status", "lozenge"] },
  { id: "card", label: "Card", path: "/components/card", group: "Data Display", keywords: ["tile", "panel", "box", "container", "card header", "card body", "surface"] },
  { id: "code-block", label: "Code Block", path: "/components/code-block", group: "Data Display", keywords: ["code", "pre", "syntax highlighting", "snippet", "source", "monospace", "highlight"] },
  { id: "data-grid", label: "Data Grid", path: "/components/data-grid", group: "Data Display", keywords: ["table", "datatable", "data table", "spreadsheet", "rows", "columns", "sort", "filter", "pagination", "selection", "virtual"] },
  { id: "kbd", label: "Kbd", path: "/components/kbd", group: "Data Display", keywords: ["keyboard", "key", "shortcut", "hotkey", "keycap", "keystroke"] },
  { id: "list", label: "List", path: "/components/list", group: "Data Display", keywords: ["list item", "rows", "items", "menu list", "listing", "ul"] },
  { id: "progress", label: "Progress", path: "/components/progress", group: "Data Display", keywords: ["progress bar", "meter", "percentage", "loading", "circle", "gauge", "determinate"] },
  { id: "table", label: "Table", path: "/components/table", group: "Data Display", keywords: ["grid", "data table", "rows", "columns", "tabular", "thead", "sortable", "datagrid"] },
  { id: "timeline", label: "Timeline", path: "/components/timeline", group: "Data Display", keywords: ["history", "activity", "events", "steps", "feed", "log", "chronology"] },
  { id: "tree-view", label: "Tree View", path: "/components/tree-view", group: "Data Display", keywords: ["tree", "hierarchy", "nested", "file tree", "folders", "expandable", "outline"] },

  // Navigation
  { id: "breadcrumb", label: "Breadcrumb", path: "/components/breadcrumb", group: "Navigation", keywords: ["breadcrumbs", "trail", "path", "location", "hierarchy", "you are here"] },
  { id: "navbar", label: "Navbar", path: "/components/navbar", group: "Navigation", keywords: ["navigation bar", "header", "top bar", "app bar", "menu", "nav", "site header", "topbar"] },
  { id: "pagination", label: "Pagination", path: "/components/pagination", group: "Navigation", keywords: ["pager", "pages", "next previous", "page numbers", "paging"] },
  { id: "stepper", label: "Stepper", path: "/components/stepper", group: "Navigation", keywords: ["wizard", "steps", "progress steps", "multi step", "checkout", "stages", "onboarding"] },
  { id: "tabs", label: "Tabs", path: "/components/tabs", group: "Navigation", keywords: ["tab", "tab bar", "tab panel", "tablist", "pills", "segmented", "views"] },

  // App Shells (#507): whole-page layouts built from the components above.
  { id: "shell-sidebar", label: "Sidebar and Content", path: "/app-shells/sidebar", group: "App Shells", keywords: ["app shell", "layout", "page layout", "dashboard", "admin", "left nav", "side navigation", "template", "recipe"] },
  { id: "shell-navbar", label: "Top Navbar and Content", path: "/app-shells/navbar", group: "App Shells", keywords: ["app shell", "layout", "page layout", "header", "top nav", "marketing", "template", "recipe"] },
  { id: "shell-navbar-sidebar", label: "Navbar and Sidebar", path: "/app-shells/navbar-sidebar", group: "App Shells", keywords: ["app shell", "layout", "page layout", "dashboard", "admin", "header", "docs site", "template", "recipe"] },
  { id: "shell-detail-drawer", label: "Sidebar and Detail Drawer", path: "/app-shells/detail-drawer", group: "App Shells", keywords: ["app shell", "layout", "master detail", "inspector", "side panel", "slideover", "inbox", "template", "recipe"] },

  // Overlay
  { id: "command-palette", label: "Command Palette", path: "/components/command-palette", group: "Overlay", keywords: ["cmd k", "ctrl k", "command k", "spotlight", "quick actions", "quick open", "omnibar", "search everything", "hotkey", "shortcut", "fuzzy", "use command palette", "register commands", "command registry", "command menu"] },
  { id: "confirm-dialog", label: "Confirm Dialog", path: "/components/confirm-dialog", group: "Overlay", keywords: ["dialog", "confirm", "confirmation", "are you sure", "alert dialog", "prompt", "delete confirmation", "modal", "popup"] },
  { id: "context-menu", label: "Context Menu", path: "/components/context-menu", group: "Overlay", keywords: ["right click", "menu", "popup menu", "contextual", "dropdown", "long press"] },
  { id: "drawer", label: "Drawer", path: "/components/drawer", group: "Overlay", keywords: ["bottom sheet", "sheet", "swipe", "drag", "snap points", "mobile", "vaul", "flick", "overlay"] },
  { id: "dropdown", label: "Dropdown", path: "/components/dropdown", group: "Overlay", keywords: ["menu", "dropdown menu", "actions menu", "popup menu", "kebab", "overflow menu", "submenu", "select", "popover"] },
  { id: "modal", label: "Modal", path: "/components/modal", group: "Overlay", keywords: ["dialog", "popup", "overlay", "lightbox", "window", "backdrop", "focus trap", "modal dialog"] },
  { id: "popover", label: "Popover", path: "/components/popover", group: "Overlay", keywords: ["tooltip", "popup", "overlay", "floating", "flyout", "hovercard", "anchored", "bubble"] },
  { id: "slideover", label: "Slideover", path: "/components/slideover", group: "Overlay", keywords: ["drawer", "side panel", "sheet", "off canvas", "flyout", "overlay", "sidebar", "panel"] },
  { id: "slideover-stack", label: "Slideover Stack", path: "/components/slideover-stack", group: "Overlay", keywords: ["stacked", "nested", "multiple", "cascade", "peek", "co-active", "history panel", "side by side", "panels", "overlay stack", "shared backdrop", "depth", "inert"] },
  { id: "tooltip", label: "Tooltip", path: "/components/tooltip", group: "Overlay", keywords: ["hint", "hover", "title", "popover", "help text", "label on hover", "bubble"] },

  // Composables (#296): interaction, positioning, responsive, forms
  { id: "click-outside", label: "Click Outside", path: "/composables/click-outside", group: "Composables", keywords: ["use click outside", "outside click", "dismiss", "close on click", "blur"] },
  { id: "color-mode", label: "Color Mode", path: "/composables/color-mode", group: "Composables", keywords: ["use color mode", "dark mode", "light mode", "theme toggle", "system", "appearance", "night"] },
  { id: "roving-focus", label: "Roving Focus", path: "/composables/roving-focus", group: "Composables", keywords: ["use roving focus", "keyboard navigation", "arrow keys", "tabindex", "focus management", "focus"] },
  { id: "locale", label: "Locale", path: "/composables/locale", group: "Composables", keywords: ["use locale", "language", "i18n", "translation", "messages", "intl", "localisation"] },
  { id: "overlay", label: "Overlay", path: "/composables/overlay", group: "Composables", keywords: ["use overlay", "modal", "focus trap", "scroll lock", "escape key", "layer stack", "dialog"] },
  { id: "floating-panels", label: "Floating Panels", path: "/composables/floating-panels", group: "Composables", keywords: ["positioning", "anchor", "popper", "floating ui", "compute dropdown position", "flip", "placement", "popover", "dropdown"] },
  { id: "scroll-shadows", label: "Scroll Shadows", path: "/composables/scroll-shadows", group: "Composables", keywords: ["use scroll shadows", "scroll fade", "overflow", "edge shadow", "scroll"] },
  { id: "scroll-spy", label: "Scroll Spy", path: "/composables/scroll-spy", group: "Composables", keywords: ["use scroll spy", "active section", "table of contents", "toc", "on this page", "headings", "scroll"] },
  { id: "breakpoint", label: "Breakpoint & Layout Context", path: "/composables/breakpoint", group: "Composables", keywords: ["use breakpoint", "responsive", "media query", "viewport", "screen size", "mobile", "layout context"] },
  { id: "color-scheme", label: "Color Scheme", path: "/composables/color-scheme", group: "Composables", keywords: ["use color scheme", "dark mode", "prefers color scheme", "observe dark", "light dark"] },
  { id: "field-aria", label: "Field ARIA", path: "/composables/field-aria", group: "Composables", keywords: ["use field described by", "aria", "accessibility", "a11y", "describedby", "labelledby", "form control"] },
];

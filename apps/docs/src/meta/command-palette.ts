import type { ComponentMeta } from "./types";
import { colorProp, hiddenProp, visibleProp } from "./shared";
import { overlayFocusProps } from "./modal";

const meta: ComponentMeta = {
  name: "Command Palette",
  description:
    "A search-and-run dialog for every action in an app, opened with Cmd/Ctrl-K. Commands are registered from anywhere with useCommandPalette(), grouped, ranked by a built-in fuzzy match, and run once the palette has closed.",
  interactive: true,

  props: [
    visibleProp(),
    {
      name: "registry",
      type: "UseCommandPalette",
      description:
        "The registry to list, open and remember in, from createCommandPalette(). Unset, the nearest one provided by useCommandPaletteProvider() or app.provide(CuiCommandPaletteKey, …), else the page-wide default. Register commands into the same object",
    },
    {
      name: "commands",
      type: "CuiCommand[]",
      default: "[]",
      description:
        "Commands listed besides the registered ones. One with the same id as a registered command replaces it. Most apps register instead (see useCommandPalette)",
    },
    {
      name: "groups",
      type: "CuiCommandGroup[]",
      default: "[]",
      description:
        "Headings and their order: { id, label?, priority? }. Higher priority comes first; ties keep the order the groups were registered in. A command's group that is not listed is headed by its id; a command with no group sits under no heading",
    },
    {
      name: "placeholder",
      type: "string",
      default: "Type a command or search…",
      description: "The search field's placeholder. The default comes from the message catalog (commandPalette.placeholder)",
    },
    {
      name: "label",
      type: "string",
      default: "Command palette",
      description: "The dialog's, the field's and the list's accessible name (commandPalette.label)",
    },
    {
      name: "hotkey",
      type: "string | false",
      default: "mod+k",
      description:
        "The shortcut that opens and closes it: + separated, one key with mod (Command on a Mac, Control elsewhere), ctrl, meta, alt, shift. Exact: mod+k ignores mod+shift+k. false turns it off. A key another handler already took with preventDefault() is left alone. Where several palettes listen for the same shortcut, the one mounted last handles it",
    },
    {
      name: "recent",
      type: "number",
      default: "5",
      description: "How many recently run commands to list first, under their own heading, while nothing is typed. 0 for none",
    },
    {
      name: "recentsStorageKey",
      type: "string",
      description: "A localStorage key to keep the recents under, across visits. Unset, they last until the page unloads",
    },
    { name: "maxResults", type: "number", default: "100", description: "The most local results listed, across groups. Results from fetchCommands are the server's to limit" },
    {
      name: "fetchCommands",
      type: "(query, { signal }) => Promise<CuiCommand[]>",
      description:
        "Search somewhere else as well. Called after the debounce; its commands are listed under Results after the local ones, in the order returned, not matched or ranked again, with ids the local list already shows dropped. Only the latest search lands and the one before is aborted through signal. A failure shows a message and clears the spinner",
    },
    { name: "debounce", type: "number", default: "300", description: "Milliseconds to wait after typing before fetchCommands is called" },
    { name: "minChars", type: "number", default: "1", description: "The fewest characters that start a fetchCommands search. Below it nothing is sent and earlier results are dropped" },
    colorProp("Color role of the highlighted row, the match underline and the focus ring"),
    ...overlayFocusProps.map((p) =>
      p.name === "initialFocus"
        ? { ...p, default: "the search field", description: "Element focused on open. Unset, the search field" }
        : p,
    ),
    hiddenProp,
  ],

  slots: [
    {
      name: "item",
      payload: "{ command, active, query, segments, badge }",
      description:
        "One result row, in place of the icon, label, description and shortcut. segments is the label split into { text, match } stretches, for rendering your own highlight",
    },
    {
      name: "heading",
      payload: "{ group: { id, label }, count }",
      description: "A group's heading, in place of its label",
    },
    { name: "empty", payload: "{ query }", description: "Shown, in place of the message, when nothing matches" },
  ],

  events: [
    { name: "update:visible", payload: "boolean", description: "Open state changed — what v-model:visible binds to" },
    {
      name: "select",
      payload: "CuiCommand",
      description: "A command was chosen, by Enter or a click. Its action runs after the palette has closed, not now",
    },
    { name: "close", payload: "—", description: "The exit has finished" },
    { name: "after-enter", payload: "—", description: "The entry has finished and focus is in the search field" },
    { name: "after-leave", payload: "—", description: "The exit has finished and focus has been returned. The chosen command's action runs next" },
  ],

  methods: [
    { name: "open", signature: "() => void", description: "Opens the palette. The same as useCommandPalette().open()" },
    { name: "close", signature: "() => void", description: "Closes it" },
    { name: "focus", signature: "() => void", description: "Focuses the search field, when it is open" },
  ],

  tokens: [
    { name: "--cui-command-palette-width", default: "36rem", description: "Width of the dialog" },
    { name: "--cui-command-palette-radius", default: "1rem", description: "Corner radius of the dialog" },
    { name: "--cui-command-palette-bg", default: "surface at 86%, translucent", description: "Fill of the dialog" },
    { name: "--cui-command-palette-border", default: "1px solid, tinted by the color role", description: "Border of the dialog. A whole border shorthand" },
    { name: "--cui-command-palette-shadow", default: "the large shadow plus a color glow", description: "Shadow and glow around the dialog" },
    { name: "--cui-command-palette-px", default: "0.75rem–1rem (density)", description: "Horizontal padding of the search field, the rows and the headings" },
    { name: "--cui-command-palette-py", default: "0.5rem–0.75rem (density)", description: "Vertical padding of the search field and the rows" },
    { name: "--cui-command-palette-gap", default: "0.625rem (density)", description: "Space between the search icon and the field" },
    { name: "--cui-command-palette-font-size", default: "0.9375rem / 1rem", description: "Text size of the rows, and of the search field" },
    { name: "--cui-command-palette-color", default: "var(--cui-text-body)", description: "Text color of a row" },
    { name: "--cui-command-palette-radius", default: "var(--cui-radius-md, 0.375rem)", description: "Corner radius of a row" },
    { name: "--cui-command-palette-hover-bg", default: "var(--cui-<color>-bg)", description: "Fill of the highlighted row" },
    { name: "--cui-command-palette-border", default: "1px solid var(--cui-border)", description: "The line under the search field" },
    { name: "--cui-command-palette-focus-ring", default: "var(--cui-<color>-focus-ring)", description: "The search field's focus ring" },
  ],

  parts: [
    {
      name: "CuiCommand",
      props: [
        { name: "id", type: "string", description: "Stable and unique: what the recents remember" },
        { name: "label", type: "string", description: "The text shown, and matched first" },
        { name: "description", type: "string", description: "Secondary text under the label. Searched too, ranked below the label" },
        { name: "keywords", type: "string[]", description: "Extra words that find it — synonyms, the name in another tool. Ranked below the label" },
        { name: "group", type: "string", description: "The id of a group. Without one the command sits under no heading" },
        { name: "priority", type: "number", default: "0", description: "Higher first within its group, and breaks a tie in match score" },
        { name: "icon", type: "string | Component", description: "A registered icon name or an icon component" },
        {
          name: "badge",
          type: "string | number | { label, color? }",
          description:
            "A count or short label beside the row, such as unread notifications, in the library's subtle badge. { label, color } picks a color role. Nothing is shown for 0 or an empty label. It sits before the shortcut, is part of the row's accessible name (Notifications, 3), and follows state when the command is registered through a getter or a ref",
        },
        { name: "shortcut", type: "string | string[]", description: "The shortcut to show, e.g. ⌘N, or [\"G\", \"I\"] for a sequence. Display only: it binds nothing" },
        { name: "disabled", type: "boolean", default: "false", description: "Listed but not runnable: skipped by the arrow keys, ignored on click" },
        { name: "action", type: "(command) => unknown", description: "What choosing it does. Runs once the palette has closed and focus is back where it was" },
      ],
    },
  ],
};

export default meta;

/**
 * Localizable default strings for clean-ui components.
 *
 * Every user-visible string a component renders by default lives here, so an app
 * can translate them ALL at once via `CuiConfigProvider` instead of overriding
 * props on every instance. Interpolated/pluralized strings are functions so
 * locales control wording and word order.
 *
 * Resolution order in components: explicit prop > provider messages > these defaults.
 */

export interface PaginationRange {
  from: number;
  to: number;
  total: number;
}

/**
 * Extension point for satellite packages. `CuiMessages` is re-exported from the
 * barrel, so a plain interface can't be augmented from another package via
 * declaration merging — but this one, extended by `CuiMessages` below, can:
 *
 *   declare module "@itguy614/clean-ui" {
 *     interface CuiMessageNamespaces {
 *       markdownEditor: { linkPrompt: string };
 *     }
 *   }
 *
 * Deliberately not an index signature — that would make every namespace
 * `any`-shaped and lose the type checking this file exists to provide.
 */
export interface CuiMessageNamespaces {}

/**
 * The message keys this package itself ships.
 *
 * Separate from `CuiMessages` so `defaultMessages` below can be annotated with
 * a shape the library can actually satisfy. Declaration merging is
 * whole-program: once a satellite augments `CuiMessageNamespaces`, `CuiMessages`
 * requires a namespace only that satellite can provide, so annotating the
 * literal with `CuiMessages` made it fail its own check in any program
 * containing an augmentation — which is why the type test had to target the
 * built `.d.ts` and why `apps/editor-docs` could not resolve this package to
 * source (#107).
 */
export interface CuiCoreMessages {
  // --- Shared action / aria labels (reused across components) ---
  close: string;
  dismiss: string;
  remove: string;
  clear: string;
  clearAll: string;
  apply: string;
  loading: string;

  input: {
    clear: string;
    showPassword: string;
    hidePassword: string;
  };
  combobox: {
    /** Default `placeholder`. */
    placeholder: string;
    /** Default `noResultsText`. */
    noResults: string;
    searching: string;
    /** Hint shown until `minChars` is reached. */
    typeMore: (remaining: number) => string;
  };
  tagInput: {
    /** Default `placeholder`. */
    placeholder: string;
    /** Default `noSuggestionsText`. */
    noSuggestions: string;
    /** The create option, around the typed value — a function, so word order and quotes are the locale's. */
    create: (value: string) => string;
    searching: string;
  };
  select: {
    /** Default `placeholder`. */
    placeholder: string;
    /** Default `noOptionsText`. */
    noOptions: string;
  };
  fileUpload: {
    /** Default `dragText`, before the browse link. */
    drag: string;
    /** Default `browseText`. */
    browse: string;
    /** Default `uploadText`. */
    upload: string;
    /** The size limit, given already formatted. */
    maxSize: (size: string) => string;
    /** Under the file list: the count and their total size, already formatted. */
    summary: (count: number, size: string) => string;
    /** `reject` reasons, which a consumer renders. */
    tooLarge: (maxSize: string) => string;
    typeNotAccepted: string;
    tooMany: (max: number) => string;
    /** The per-file remove button's name, which shows only an icon (#169). */
    removeFile: (name: string) => string;
  };
  transferList: {
    /** Default `sourceTitle`. */
    source: string;
    /** Default `targetTitle`. */
    target: string;
    /** Default `sourcePlaceholder` / `targetPlaceholder`. */
    filterPlaceholder: string;
    /** An empty list. */
    empty: string;
    /** Names for the transfer and reorder buttons, which show only an icon (#170). */
    moveSelectedTo: (title: string) => string;
    moveAllTo: (title: string) => string;
    moveUp: string;
    moveDown: string;
    /** The filter field's name, given its panel's title. */
    filter: (title: string) => string;
  };
  datePicker: {
    today: string;
    /** The years grid's name: one page of years. */
    yearRange: (start: number, end: number) => string;
  };
  /** The prompt above the calendar while a range is being picked. */
  dateRangePicker: {
    selectStart: string;
    selectEnd: string;
    /** The start and end inputs' names, after the picker's label (#391). Optional: without them, selectStart/selectEnd. */
    start?: string;
    end?: string;
  };
  /** The time picker's hour and minute steppers (#391). Optional, so an existing catalogue type-checks. */
  timePicker?: { hours: string; minutes: string };
  copyButton: {
    /** Default `tooltip`, and the visible label. */
    copy: string;
    /** The visible label once copied. */
    copied: string;
    /** Default `copiedTooltip`, also announced. */
    copiedTooltip: string;
  };
  /** An avatar image's `alt` when it has neither `alt` nor `name`. */
  avatar: { label: string };
  /** CuiSpinner's default `label`. */
  spinner: { label: string };
  /** The label inside a checked toggle's track. */
  toggle: { on: string };
  /** Shared by the listbox-style fields: Combobox, TagInput. */
  listbox: {
    /** Announced as the listed options change, so a screen-reader user hears the filter narrow. */
    results: (count: number) => string;
    /** Shown and announced when a fetchOptions/fetchSuggestions search fails. */
    searchFailed: string;
  };
  confirmDialog: {
    title: string;
    confirm: string;
    cancel: string;
    /** Prompt for type-to-confirm dialogs (rendered as plain text). */
    typePrompt: (word: string) => string;
  };
  pagination: {
    summary: (range: PaginationRange) => string;
    perPage: (count: number) => string;
    /** Name of the <nav> landmark around the page buttons. */
    label: string;
    /** Name of the per-page selector. */
    perPageLabel: string;
    /** Names of the icon-only previous / next buttons. */
    previous: string;
    next: string;
    /**
     * Name of a numbered page button. It replaces the visible digit as the button's name, so
     * it must contain that number as shown, or voice control can't reach it ("click 3").
     */
    page: (page: number) => string;
  };
  breadcrumb: { label: string };
  stepper: {
    label: string;
    /**
     * Read straight after a step's label, separator included, since the check and warning
     * icons say it only visually (#154).
     */
    complete: string;
    error: string;
  };
  skeleton: { label: string };
  rating: {
    /** What a screen reader hears for the value — the slider's aria-valuetext (#171). */
    valueText: (value: number, max: number) => string;
  };
  resizablePanels: {
    /** The splitter's accessible name (#156). */
    handle: string;
  };
  colorPicker: {
    /** Names of the sliders (#177). The gradient is two: saturation across, brightness up. */
    saturation: string;
    brightness: string;
    hue: string;
    alpha: string;
    /** The preset swatches' radiogroup. Each swatch is named by its hex value. */
    swatches: string;
    /** aria-valuetext for the saturation, brightness and alpha sliders. */
    percent: (value: number) => string;
    /** aria-valuetext for the hue slider. */
    degrees: (value: number) => string;
  };
  formField: {
    /**
     * Appended to a required field's label for screen readers. The visible marker is an
     * asterisk, which is `aria-hidden` — without this, required-ness reached no one (#175).
     */
    required: string;
  };
  tabs: { closeTab: string };
  table: {
    /** Accessible name for the scroll region a table gets when it overflows. */
    scrollRegionLabel: string;
  };
  scrollArea: {
    /** Accessible name for an overflowing scroll area, when it isn't given one (#143). */
    region: string;
  };
  dataGrid: {
    noResultsTitle: string;
    noResultsDescription: string;
    filters: string;
    /** "All" option in a select filter. */
    all: string;
    search: string;
    /**
     * The search box's accessible name (#373), where it should differ from `search` (its
     * placeholder, which is no name). Without it the box is named by `search`, less a
     * trailing ellipsis, so a translated placeholder names it in the same language.
     */
    searchLabel?: string;
    /** Placeholder for a per-column filter input. */
    filterColumn: (columnLabel: string) => string;
    /** Selection count in the bulk-action bar. */
    selected: (count: number) => string;
    /** The column manager's trigger and title. */
    columns: string;
    /** The view manager. */
    views: string;
    savedViews: string;
    noSavedViews: string;
    saveCurrent: string;
    saveAs: string;
    save: string;
    viewName: string;
    /** A saved view's delete button (#373). Optional, so an existing catalogue type-checks. */
    deleteView?: (name: string) => string;
    resetViews: string;
    /** Described on a clickable row (aria-description), which has no role to say so (#232). */
    rowHint: string;
    /** Names for controls that show only an icon or a box (#161). */
    selectAll: string;
    /** A row's checkbox, given the row's label (see CuiDataGrid's rowLabel). */
    selectRow: (rowLabel: string) => string;
    /** A row's actions button, given the row's label. */
    rowActions: (rowLabel: string) => string;
    /** A row's label when nothing better names it: its position, 1-based. */
    rowNumber: (position: number) => string;
    tableView: string;
    cardView: string;
  };
}

/**
 * The full catalog a component resolves against: this package's own keys plus
 * whatever satellite packages have merged into `CuiMessageNamespaces`.
 */
export interface CuiMessages extends CuiCoreMessages, CuiMessageNamespaces {}

/** Built-in English defaults. */
export const defaultMessages: CuiCoreMessages = {
  close: "Close",
  dismiss: "Dismiss",
  remove: "Remove",
  clear: "Clear",
  clearAll: "Clear all",
  apply: "Apply",
  loading: "Loading…",

  input: {
    clear: "Clear input",
    showPassword: "Show password",
    hidePassword: "Hide password",
  },
  combobox: {
    placeholder: "Search...",
    noResults: "No results found",
    searching: "Searching…",
    typeMore: (remaining) =>
      `Type ${remaining} more character${remaining === 1 ? "" : "s"}…`,
  },
  tagInput: {
    placeholder: "Add tag...",
    noSuggestions: "No suggestions",
    create: (value) => `Create \u201c${value}\u201d`,
    searching: "Searching…",
  },
  select: {
    placeholder: "Select...",
    noOptions: "No options available",
  },
  fileUpload: {
    drag: "Drag and drop files here, or",
    browse: "Browse",
    upload: "Upload",
    maxSize: (size) => `Max ${size}`,
    summary: (count, size) => `${count} file${count === 1 ? "" : "s"} · ${size}`,
    tooLarge: (maxSize) => `File exceeds maximum size of ${maxSize}`,
    typeNotAccepted: "File type not accepted",
    tooMany: (max) => `Maximum ${max} files allowed`,
    removeFile: (name) => `Remove ${name}`,
  },
  transferList: {
    source: "Available",
    target: "Selected",
    filterPlaceholder: "Filter...",
    empty: "No items",
    moveSelectedTo: (title) => `Move selected to ${title}`,
    moveAllTo: (title) => `Move all to ${title}`,
    moveUp: "Move up",
    moveDown: "Move down",
    filter: (title) => `Filter ${title}`,
  },
  datePicker: { today: "Today", yearRange: (start, end) => `${start} to ${end}` },
  dateRangePicker: { selectStart: "Select start date", selectEnd: "Select end date", start: "Start date", end: "End date" },
  timePicker: { hours: "Hours", minutes: "Minutes" },
  copyButton: { copy: "Copy", copied: "Copied", copiedTooltip: "Copied!" },
  avatar: { label: "Avatar" },
  spinner: { label: "Loading" },
  toggle: { on: "ON" },
  listbox: {
    results: (count) => (count === 0 ? "No results" : `${count} result${count === 1 ? "" : "s"} available`),
    searchFailed: "Couldn't load results",
  },
  confirmDialog: {
    title: "Are you sure?",
    confirm: "Confirm",
    cancel: "Cancel",
    typePrompt: (word) => `Please type "${word}" to confirm.`,
  },
  pagination: {
    summary: ({ from, to, total }) => `Showing ${from} to ${to} of ${total} results`,
    perPage: (count) => `${count} / page`,
    label: "Pagination",
    perPageLabel: "Results per page",
    previous: "Previous page",
    next: "Next page",
    page: (page) => `Page ${page}`,
  },
  breadcrumb: { label: "Breadcrumb" },
  stepper: { label: "Progress", complete: ", completed", error: ", error" },
  skeleton: { label: "Loading" },
  rating: { valueText: (value, max) => `${value} of ${max} stars` },
  resizablePanels: { handle: "Resize panels" },
  colorPicker: {
    saturation: "Saturation",
    brightness: "Brightness",
    hue: "Hue",
    alpha: "Opacity",
    swatches: "Preset colors",
    percent: (value) => `${value}%`,
    degrees: (value) => `${value} degrees`,
  },
  formField: { required: "(required)" },
  tabs: { closeTab: "Close tab" },
  table: { scrollRegionLabel: "Scrollable table" },
  scrollArea: { region: "Scrollable content" },
  dataGrid: {
    noResultsTitle: "No results found",
    noResultsDescription: "Try adjusting your search or filters.",
    filters: "Filters",
    all: "All",
    search: "Search…",
    filterColumn: (columnLabel) => `Filter ${columnLabel}…`,
    selected: (count) => `${count} item${count === 1 ? "" : "s"} selected`,
    columns: "Columns",
    views: "Views",
    savedViews: "Saved Views",
    noSavedViews: "No saved views",
    saveCurrent: "Save current",
    saveAs: "Save as...",
    save: "Save",
    viewName: "View name",
    deleteView: (name) => `Delete view ${name}`,
    resetViews: "Reset to defaults",
    rowHint: "Press Enter to open",
    selectAll: "Select all rows",
    selectRow: (rowLabel) => `Select ${rowLabel}`,
    rowActions: (rowLabel) => `Actions for ${rowLabel}`,
    rowNumber: (position) => `row ${position}`,
    tableView: "Table view",
    cardView: "Card view",
  },
};

/** Deep-partial of CuiMessages — function-valued entries are replaced wholesale. */
export type DeepPartialMessages = {
  [K in keyof CuiMessages]?: CuiMessages[K] extends (...args: never[]) => unknown
    ? CuiMessages[K]
    : CuiMessages[K] extends object
      ? { [P in keyof CuiMessages[K]]?: CuiMessages[K][P] }
      : CuiMessages[K];
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Overlay a partial onto a full message set (one level of nesting).
 *
 * Takes `CuiCoreMessages` so `defaultMessages` can be passed directly, and
 * returns `CuiMessages`. That widening is the one place the seam is asserted
 * rather than proven, and it is sound in the direction that matters: a satellite
 * package ships its own namespace defaults and merges them itself (see
 * `mergeMarkdownEditorMessages` in @itguy614/clean-ui-editor), so a namespace
 * missing from this package's catalog is supplied by the package that declared
 * it, not left undefined.
 */
export function mergeMessages(
  base: CuiCoreMessages,
  override?: DeepPartialMessages,
): CuiMessages {
  if (!override) return base as CuiMessages;
  const baseRecord = base as unknown as Record<string, unknown>;
  const out: Record<string, unknown> = { ...baseRecord };
  for (const key of Object.keys(override)) {
    const o = (override as Record<string, unknown>)[key];
    const b = baseRecord[key];
    if (o === undefined) continue;
    out[key] = isPlainObject(o) && isPlainObject(b) ? { ...b, ...o } : o;
  }
  return out as unknown as CuiMessages;
}

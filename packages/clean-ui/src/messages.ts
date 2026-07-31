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

export interface CuiMessages extends CuiMessageNamespaces {
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
    searching: string;
    /** Hint shown until `minChars` is reached. */
    typeMore: (remaining: number) => string;
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
  };
  breadcrumb: { label: string };
  stepper: { label: string };
  skeleton: { label: string };
  tabs: { closeTab: string };
  table: {
    /** Accessible name for the scroll region a table gets when it overflows. */
    scrollRegionLabel: string;
  };
  dataGrid: {
    noResultsTitle: string;
    noResultsDescription: string;
    filters: string;
    /** "All" option in a select filter. */
    all: string;
    search: string;
    /** Placeholder for a per-column filter input. */
    filterColumn: (columnLabel: string) => string;
    /** Selection count in the bulk-action bar. */
    selected: (count: number) => string;
  };
}

/** Built-in English defaults. */
export const defaultMessages: CuiMessages = {
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
    searching: "Searching…",
    typeMore: (remaining) =>
      `Type ${remaining} more character${remaining === 1 ? "" : "s"}…`,
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
  },
  breadcrumb: { label: "Breadcrumb" },
  stepper: { label: "Progress" },
  skeleton: { label: "Loading" },
  tabs: { closeTab: "Close tab" },
  table: { scrollRegionLabel: "Scrollable table" },
  dataGrid: {
    noResultsTitle: "No results found",
    noResultsDescription: "Try adjusting your search or filters.",
    filters: "Filters",
    all: "All",
    search: "Search…",
    filterColumn: (columnLabel) => `Filter ${columnLabel}…`,
    selected: (count) => `${count} item${count === 1 ? "" : "s"} selected`,
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

/** Overlay a partial onto a full message set (one level of nesting). */
export function mergeMessages(
  base: CuiMessages,
  override?: DeepPartialMessages,
): CuiMessages {
  if (!override) return base;
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

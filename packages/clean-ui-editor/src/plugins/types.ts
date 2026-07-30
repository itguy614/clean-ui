import type { Extension } from "@codemirror/state";

/**
 * Bumped only when the declarative plugin contract itself breaks — a plugin
 * built against an older version is rejected at registration (FR22a) rather
 * than failing later at a missing/renamed helper.
 */
export const PLUGIN_API_VERSION = 1;

export interface EditorSelectionRange {
  readonly from: number;
  readonly to: number;
  readonly empty: boolean;
}

export interface CollectSettle<T> {
  resolve(value: T): void;
  cancel(): void;
}

/**
 * A command supplies this to open whatever UI it needs (a `CuiModal`, a
 * plugin-owned Vue component, anything) and calls `resolve`/`cancel` on the
 * `settle` handle when the user is done. `collect()` (below) turns that into
 * an awaitable `Promise<T | null>` and is the seam FR18a asks for — the
 * dialog itself belongs to the plugin author (e.g. Phase 04's link dialog),
 * not this package.
 */
export type CollectOpener<T> = (settle: CollectSettle<T>) => void;

/**
 * What every command and `isActive` query operates through. `doc` and
 * `selection` are live getters over the current view state, not a snapshot
 * taken when the context was created — reading them after an awaited
 * `collect()` call always reflects whatever the user did while the dialog
 * was open, so a command built on this context can never act on a stale
 * position (FR18a's "positions still valid if the user typed during the
 * dialog").
 */
export interface CommandContext {
  readonly doc: string;
  readonly selection: EditorSelectionRange;
  /** Inserts at the cursor (or replaces a non-empty selection), placing the
   * cursor immediately after the inserted text. */
  insertAtCursor(text: string): void;
  /** Wraps the current selection (or, if empty, inserts both markers with
   * the cursor left between them — FR13). */
  wrapSelection(before: string, after: string): void;
  /** Replaces an explicit range, independent of the current selection. */
  replaceRange(from: number, to: number, text: string): void;
  /** Applies several non-overlapping edits (original-document coordinates)
   * as a single transaction — FR15's "one undo step however many edits it
   * makes internally," for a command that must touch more than one range
   * (e.g. toggling a marker on every line of a multi-line selection). */
  replaceRanges(edits: Array<{ from: number; to: number; text: string }>): void;
  /** Opens an async collection gate (FR18a). Resolves `null` on cancel. */
  collect<T>(open: CollectOpener<T>): Promise<T | null>;
}

/** Synchronous, returns whether it handled the invocation (FR18). Async work
 * goes through `context.collect()`, not through this being a `Promise`. */
export type PluginCommand = (context: CommandContext, ...args: unknown[]) => boolean;

export interface PluginCommandSpec {
  run: PluginCommand;
  /** Reports pressed state for a toolbar button and lets a toggle command
   * decide toggle-on vs. toggle-off (FR19). Absent means "never pressed." */
  isActive?: (context: CommandContext) => boolean;
  /** Toolbar/slash-menu label. Required for a command to appear in either
   * surface (FR20) — commands used only via keymap/imperative API omit it. */
  label?: string;
  /** Phosphor icon name (must be registered in this package's `icons/builtin.ts`
   * to render instead of the placeholder glyph — see FR/task 4.1.1). */
  icon?: string;
}

export interface ToolbarEntry {
  /** A command id from this same plugin or another registered plugin. */
  command: string;
}

export interface KeymapEntry {
  /** A CodeMirror keymap `key` string, e.g. `"Mod-b"`. */
  key: string;
  /** A command id from this same plugin. */
  command: string;
}

export interface PasteRule {
  /** CSS selector matched against a pasted HTML element. */
  selector: string;
  /** Emits markdown for the matched element, given its own already-converted
   * children's markdown. */
  toMarkdown: (element: HTMLElement, convertedChildren: string) => string;
  /** The construct id this rule produces — checked against the loaded
   * construct policy (FR28). */
  produces: string;
  /** Fallback used when `produces` isn't authorised: another construct id to
   * degrade to, or `"plainText"` to drop formatting entirely. */
  degradeTo: "plainText" | string;
}

export interface DecorationRule {
  /** A `@lezer/markdown` parser node name this rule's marker-hiding behaviour
   * applies to (e.g. `"Emphasis"`). */
  node: string;
}

export interface CuiEditorPluginSpec {
  readonly id: string;
  readonly commands: Record<string, PluginCommandSpec>;
  readonly toolbar?: ToolbarEntry[];
  readonly keymap?: KeymapEntry[];
  /** Construct ids this plugin authorises — the construct policy (FR27) is
   * the union of every loaded plugin's declared constructs. */
  readonly constructs?: string[];
  readonly paste?: PasteRule[];
  readonly decorations?: DecorationRule[];
  /** Raw CodeMirror escape hatch (FR17) — the one field in this record that
   * is intentionally CodeMirror-typed; every other field is plain data so a
   * plugin author never needs to resolve CodeMirror's types to use them. */
  readonly extensions?: Extension[];
}

export interface CuiEditorPlugin extends CuiEditorPluginSpec {
  readonly apiVersion: number;
}

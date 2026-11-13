import type { Extension } from "@codemirror/state";
import type { CleanUIContext } from "@itguy614/clean-ui";
import type { CuiMarkdownEditorMessages } from "../messages";

/**
 * Bumped only when the declarative plugin contract itself breaks — a plugin
 * built against an older version is rejected at registration (FR22a) rather
 * than failing later at a missing/renamed helper.
 *
 * 2: removed `CommandContext.findConstructRange` and renamed the spec field
 * `decorations` to `decorationNodes`, which ride on the one bump.
 */
export const PLUGIN_API_VERSION = 2;

/** A document line as `CommandContext.lineAt` reports it. */
export interface EditorLine {
  /** Offset of the line start. */
  readonly from: number;
  /** Offset of the line end, excluding the line break. */
  readonly to: number;
  /** The line's text, without its line break. */
  readonly text: string;
}

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
 *
 * It may return a function that closes that UI. If the editor unmounts while
 * the collection is still open, the editor calls it and `collect()` resolves
 * `null`, as on cancel (#409); a later `resolve`/`cancel` is ignored. Any
 * other return value (an async opener's promise) is ignored, which is why the
 * return type is `unknown` and not `void | (() => void)`: that would reject
 * every opener returning something else.
 */
export type CollectOpener<T> = (settle: CollectSettle<T>) => unknown;

/** What {@link CommandContext.lookupConstruct} found at the selection head. */
export type ConstructLookup =
  | { readonly status: "inside"; readonly range: { readonly from: number; readonly to: number } }
  | { readonly status: "outside" }
  | { readonly status: "unknown" };

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
  /**
   * The whole document as a string. Every read copies the entire document, so
   * it is the escape hatch, not the default: an `isActive` runs on every
   * keystroke and selection change, and reading this there costs O(document)
   * per call. Prefer {@link CommandContext.sliceDoc} and
   * {@link CommandContext.lineAt}, which read only what they ask for.
   */
  readonly doc: string;
  readonly selection: EditorSelectionRange;
  /** The text between two offsets, clamped to the document. Reads only that
   * range, so it is safe in an `isActive`. */
  sliceDoc(from: number, to: number): string;
  /** The line containing `pos` (`0` to the document length), without copying
   * the rest of the document. Throws a `RangeError` for a position outside it. */
  lineAt(pos: number): EditorLine;
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
  /**
   * Whether the selection head is inside a syntax node named `nodeName`
   * (a `@lezer/markdown` node name, e.g. `"StrongEmphasis"`), with the range
   * of the nearest such ancestor if so. `"unknown"` means the cursor's block
   * isn't parsed far enough to say (past the parse time cap): a command
   * should then change nothing and return `true`, as the built-ins do.
   */
  lookupConstruct(nodeName: string): ConstructLookup;
  /** This package's resolved message catalog (task 5.2.2), for a command
   * that needs the host's strings outside any component — e.g. to pass them
   * as plain props to a dialog. A dialog app given `cleanUI` below can also
   * read them itself, with `useMessages()`. */
  readonly messages: CuiMarkdownEditorMessages;
  /**
   * The host's clean-ui context (#326) — its `createCleanUI()` defaults, any
   * `CuiConfigProvider` above the editor, and clean-ui's message catalog. A
   * command that mounts its own Vue app for a dialog calls
   * `context.cleanUI.provideTo(app)` before mounting, so the clean-ui
   * components in it (a CuiModal's heading level, its close label) match the
   * host's rather than the library's defaults, and their teleported panels take
   * the theme scope around the editor (#418).
   */
  readonly cleanUI: CleanUIContext;
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

export interface CuiEditorPluginSpec {
  readonly id: string;
  readonly commands: Record<string, PluginCommandSpec>;
  readonly toolbar?: ToolbarEntry[];
  readonly keymap?: KeymapEntry[];
  /** Construct ids this plugin authorises — the construct policy (FR27) is
   * the union of every loaded plugin's declared constructs. */
  readonly constructs?: string[];
  readonly paste?: PasteRule[];
  /**
   * A node-name allowlist, nothing more: `@lezer/markdown` node names (e.g.
   * `"Emphasis"`) whose markers the built-in reveal layer hides and shows. It
   * adds no decoration of its own, and a plugin cannot supply one here: a
   * genuinely new decoration (a highlight, a widget) goes through the raw
   * `extensions` field.
   *
   * It overlaps `constructs` (the construct policy, which also gates paste
   * conversion): a node a plugin owns is normally listed in both.
   */
  readonly decorationNodes?: string[];
  /** Raw CodeMirror escape hatch (FR17) — the one field in this record that
   * is intentionally CodeMirror-typed; every other field is plain data so a
   * plugin author never needs to resolve CodeMirror's types to use them. */
  readonly extensions?: Extension[];
}

export interface CuiEditorPlugin extends CuiEditorPluginSpec {
  readonly apiVersion: number;
}

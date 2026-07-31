import { autocompletion, type Completion, type CompletionContext, type CompletionResult } from "@codemirror/autocomplete";
import type { Extension } from "@codemirror/state";
import type { CommandContext } from "./types";
import type { PluginRegistry } from "./registry";
import { invokeCommand, type PluginErrorHandler } from "./invoke-command";
import { defaultMarkdownEditorMessages, resolveCommandLabel, type CuiMarkdownEditorMessages } from "../messages";

/**
 * FR20: any command carrying both a `label` and an `icon` qualifies for the
 * slash palette, third-party plugins included, with no extra registration —
 * the exact same test the toolbar (task 4.1.2) uses. Pulled out as its own
 * function so this selection logic is unit-testable without going through
 * CodeMirror's completion pipeline (which needs real focus/layout jsdom
 * can't reliably provide for a contenteditable view).
 */
export function slashMenuCommandIds(registry: PluginRegistry): Array<{ id: string; label: string }> {
  return [...registry.commands.entries()]
    .filter(([, entry]) => entry.spec.label && entry.spec.icon)
    .map(([id, entry]) => ({ id, label: entry.spec.label! }));
}

/**
 * Built on CodeMirror's own autocomplete so filtering, arrow navigation,
 * Enter-to-run and Escape-to-dismiss (leaving the typed text untouched) all
 * come from the library rather than being reimplemented.
 *
 * `getMessages`, if supplied, is called fresh on every query (not once at
 * extension-build time) so a locale switch after mount is picked up with no
 * extra reconfigure wiring — this completion source is already a plain
 * function CodeMirror re-invokes live per keystroke (task 5.2.2).
 */
export function slashMenuExtension(
  registry: PluginRegistry,
  context: CommandContext,
  onError: PluginErrorHandler,
  getMessages: () => CuiMarkdownEditorMessages = () => defaultMarkdownEditorMessages,
): Extension {
  const commandIds = slashMenuCommandIds(registry);

  function source(completionContext: CompletionContext): CompletionResult | null {
    const match = completionContext.matchBefore(/\/\w*/);
    if (!match) return null;
    // Require an explicit "/" trigger — an empty match (bare cursor with no
    // "/" typed) shouldn't pop the menu just because completion is active.
    if (match.from === match.to && !completionContext.explicit) return null;

    const messages = getMessages();
    const options: Completion[] = commandIds.map(({ id, label }, index) => ({
      label: resolveCommandLabel(messages, id, label),
      // `@codemirror/autocomplete`'s default `compareCompletions` sorts
      // strictly by `sortText` (falling back to `label` when absent) —
      // alphabetical-by-label order buries "Bold" behind "Blockquote" and
      // interleaves inline formatting with block-level commands, rather
      // than the toolbar's own deliberate grouping (inline marks, then
      // headings, then lists, then blocks) that `commandIds` already
      // preserves via the registry's insertion order. A zero-padded index
      // as `sortText` keeps that grouping in the palette regardless of
      // what's typed — filtering still narrows by fuzzy-matching `label`,
      // only the *display order* of what's left is pinned.
      sortText: String(index).padStart(3, "0"),
      type: "keyword",
      apply(view, _completion, _from, to) {
        // The result's own `from` (below) is deliberately *after* the "/" —
        // CodeMirror fuzzy-matches each option's label against the text
        // from `from` to the cursor, and "/" never appears in a label, so
        // including it there would fail every match and silently empty the
        // list. Deleting the typed "/filter" text on apply is a separate
        // concern and correctly spans the whole thing, from the "/" itself
        // (`match.from`) through the cursor (`to`).
        view.dispatch({ changes: { from: match.from, to, insert: "" } });
        invokeCommand(registry, id, context, onError);
      },
    }));

    if (options.length === 0) return null;
    return { from: match.from + 1, options, validFor: /^\w*$/ };
  }

  return autocompletion({ override: [source] });
}

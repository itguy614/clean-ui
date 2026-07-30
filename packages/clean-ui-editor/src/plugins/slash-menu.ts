import { autocompletion, type Completion, type CompletionContext, type CompletionResult } from "@codemirror/autocomplete";
import type { Extension } from "@codemirror/state";
import type { CommandContext } from "./types";
import type { PluginRegistry } from "./registry";
import { invokeCommand, type PluginErrorHandler } from "./invoke-command";

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
 */
export function slashMenuExtension(registry: PluginRegistry, context: CommandContext, onError: PluginErrorHandler): Extension {
  const commandIds = slashMenuCommandIds(registry);

  function source(completionContext: CompletionContext): CompletionResult | null {
    const match = completionContext.matchBefore(/\/\w*/);
    if (!match) return null;
    // Require an explicit "/" trigger — an empty match (bare cursor with no
    // "/" typed) shouldn't pop the menu just because completion is active.
    if (match.from === match.to && !completionContext.explicit) return null;

    const options: Completion[] = commandIds.map(({ id, label }) => ({
      label,
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

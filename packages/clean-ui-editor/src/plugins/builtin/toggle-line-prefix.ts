import type { CommandContext, PluginCommandSpec } from "../types";
import { linesInRange } from "./line-utils";

/** The prefix added to a line that lacks it. A function receives the line's
 * index within the selection, for a prefix that counts (`"1. "`, `"2. "`, …). */
type LinePrefix = string | ((index: number) => string);

/**
 * What counts as "already prefixed": a literal prefix (`"> "`), which is also
 * what gets inserted unless `insert` says otherwise, or a pattern anchored at
 * the line start (`/^\d+\.\s/`) when the existing marker can vary, which needs
 * an explicit `insert`. The matched text is what gets stripped.
 */
export type ToggleLinePrefixOptions = { match: string; insert?: LinePrefix } | { match: RegExp; insert: LinePrefix };

/**
 * The line-level sibling of `toggleInlineCommand`: toggles a prefix on every
 * line the selection touches. If every line already has it, it is stripped
 * from all of them; otherwise it is added to the lines that lack it, so a
 * mixed selection converges on "all prefixed" rather than flipping each line.
 * One `replaceRanges` call, so the whole toggle is a single undo step.
 */
export function toggleLinePrefixCommand(options: ToggleLinePrefixOptions): PluginCommandSpec {
  const { match } = options;
  const insert = options.insert ?? (match as string);
  const matchedPrefix = (text: string): string | null => {
    if (typeof match === "string") return text.startsWith(match) ? match : null;
    return text.match(match)?.[0] ?? null;
  };
  const prefixFor = typeof insert === "string" ? () => insert : insert;
  const selectedLines = (context: CommandContext) => linesInRange(context.doc, context.selection.from, context.selection.to);

  return {
    run(context) {
      const lines = selectedLines(context).map((line) => ({ start: line.start, prefix: matchedPrefix(line.text) }));
      const allPrefixed = lines.every((line) => line.prefix !== null);

      context.replaceRanges(
        lines.flatMap(({ start, prefix }, index) => {
          if (prefix === null) return allPrefixed ? [] : [{ from: start, to: start, text: prefixFor(index) }];
          return allPrefixed ? [{ from: start, to: start + prefix.length, text: "" }] : [];
        }),
      );
      return true;
    },
    isActive: (context) => selectedLines(context).every((line) => matchedPrefix(line.text) !== null),
  };
}

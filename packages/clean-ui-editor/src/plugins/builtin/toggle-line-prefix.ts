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

function literalPrefix(prefix: string) {
  return (text: string): string | null => (text.startsWith(prefix) ? prefix : null);
}

function patternPrefix(match: RegExp) {
  // A flag-free copy: `g` makes `String.match()` drop the index, and `y`
  // carries `lastIndex` over from one line to the next.
  const pattern = new RegExp(match.source, match.flags.replace(/[gy]/g, ""));
  return (text: string): string | null => {
    // Only a match at the line start is a prefix, whether or not the pattern
    // says `^`: stripping removes the first `length` characters of the line.
    const found = pattern.exec(text);
    return found?.index === 0 ? found[0] : null;
  };
}

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
  const matchedPrefix = typeof match === "string" ? literalPrefix(match) : patternPrefix(match);
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

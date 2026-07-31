import type { CommandContext, PluginCommandSpec } from "../types";

export interface ToggleInlineOptions {
  /** The `@lezer/markdown` node name this construct parses as (e.g.
   * `"StrongEmphasis"`) — used to detect "already applied" via the syntax
   * tree, which handles nesting/adjacency correctly in a way a regex over
   * raw text can't. */
  nodeName: string;
  /** The symmetric marker text, e.g. `"**"`, `"*"`, `` "`" ``, `"~~"`. */
  marker: string;
}

/**
 * FR12: toggles a symmetric inline marker on/off. Applying it to an
 * already-formatted selection removes the formatting rather than
 * double-wrapping; applying it fresh wraps the selection (or, empty, drops
 * the cursor between the two markers — FR13, via `wrapSelection`).
 */
export function toggleInlineCommand({ nodeName, marker }: ToggleInlineOptions): PluginCommandSpec {
  function run(context: CommandContext): boolean {
    const range = context.findConstructRange(nodeName);
    if (range) {
      const inner = context.doc.slice(range.from + marker.length, range.to - marker.length);
      context.replaceRange(range.from, range.to, inner);
    } else {
      context.wrapSelection(marker, marker);
    }
    return true;
  }

  return {
    run,
    isActive: (context) => context.findConstructRange(nodeName) !== null,
  };
}

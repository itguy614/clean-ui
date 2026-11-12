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
    const found = context.lookupConstruct(nodeName);
    // Not parsed far enough to tell: wrapping could nest the markers. Do
    // nothing, but report it handled so the shortcut doesn't reach the browser.
    if (found.status === "unknown") return true;
    if (found.status === "inside") {
      const { from, to } = found.range;
      context.replaceRange(from, to, context.doc.slice(from + marker.length, to - marker.length));
    } else {
      context.wrapSelection(marker, marker);
    }
    return true;
  }

  return {
    run,
    isActive: (context) => context.lookupConstruct(nodeName).status === "inside",
  };
}

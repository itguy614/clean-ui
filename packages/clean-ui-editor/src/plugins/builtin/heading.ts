import { definePlugin } from "../define-plugin";
import { lineBoundsAt } from "./line-utils";
import type { CommandContext, PluginCommandSpec } from "../types";

const HEADING_PATTERN = /^#{1,6} /;

function currentLine(context: CommandContext) {
  const { start, end } = lineBoundsAt(context.doc, context.selection.from);
  return { start, end, text: context.doc.slice(start, end) };
}

/**
 * Line-prefix detection (a plain regex over the current line), not the
 * syntax tree — simpler and just as correct for "does this line start with
 * `#{1,6} `," and it naturally lets applying H2 to an H1 line convert it
 * (replace the prefix) rather than double-prefixing.
 */
function headingCommand(level: 1 | 2 | 3): PluginCommandSpec {
  const prefix = `${"#".repeat(level)} `;

  return {
    run(context) {
      const { start, text } = currentLine(context);
      const match = text.match(HEADING_PATTERN);
      if (match && match[0] === prefix) {
        context.replaceRange(start, start + prefix.length, "");
      } else if (match) {
        context.replaceRange(start, start + match[0].length, prefix);
      } else {
        context.replaceRange(start, start, prefix);
      }
      return true;
    },
    isActive: (context) => currentLine(context).text.startsWith(prefix),
  };
}

export const heading1Plugin = definePlugin({
  id: "cui-heading-1",
  commands: { heading1: { ...headingCommand(1), label: "Heading 1", icon: "heading-1" } },
  toolbar: [{ command: "heading1" }],
  keymap: [{ key: "Mod-Alt-1", command: "heading1" }],
  constructs: ["ATXHeading1"],
  decorations: [{ node: "ATXHeading1" }],
  paste: [{ selector: "h1", produces: "ATXHeading1", degradeTo: "plainText", toMarkdown: (_el, c) => `# ${c}` }],
});

export const heading2Plugin = definePlugin({
  id: "cui-heading-2",
  commands: { heading2: { ...headingCommand(2), label: "Heading 2", icon: "heading-2" } },
  toolbar: [{ command: "heading2" }],
  keymap: [{ key: "Mod-Alt-2", command: "heading2" }],
  constructs: ["ATXHeading2"],
  decorations: [{ node: "ATXHeading2" }],
  paste: [{ selector: "h2", produces: "ATXHeading2", degradeTo: "plainText", toMarkdown: (_el, c) => `## ${c}` }],
});

export const heading3Plugin = definePlugin({
  id: "cui-heading-3",
  commands: { heading3: { ...headingCommand(3), label: "Heading 3", icon: "heading-3" } },
  toolbar: [{ command: "heading3" }],
  keymap: [{ key: "Mod-Alt-3", command: "heading3" }],
  constructs: ["ATXHeading3"],
  decorations: [{ node: "ATXHeading3" }],
  paste: [{ selector: "h3", produces: "ATXHeading3", degradeTo: "plainText", toMarkdown: (_el, c) => `### ${c}` }],
});

import { definePlugin } from "../define-plugin";

export const codeFencePlugin = definePlugin({
  id: "cui-code-fence",
  commands: {
    codeFence: {
      run(context) {
        const range = context.findConstructRange("FencedCode");
        if (range) {
          const block = context.doc.slice(range.from, range.to);
          const firstNewline = block.indexOf("\n");
          const lastNewline = block.lastIndexOf("\n");
          const inner = firstNewline === -1 || lastNewline <= firstNewline ? "" : block.slice(firstNewline + 1, lastNewline);
          context.replaceRange(range.from, range.to, inner);
        } else {
          // wrapSelection already places the cursor between the two
          // markers for an empty selection (FR13) and re-selects the
          // wrapped text for a non-empty one.
          context.wrapSelection("```\n", "\n```");
        }
        return true;
      },
      isActive: (context) => context.findConstructRange("FencedCode") !== null,
      label: "Code block",
      icon: "code-block",
    },
  },
  toolbar: [{ command: "codeFence" }],
  constructs: ["FencedCode"],
  decorations: [{ node: "FencedCode" }],
  paste: [
    {
      selector: "pre",
      produces: "FencedCode",
      degradeTo: "plainText",
      // Raw textContent (verbatim, unescaped) — a code block's content must
      // never be markdown-escaped, and <pre> may have nested <code>/<span>
      // syntax-highlighting wrappers this rule doesn't need to unwrap by hand.
      toMarkdown: (el) => `\`\`\`\n${el.textContent ?? ""}\n\`\`\``,
    },
  ],
});

import { definePlugin } from "../define-plugin";

export const codeFencePlugin = definePlugin({
  id: "cui-code-fence",
  commands: {
    codeFence: {
      run(context) {
        const found = context.lookupConstruct("FencedCode");
        // Not parsed far enough to tell: a fence inserted inside an open
        // block would close it early and flip everything below it. Do
        // nothing, but report it handled so no other binding runs instead.
        if (found.status === "unknown") return true;
        if (found.status === "inside") {
          const { from, to } = found.range;
          const block = context.sliceDoc(from, to);
          const firstNewline = block.indexOf("\n");
          const lastNewline = block.lastIndexOf("\n");
          const inner = firstNewline === -1 || lastNewline <= firstNewline ? "" : block.slice(firstNewline + 1, lastNewline);
          context.replaceRange(from, to, inner);
        } else {
          // wrapSelection already places the cursor between the two
          // markers for an empty selection (FR13) and re-selects the
          // wrapped text for a non-empty one.
          context.wrapSelection("```\n", "\n```");
        }
        return true;
      },
      isActive: (context) => context.lookupConstruct("FencedCode").status === "inside",
      label: "Code block",
      icon: "code-block",
    },
  },
  toolbar: [{ command: "codeFence" }],
  constructs: ["FencedCode"],
  decorationNodes: ["FencedCode"],
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

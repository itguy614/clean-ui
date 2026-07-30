import type { SyntaxNode } from "@lezer/common";
import { gfmParser } from "../language/markdown-language";
import { escapeHtml } from "./html-escape";
import { isAllowedUrl } from "../url-policy";

export interface SerializeOptions {
  /** FR39: raw HTML in the source is escaped by default. Set true only
   * alongside `sanitize` — enforced by `supplied-adapter.ts`, not here. */
  allowRawHtml?: boolean;
  /** Required whenever `allowRawHtml` is true. Applied to the raw text of
   * every `HTMLBlock`/`HTMLTag` node individually, never to the document as
   * a whole — this library supplies no sanitiser itself. */
  sanitize?: (html: string) => string;
}

/** Every node name this function renders as literal escaped text or omits
 * entirely rather than recursing into for HTML output, keyed by name for a
 * cheap lookup — these are pure syntax markers (brackets, fence backticks,
 * list bullets, table pipes) or values a parent node already consumed
 * (`URL`/`LinkTitle`/`CodeInfo` read via `getChild`, not walked generically). */
const SKIPPED_MARKER_NODES = new Set([
  "HeaderMark",
  "QuoteMark",
  "ListMark",
  "EmphasisMark",
  "StrikethroughMark",
  "CodeMark",
  "LinkMark",
  "TableDelimiter",
  "TaskMarker",
  "LinkTitle",
  "CodeInfo",
]);

function textOf(node: SyntaxNode, markdown: string): string {
  return markdown.slice(node.from, node.to);
}

/** A prefix marker (`#`, `>`, `-`/`1.`, `[ ]`) is always followed — and, for
 * a closing ATX `##`, preceded — by a required separator space that's part
 * of the syntax, not the content. Trimmed on whichever gap sits against one
 * of these, never on gaps elsewhere (an inline gap like the space between
 * "**bold**" and "*italic*" is real content and must survive). */
const TRIM_ADJACENT_MARKERS = new Set(["HeaderMark", "QuoteMark", "ListMark", "TaskMarker"]);

/** An indented code block's required 4-space (or tab) indent isn't part of
 * any node — `CodeBlock.from` starts right after it — so it would otherwise
 * leak into the *parent's* gap as literal text immediately before the
 * `<pre>`. Only the leading run right before the node needs trimming (its
 * internal per-line indents are stripped by the parser already, visible in
 * each `CodeText` child's own range). */
const TRIM_INDENT_BEFORE = new Set(["CodeBlock"]);

/** Renders `node`'s children, filling the gaps between them (and before the
 * first / after the last) with escaped literal text — most inline prose is
 * never wrapped in its own node, just the spans either side of it. */
function renderChildren(node: SyntaxNode, markdown: string, ctx: SerializeOptions): string {
  let out = "";
  let pos = node.from;
  let trimLeading = false;
  let child = node.firstChild;
  while (child) {
    if (child.from > pos) {
      let gap = markdown.slice(pos, child.from);
      if (trimLeading) gap = gap.replace(/^[ \t]+/, "");
      // Setext's underline HeaderMark sits on its own line, so the gap
      // before it (the heading text) carries a trailing newline too.
      if (TRIM_ADJACENT_MARKERS.has(child.type.name)) gap = gap.replace(/[ \t\n]+$/, "");
      if (TRIM_INDENT_BEFORE.has(child.type.name)) gap = gap.replace(/[ \t]+$/, "");
      out += escapeHtml(gap);
    }
    trimLeading = TRIM_ADJACENT_MARKERS.has(child.type.name);
    out += renderNode(child, markdown, ctx);
    pos = child.to;
    child = child.nextSibling;
  }
  if (node.to > pos) {
    let gap = markdown.slice(pos, node.to);
    if (trimLeading) gap = gap.replace(/^[ \t]+/, "");
    out += escapeHtml(gap);
  }
  return out;
}

function renderRawHtml(node: SyntaxNode, markdown: string, ctx: SerializeOptions): string {
  const raw = textOf(node, markdown);
  return ctx.allowRawHtml && ctx.sanitize ? ctx.sanitize(raw) : escapeHtml(raw);
}

function renderLinkOrImage(node: SyntaxNode, markdown: string, ctx: SerializeOptions): string {
  const urlNode = node.getChild("URL");
  const url = urlNode ? textOf(urlNode, markdown) : "";
  const allowed = isAllowedUrl(url);
  if (node.type.name === "Image") {
    const alt = renderChildren(node, markdown, ctx).replace(/<[^>]*>/g, "");
    return allowed ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}">` : escapeHtml(alt);
  }
  const label = renderChildren(node, markdown, ctx);
  return allowed ? `<a href="${escapeHtml(url)}">${label}</a>` : label;
}

function renderBareUrl(node: SyntaxNode, markdown: string): string {
  const url = textOf(node, markdown);
  return isAllowedUrl(url) ? `<a href="${escapeHtml(url)}">${escapeHtml(url)}</a>` : escapeHtml(url);
}

function orderedListStart(node: SyntaxNode, markdown: string): number | null {
  const marker = node.firstChild?.getChild("ListMark");
  if (!marker) return null;
  const match = /^(\d+)/.exec(textOf(marker, markdown));
  const start = match ? Number(match[1]) : 1;
  return start === 1 ? null : start;
}

function renderTableRow(node: SyntaxNode, markdown: string, ctx: SerializeOptions, cellTag: "th" | "td"): string {
  let cells = "";
  for (let cell = node.firstChild; cell; cell = cell.nextSibling) {
    if (cell.type.name !== "TableCell") continue;
    cells += `<${cellTag}>${renderChildren(cell, markdown, ctx)}</${cellTag}>`;
  }
  return `<tr>${cells}</tr>\n`;
}

function renderNode(node: SyntaxNode, markdown: string, ctx: SerializeOptions): string {
  const name = node.type.name;
  if (SKIPPED_MARKER_NODES.has(name)) return "";

  switch (name) {
    case "Document":
      return renderChildren(node, markdown, ctx);
    case "Paragraph":
      return `<p>${renderChildren(node, markdown, ctx)}</p>\n`;
    case "ATXHeading1":
    case "ATXHeading2":
    case "ATXHeading3":
    case "ATXHeading4":
    case "ATXHeading5":
    case "ATXHeading6": {
      const level = name.slice(-1);
      return `<h${level}>${renderChildren(node, markdown, ctx)}</h${level}>\n`;
    }
    case "SetextHeading1":
      return `<h1>${renderChildren(node, markdown, ctx)}</h1>\n`;
    case "SetextHeading2":
      return `<h2>${renderChildren(node, markdown, ctx)}</h2>\n`;
    case "Blockquote":
      return `<blockquote>\n${renderChildren(node, markdown, ctx)}</blockquote>\n`;
    case "BulletList":
      return `<ul>\n${renderChildren(node, markdown, ctx)}</ul>\n`;
    case "OrderedList": {
      const start = orderedListStart(node, markdown);
      return `<ol${start ? ` start="${start}"` : ""}>\n${renderChildren(node, markdown, ctx)}</ol>\n`;
    }
    case "ListItem":
      return `<li>${renderChildren(node, markdown, ctx)}</li>\n`;
    case "Task": {
      // A ListItem always wraps a Task (see `gfmParser`'s tree shape for a
      // task-list item) and already provides the `<li>` — this only
      // supplies the checkbox and its content, not another list item.
      const checked = /\[[xX]\]/.test(textOf(node.getChild("TaskMarker")!, markdown));
      return `<input type="checkbox" disabled${checked ? " checked" : ""}> ${renderChildren(node, markdown, ctx)}`;
    }
    case "HorizontalRule":
      return "<hr>\n";
    case "FencedCode": {
      const info = node.getChild("CodeInfo");
      const lang = info ? escapeHtml(textOf(info, markdown).trim()) : "";
      const body = node.getChildren("CodeText").map((n) => textOf(n, markdown)).join("");
      return `<pre><code${lang ? ` class="language-${lang}"` : ""}>${escapeHtml(body)}</code></pre>\n`;
    }
    case "CodeBlock": {
      const body = node.getChildren("CodeText").map((n) => textOf(n, markdown)).join("");
      return `<pre><code>${escapeHtml(body)}</code></pre>\n`;
    }
    case "HTMLBlock":
      return `${renderRawHtml(node, markdown, ctx)}\n`;
    case "Table": {
      let head = "";
      let body = "";
      for (let child = node.firstChild; child; child = child.nextSibling) {
        if (child.type.name === "TableHeader") head = renderTableRow(child, markdown, ctx, "th");
        else if (child.type.name === "TableRow") body += renderTableRow(child, markdown, ctx, "td");
      }
      return `<table>\n<thead>\n${head}</thead>\n<tbody>\n${body}</tbody>\n</table>\n`;
    }
    case "Emphasis":
      return `<em>${renderChildren(node, markdown, ctx)}</em>`;
    case "StrongEmphasis":
      return `<strong>${renderChildren(node, markdown, ctx)}</strong>`;
    case "Strikethrough":
      return `<del>${renderChildren(node, markdown, ctx)}</del>`;
    case "InlineCode":
      return `<code>${renderChildren(node, markdown, ctx)}</code>`;
    case "Link":
    case "Image":
      return renderLinkOrImage(node, markdown, ctx);
    case "Autolink":
      return renderBareUrl(node.getChild("URL") ?? node, markdown);
    case "URL": {
      // A Link/Image/Autolink's own URL child is consumed by that parent's
      // handler via getChild — the generic child walk still visits it
      // (renderChildren has no way to skip just one specific child), so it
      // must recognise and skip that case here rather than double-render.
      const parentName = node.parent?.type.name;
      if (parentName === "Link" || parentName === "Image" || parentName === "Autolink") return "";
      return renderBareUrl(node, markdown); // bare GFM-detected autolink
    }
    case "HardBreak":
      return "<br>\n";
    case "Escape":
      // Drop the backslash itself; the escaped character renders literally.
      return escapeHtml(textOf(node, markdown).slice(1));
    case "Entity":
      // Already valid HTML character-reference syntax — re-escaping would
      // double-encode it (e.g. "&amp;" becoming "&amp;amp;").
      return textOf(node, markdown);
    case "HTMLTag":
      return renderRawHtml(node, markdown, ctx);
    default:
      // An unrecognised node (future grammar additions, or an extension
      // this file hasn't been taught about) degrades to its own escaped
      // text rather than either crashing or silently vanishing.
      return renderChildren(node, markdown, ctx);
  }
}

/**
 * Parses `markdown` with the same GFM-configured `@lezer/markdown` parser
 * `CuiMarkdownEditor` edits against (see `gfmParser`'s own doc comment) and
 * serializes it to an HTML string. Raw HTML (`HTMLBlock`/`HTMLTag`) is
 * escaped unless `allowRawHtml` and `sanitize` are both supplied — enforcing
 * that pairing is `supplied-adapter.ts`'s job, not this function's, since a
 * future core feature (Phase 1.5's split preview, FR37) may want this
 * serializer without the adapter-level refusal wrapping it.
 */
export function serializeMarkdownToHtml(markdown: string, options: SerializeOptions = {}): string {
  const tree = gfmParser.parse(markdown);
  return renderNode(tree.topNode, markdown, options);
}

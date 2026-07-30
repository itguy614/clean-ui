import type { PasteRule } from "../plugins/types";

// Elements whose content must never reach the stored markdown, not even as
// plain text — this is the "hostile page" case: a <script> tag's source is
// program code, not content, and dumping it as literal text would be worse
// than dropping it. `Decoration`-adjacent HTML rendering isn't involved here
// at all (NFR3-style constraint) — the converter never emits raw HTML tags,
// only markdown syntax or escaped plain text.
const SKIP_TAGS = new Set(["script", "style", "noscript", "template", "iframe", "object", "embed"]);

// Only characters that are markdown-significant *inline, anywhere in a
// line* — "#", "-", ">", "+", "." are only special at the start of a line
// (headings/lists/blockquotes) and escaping them throughout ordinary prose
// would make routine pasted text (dates, negative numbers, "well-known")
// needlessly noisy without preventing anything real.
const MARKDOWN_SPECIAL_CHARS = /([\\`*_[\]()~])/g;

function escapeMarkdown(text: string): string {
  return text.replace(MARKDOWN_SPECIAL_CHARS, "\\$1");
}

/**
 * Resolves a matched rule against the active construct set, following
 * `degradeTo` chains (a construct can degrade to another construct's own
 * rule, which may itself need to degrade further) until one produces an
 * active construct, or `null` if the chain bottoms out at `"plainText"` —
 * FR28: "degrading to the nearest available representation or plain text."
 * `visited` guards against a misconfigured degrade cycle looping forever.
 */
function resolveRule(
  rules: readonly PasteRule[],
  rule: PasteRule,
  activeConstructs: ReadonlySet<string>,
  visited: Set<string> = new Set(),
): PasteRule | null {
  if (activeConstructs.has(rule.produces)) return rule;
  if (rule.degradeTo === "plainText" || visited.has(rule.degradeTo)) return null;
  visited.add(rule.degradeTo);
  const next = rules.find((candidate) => candidate.produces === rule.degradeTo);
  return next ? resolveRule(rules, next, activeConstructs, visited) : null;
}

function convertNode(node: ChildNode, rules: readonly PasteRule[], activeConstructs: ReadonlySet<string>): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeMarkdown(node.textContent ?? "");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const element = node as HTMLElement;
  const tag = element.tagName.toLowerCase();
  if (SKIP_TAGS.has(tag)) return "";

  const childrenMarkdown = [...element.childNodes].map((child) => convertNode(child, rules, activeConstructs)).join("");

  const matchedRule = rules.find((rule) => element.matches(rule.selector));
  if (!matchedRule) return childrenMarkdown; // no plugin claims this tag — descend, keep its children's own conversions

  const resolved = resolveRule(rules, matchedRule, activeConstructs);
  if (!resolved) {
    // Degraded to plain text: children already carry their own (possibly
    // still-active) conversions; an atomic element with none of its own
    // (e.g. <img>) falls back to its alt text as the best available prose.
    return childrenMarkdown || escapeMarkdown(element.getAttribute("alt") ?? "");
  }
  return resolved.toMarkdown(element, childrenMarkdown);
}

/**
 * FR28: converts pasted HTML to markdown through the active plugins' own
 * `paste` rules, honouring the loaded construct set. Never emits raw HTML —
 * an element with no matching rule contributes only its converted children
 * (recursing further), never its own tag; `SKIP_TAGS` elements contribute
 * nothing at all. This is also what keeps a hostile page's markup from
 * being laundered into stored content: there is no code path that copies an
 * element's outerHTML/innerHTML into the result.
 */
export function convertHtmlToMarkdown(html: string, paste: readonly PasteRule[], constructs: ReadonlySet<string>): string {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  return [...parsed.body.childNodes]
    .map((node) => convertNode(node, paste, constructs))
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

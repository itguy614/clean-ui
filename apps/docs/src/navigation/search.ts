import type { DocPage } from "./pages";

/**
 * Docs search (#516): pure and DOM-free, so the matching is unit-testable and a command palette
 * can reuse it.
 *
 * Case, whitespace, hyphens and underscores do not count: "date picker", "datepicker" and
 * "date-picker" are one query, and all find Date Picker.
 */

/** Why a page matched. Lower is better; results sort by it. */
export const RANK = {
  labelPrefix: 0,
  labelSubstring: 1,
  keywordPrefix: 2,
  keywordSubstring: 3,
  group: 4,
} as const;

export interface SearchResult {
  page: DocPage;
  rank: number;
  /** Matched stretches of `page.label` as `[start, end)` character offsets. Empty unless the label matched. */
  ranges: Array<[number, number]>;
  /** The keyword that matched, when the label did not: it says why the page is listed. */
  keyword?: string;
}

export interface SearchGroup {
  label: string;
  results: SearchResult[];
}

const IGNORED = /[\s\-_]/;

interface Normalized {
  text: string;
  /** For each character of `text`, its offset in the original string. */
  offsets: number[];
}

function normalize(source: string): Normalized {
  let text = "";
  const offsets: number[] = [];
  for (let i = 0; i < source.length; i++) {
    const ch = source[i]!;
    if (IGNORED.test(ch)) continue;
    // Per character: lower-casing a whole string can change its length (a dotted capital I).
    for (const lower of ch.toLowerCase()) {
      text += lower;
      offsets.push(i);
    }
  }
  return { text, offsets };
}

/** The label ranges covered by `[from, from + length)` of the normalized label. */
function toRanges(label: Normalized, from: number, length: number): Array<[number, number]> {
  const start = label.offsets[from]!;
  const end = label.offsets[from + length - 1]! + 1;
  return [[start, end]];
}

/** Every page that matches, best first, then in page order. An empty query matches every page. */
export function searchPages(pages: readonly DocPage[], query: string): SearchResult[] {
  const q = normalize(query).text;
  if (!q) return pages.map((page) => ({ page, rank: RANK.labelPrefix, ranges: [] }));

  const results: Array<SearchResult & { order: number }> = [];
  pages.forEach((page, order) => {
    const label = normalize(page.label);
    const at = label.text.indexOf(q);
    if (at !== -1) {
      const rank = label.text.startsWith(q) ? RANK.labelPrefix : RANK.labelSubstring;
      results.push({ page, rank, ranges: toRanges(label, at, q.length), order });
      return;
    }

    let rank: number = RANK.group;
    let keyword: string | undefined;
    for (const candidate of page.keywords) {
      const text = normalize(candidate).text;
      if (!text.includes(q)) continue;
      const candidateRank = text.startsWith(q) ? RANK.keywordPrefix : RANK.keywordSubstring;
      if (candidateRank < rank) {
        rank = candidateRank;
        keyword = candidate;
      }
    }
    if (!keyword && !normalize(page.group).text.includes(q)) return;
    results.push({ page, rank, ranges: [], keyword, order });
  });

  results.sort((a, b) => a.rank - b.rank || a.order - b.order);
  return results.map(({ order: _order, ...result }) => result);
}

/**
 * The results as the sidebar shows them: one group per section, its pages best match first.
 * Groups run by their best page, then in the order they first appear, so the first link on
 * screen is always the best match: the one Enter opens.
 */
export function groupResults(results: readonly SearchResult[]): SearchGroup[] {
  const groups = new Map<string, SearchResult[]>();
  for (const result of results) {
    const list = groups.get(result.page.group);
    if (list) list.push(result);
    else groups.set(result.page.group, [result]);
  }
  // `results` is already sorted, so each group's first entry is its best and Map keeps the
  // order groups first appeared in: sorting by best rank alone, stably, is enough.
  return [...groups]
    .map(([label, list]) => ({ label, results: list }))
    .sort((a, b) => a.results[0]!.rank - b.results[0]!.rank);
}

export interface LabelSegment {
  text: string;
  match: boolean;
}

/** `label` cut into runs, marking the ones a result's `ranges` cover. */
export function highlightSegments(label: string, ranges: ReadonlyArray<readonly [number, number]>): LabelSegment[] {
  const segments: LabelSegment[] = [];
  let at = 0;
  for (const [start, end] of ranges) {
    if (start > at) segments.push({ text: label.slice(at, start), match: false });
    segments.push({ text: label.slice(start, end), match: true });
    at = end;
  }
  if (at < label.length) segments.push({ text: label.slice(at), match: false });
  return segments;
}

/** Whether a keypress should send `/` to the search box: not while typing, not with a modifier. */
export function isSearchShortcut(event: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "altKey" | "target" | "defaultPrevented">): boolean {
  if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented) return false;
  const target = event.target as Element | null;
  if (!target || typeof target.closest !== "function") return true;
  return !target.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])");
}

/** The announcement for a result count. */
export function resultsMessage(count: number): string {
  return count === 0 ? "No matches" : count === 1 ? "1 page found" : `${count} pages found`;
}

/**
 * A small fuzzy matcher for CuiCommandPalette (#197). Internal: not exported from the
 * package, and no dependency.
 *
 * `fuzzyMatch("opset", "Open Settings")` finds the characters in order, case-insensitively,
 * and scores the best way to lay them down: a match at the start of the text or of a word
 * beats one in the middle, and characters that sit together beat ones that are spread out. A
 * query of several words (`"new file"`) needs every word to match on its own, in any order.
 * It returns the matched ranges as well, so the caller can highlight them.
 *
 * It compares code units one by one (`toLowerCase()` of each), so every range is a valid
 * index into the original text. It does not fold accents: "cafe" does not find "Café".
 */

export interface FuzzyMatch {
  /** Higher is better. Comparable between texts for one query, and nothing else. */
  score: number;
  /** Matched stretches as `[start, end)` indices into the text, sorted and non-overlapping. */
  ranges: Array<[number, number]>;
}

const START_BONUS = 8;
const WORD_BONUS = 6;
const RUN_BONUS = 5;
const GAP_PENALTY = 0.5;
const LENGTH_PENALTY = 0.01;

const isWordChar = (c: string) => /[\p{L}\p{N}]/u.test(c);

/** What position `j` earns for beginning the text, a word, or a camelCase hump. */
function bonusAt(text: string, j: number): number {
  if (j === 0) return START_BONUS;
  const prev = text[j - 1];
  const cur = text[j];
  if (!isWordChar(prev)) return WORD_BONUS;
  const lowerThenUpper = prev === prev.toLowerCase() && prev !== prev.toUpperCase() && cur === cur.toUpperCase() && cur !== cur.toLowerCase();
  return lowerThenUpper ? WORD_BONUS : 0;
}

/** The best placement of one word (no spaces) in `text`: its score and matched indices. */
function matchWord(word: string, text: string, lower: string[]): { score: number; positions: number[] } | null {
  const n = word.length;
  const m = text.length;
  if (n > m) return null;
  const q = Array.from({ length: n }, (_, i) => word[i].toLowerCase());

  // A cheap in-order check first: most commands fail it, and it spares the table below.
  let found = 0;
  for (let j = 0; j < m && found < n; j++) if (lower[j] === q[found]) found++;
  if (found < n) return null;

  // best[i][j]: the best score with query char i placed at text index j (-Infinity: it can't
  // be). from[i][j]: where char i-1 sat for that score. A spread-out match is discounted by
  // its gap; the running maximum of `best[i-1][k] + GAP_PENALTY * k` over k <= j-2 keeps the
  // whole thing O(n*m).
  const best: number[][] = [];
  const from: number[][] = [];
  for (let i = 0; i < n; i++) {
    best.push(new Array<number>(m).fill(-Infinity));
    from.push(new Array<number>(m).fill(-1));
    let run = -Infinity;
    let runAt = -1;
    for (let j = 0; j < m; j++) {
      if (i > 0 && j >= 2) {
        const v = best[i - 1][j - 2] + GAP_PENALTY * (j - 2);
        if (v > run) {
          run = v;
          runAt = j - 2;
        }
      }
      if (lower[j] !== q[i]) continue;
      const own = 1 + bonusAt(text, j);
      if (i === 0) {
        best[i][j] = own - GAP_PENALTY * j;
        continue;
      }
      let value = -Infinity;
      let origin = -1;
      if (j >= 1 && best[i - 1][j - 1] > -Infinity) {
        value = best[i - 1][j - 1] + RUN_BONUS;
        origin = j - 1;
      }
      if (run > -Infinity && run - GAP_PENALTY * (j - 1) > value) {
        value = run - GAP_PENALTY * (j - 1);
        origin = runAt;
      }
      if (origin !== -1) {
        best[i][j] = value + own;
        from[i][j] = origin;
      }
    }
  }

  let end = -1;
  let score = -Infinity;
  for (let j = 0; j < m; j++) {
    if (best[n - 1][j] > score) {
      score = best[n - 1][j];
      end = j;
    }
  }
  if (end === -1) return null;
  const positions = new Array<number>(n);
  for (let i = n - 1, j = end; i >= 0; i--) {
    positions[i] = j;
    j = from[i][j];
  }
  return { score, positions };
}

/** Matched indices as sorted `[start, end)` stretches, touching ones joined. */
function toRanges(positions: number[]): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  for (const p of [...new Set(positions)].sort((a, b) => a - b)) {
    const last = ranges.at(-1);
    if (last && last[1] === p) last[1] = p + 1;
    else ranges.push([p, p + 1]);
  }
  return ranges;
}

/**
 * Matches `query` against `text`. `null` when some word of the query is not found; an empty
 * (or blank) query matches everything with a score of 0 and nothing to highlight.
 */
export function fuzzyMatch(query: string, text: string): FuzzyMatch | null {
  const words = query.split(/\s+/).filter(Boolean);
  if (!words.length) return { score: 0, ranges: [] };
  const lower = Array.from({ length: text.length }, (_, j) => text[j].toLowerCase());
  let score = 0;
  const positions: number[] = [];
  for (const word of words) {
    const hit = matchWord(word, text, lower);
    if (!hit) return null;
    score += hit.score;
    positions.push(...hit.positions);
  }
  return { score: score - text.length * LENGTH_PENALTY, ranges: toRanges(positions) };
}

export interface HighlightSegment {
  text: string;
  /** Whether this stretch is part of the match. */
  match: boolean;
}

/** Splits `text` into plain and matched stretches, for rendering a highlight. */
export function highlightSegments(text: string, ranges: ReadonlyArray<readonly [number, number]>): HighlightSegment[] {
  const segments: HighlightSegment[] = [];
  let at = 0;
  for (const [start, end] of ranges) {
    if (start > at) segments.push({ text: text.slice(at, start), match: false });
    segments.push({ text: text.slice(start, end), match: true });
    at = end;
  }
  if (at < text.length) segments.push({ text: text.slice(at), match: false });
  return segments;
}

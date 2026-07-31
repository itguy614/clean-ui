/** The line containing `pos`, as `[start, end)` offsets (end excludes the newline). */
export function lineBoundsAt(doc: string, pos: number): { start: number; end: number } {
  const start = doc.lastIndexOf("\n", pos - 1) + 1;
  const next = doc.indexOf("\n", pos);
  return { start, end: next === -1 ? doc.length : next };
}

export interface LineInfo {
  start: number;
  end: number;
  text: string;
}

/** Every line touched by `[from, to]`, in document order. A collapsed
 * cursor still yields the one line it sits on. */
export function linesInRange(doc: string, from: number, to: number): LineInfo[] {
  const lines: LineInfo[] = [];
  let pos = lineBoundsAt(doc, from).start;
  while (pos <= to) {
    const { start, end } = lineBoundsAt(doc, pos);
    lines.push({ start, end, text: doc.slice(start, end) });
    if (end >= doc.length) break;
    pos = end + 1;
  }
  return lines;
}

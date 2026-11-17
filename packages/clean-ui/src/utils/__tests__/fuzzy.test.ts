import { describe, it, expect } from "vitest";
import { fuzzyMatch, highlightSegments } from "../fuzzy";

const score = (q: string, t: string) => fuzzyMatch(q, t)?.score ?? -Infinity;
const marked = (q: string, t: string) =>
  highlightSegments(t, fuzzyMatch(q, t)?.ranges ?? [])
    .filter((s) => s.match)
    .map((s) => s.text);

describe("fuzzyMatch (#197)", () => {
  it("matches an in-order subsequence, case-insensitively", () => {
    expect(fuzzyMatch("opset", "Open Settings")).not.toBeNull();
    expect(fuzzyMatch("OPSET", "open settings")).not.toBeNull();
  });

  it("rejects a query whose characters are not all there, or out of order", () => {
    expect(fuzzyMatch("xyz", "Open Settings")).toBeNull();
    expect(fuzzyMatch("tes", "Set")).toBeNull();
    expect(fuzzyMatch("longer than the text", "short")).toBeNull();
  });

  it("matches everything for an empty or blank query, highlighting nothing", () => {
    expect(fuzzyMatch("", "anything")).toEqual({ score: 0, ranges: [] });
    expect(fuzzyMatch("   ", "anything")).toEqual({ score: 0, ranges: [] });
  });

  it("ranks a prefix above a mid-word match, and a word start above both", () => {
    expect(score("set", "Settings")).toBeGreaterThan(score("set", "Reset"));
    expect(score("set", "Open Settings")).toBeGreaterThan(score("set", "Reset"));
  });

  it("ranks contiguous characters above spread-out ones", () => {
    expect(score("fil", "File")).toBeGreaterThan(score("fil", "Fast Idle Loop"));
  });

  it("prefers a camelCase hump to the middle of a word", () => {
    expect(marked("ss", "openSettingsSheet")).toEqual(["S", "S"]);
  });

  it("highlights the way the score was earned: whole word over scattered letters", () => {
    expect(marked("set", "Open Settings")).toEqual(["Set"]);
    expect(marked("ose", "Open Settings")).toEqual(["O", "Se"]);
  });

  it("requires each word of a multi-word query, in any order", () => {
    expect(fuzzyMatch("file new", "New File")).not.toBeNull();
    expect(fuzzyMatch("new zzz", "New File")).toBeNull();
    expect(marked("file new", "New File")).toEqual(["New", "File"]);
  });

  it("returns sorted, non-overlapping ranges that index the original text", () => {
    const text = "Toggle Dark Mode";
    const { ranges } = fuzzyMatch("tdm", text)!;
    expect(ranges).toEqual([[0, 1], [7, 8], [12, 13]]);
    for (const [a, b] of ranges) expect(a).toBeLessThan(b);
  });

  it("prefers the shorter of two equal matches", () => {
    expect(score("save", "Save")).toBeGreaterThan(score("save", "Save everything now"));
  });
});

describe("highlightSegments", () => {
  it("splits into plain and matched stretches that rebuild the text", () => {
    const segments = highlightSegments("Open Settings", [[0, 1], [5, 8]]);
    expect(segments).toEqual([
      { text: "O", match: true },
      { text: "pen ", match: false },
      { text: "Set", match: true },
      { text: "tings", match: false },
    ]);
    expect(segments.map((s) => s.text).join("")).toBe("Open Settings");
  });

  it("is one plain segment without ranges", () => {
    expect(highlightSegments("abc", [])).toEqual([{ text: "abc", match: false }]);
  });
});

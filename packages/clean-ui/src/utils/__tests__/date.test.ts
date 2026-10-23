import { describe, it, expect } from "vitest";
import { formatDate, parseFormattedDate, MONTH_NAMES, MONTH_NAMES_SHORT } from "../date";

/**
 * #340 — formatDate replaced its tokens one after another, so the single-letter `M` and
 * `D` passes rewrote letters inside a month name it had just inserted: "3arch 5, 2025",
 * "05 5ec 2025". And parseFormattedDate sliced by the format's positions, so anything
 * after a month name of a different length was read from the wrong place.
 */
describe("formatDate", () => {
  it.each([
    [new Date(2025, 2, 5), "MMMM D, YYYY", "March 5, 2025"],
    [new Date(2025, 11, 5), "DD MMM YYYY", "05 Dec 2025"],
    [new Date(2025, 4, 1), "MMM YYYY", "May 2025"],
    [new Date(2025, 0, 9), "MM/DD/YYYY", "01/09/2025"],
    [new Date(2025, 0, 9), "M/D/YY", "1/9/25"],
    [new Date(2025, 6, 4), "YYYY-MM-DD", "2025-07-04"],
  ])("formats %s as %s", (date, format, expected) => {
    expect(formatDate(date, format)).toBe(expected);
  });

  it.each(MONTH_NAMES.map((_, m) => m))("writes month %i's names whole", (m) => {
    const date = new Date(2025, m, 15);
    expect(formatDate(date, "MMMM D")).toBe(`${MONTH_NAMES[m]} 15`);
    expect(formatDate(date, "D MMM")).toBe(`15 ${MONTH_NAMES_SHORT[m]}`);
  });

  it("formats each token once: the same token twice is two values", () => {
    expect(formatDate(new Date(2025, 2, 5), "D/D")).toBe("5/5");
  });
});

describe("parseFormattedDate", () => {
  const same = (a: Date | null, b: Date) => expect(a?.getTime()).toBe(b.getTime());

  it.each([
    ["March 5, 2025", "MMMM D, YYYY", new Date(2025, 2, 5)],
    ["March 05, 2025", "MMMM DD, YYYY", new Date(2025, 2, 5)],
    ["05 Dec 2025", "DD MMM YYYY", new Date(2025, 11, 5)],
    ["01/09/2025", "MM/DD/YYYY", new Date(2025, 0, 9)],
    ["1/9/25", "M/D/YY", new Date(2025, 0, 9)],
    ["2025-07-04", "YYYY-MM-DD", new Date(2025, 6, 4)],
    ["september 30, 2025", "MMMM D, YYYY", new Date(2025, 8, 30)],
  ])("reads %s against %s", (value, format, expected) => {
    same(parseFormattedDate(value, format), expected);
  });

  it.each(MONTH_NAMES.map((_, m) => m))("round-trips month %i through every format", (m) => {
    const date = new Date(2024, m, 28);
    for (const format of ["MMMM D, YYYY", "DD MMM YYYY", "MM/DD/YYYY", "M/D/YY", "YYYY-MM-DD"]) {
      same(parseFormattedDate(formatDate(date, format), format), date);
    }
  });

  it("returns null for a half-typed date, a stray character, or a date that doesn't exist", () => {
    expect(parseFormattedDate("03/0", "MM/DD/YYYY")).toBeNull();
    expect(parseFormattedDate("03/05/2025x", "MM/DD/YYYY")).toBeNull();
    expect(parseFormattedDate("02/31/2025", "MM/DD/YYYY"), "no rolling over into March").toBeNull();
    expect(parseFormattedDate("13/01/2025", "MM/DD/YYYY")).toBeNull();
    expect(parseFormattedDate("", "MM/DD/YYYY")).toBeNull();
  });

  it("reads a format with spaces at its ends", () => {
    same(parseFormattedDate(" 15 May 2025 ", " DD MMM YYYY "), new Date(2025, 4, 15));
  });

  it("takes the 1st when the format has no day", () => {
    same(parseFormattedDate("May 2025", "MMMM YYYY"), new Date(2025, 4, 1));
  });
});

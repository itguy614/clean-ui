import { describe, expect, it } from "vitest";
import type { DocPage } from "../pages";
import { groupResults, highlightSegments, isSearchShortcut, RANK, resultsMessage, searchPages } from "../search";

const page = (label: string, group: string, keywords: string[] = ["x"]): DocPage => ({
  id: label.toLowerCase().replace(/\W+/g, "-"),
  label,
  path: `/${label}`,
  group,
  keywords,
});

const PAGES: DocPage[] = [
  page("Overview", "Getting Started", ["home"]),
  page("Combobox", "Form Controls", ["autocomplete", "dropdown"]),
  page("Date Picker", "Form Controls", ["calendar"]),
  page("Select", "Form Controls", ["dropdown", "picker"]),
  page("Dropdown", "Overlay", ["menu"]),
  page("Modal", "Overlay", ["dialog"]),
  page("Confirm Dialog", "Overlay", ["confirmation"]),
];

const labels = (q: string) => searchPages(PAGES, q).map((r) => r.page.label);

describe("searchPages", () => {
  it("returns every page, in order, for an empty or blank query", () => {
    expect(labels("")).toEqual(PAGES.map((p) => p.label));
    expect(labels("  - ")).toEqual(PAGES.map((p) => p.label));
  });

  it("matches the label, ignoring case", () => {
    expect(labels("MODAL")).toEqual(["Modal"]);
    expect(labels("overv")).toEqual(["Overview"]);
  });

  it("matches a keyword the label does not say", () => {
    expect(labels("calendar")).toEqual(["Date Picker"]);
    expect(labels("dialog")).toEqual(["Confirm Dialog", "Modal"]);
  });

  it.each(["date picker", "datepicker", "date-picker", "Date  Picker", "DATE_PICKER", "e pic"])(
    "tolerates spaces, hyphens and case: %s",
    (q) => {
      expect(labels(q)).toContain("Date Picker");
    },
  );

  it("ranks a label prefix, then a label substring, then keywords, then the group", () => {
    // "picker": Date Picker (label substring) before Select (keyword) .
    expect(searchPages(PAGES, "picker").map((r) => [r.page.label, r.rank])).toEqual([
      ["Date Picker", RANK.labelSubstring],
      ["Select", RANK.keywordPrefix],
    ]);
    // "dropdown": the Dropdown label beats the two keyword matches.
    expect(labels("dropdown")).toEqual(["Dropdown", "Combobox", "Select"]);
    // "overlay" is only the group name.
    expect(searchPages(PAGES, "overlay").map((r) => r.rank)).toEqual([RANK.group, RANK.group, RANK.group]);
  });

  it("puts a keyword prefix above a keyword substring, and keeps page order within a rank", () => {
    const pages = [page("A", "G", ["subdrop"]), page("B", "G", ["drop"]), page("C", "G", ["drop down"])];
    expect(searchPages(pages, "drop").map((r) => r.page.label)).toEqual(["B", "C", "A"]);
  });

  it("returns nothing when nothing matches", () => {
    expect(labels("zzzz")).toEqual([]);
  });

  it("reports which keyword matched, only when the label did not", () => {
    const [select] = searchPages(PAGES, "picker").slice(1);
    expect(select?.keyword).toBe("picker");
    expect(searchPages(PAGES, "modal")[0]?.keyword).toBeUndefined();
  });

  it("maps a match back onto the original label, across the space it ignored", () => {
    const [result] = searchPages(PAGES, "datepi");
    expect(result?.ranges).toEqual([[0, 7]]);
    expect(highlightSegments("Date Picker", result!.ranges)).toEqual([
      { text: "Date Pi", match: true },
      { text: "cker", match: false },
    ]);
  });
});

describe("groupResults", () => {
  it("groups by section, best group first, so the first link is the best match", () => {
    const groups = groupResults(searchPages(PAGES, "dropdown"));
    expect(groups.map((g) => g.label)).toEqual(["Overlay", "Form Controls"]);
    expect(groups[0]?.results[0]?.page.label).toBe("Dropdown");
    expect(groups[1]?.results.map((r) => r.page.label)).toEqual(["Combobox", "Select"]);
  });

  it("keeps sidebar group order among equal ranks", () => {
    const groups = groupResults(searchPages(PAGES, ""));
    expect(groups.map((g) => g.label)).toEqual(["Getting Started", "Form Controls", "Overlay"]);
  });
});

describe("highlightSegments", () => {
  it("returns the whole label unmarked when nothing matched", () => {
    expect(highlightSegments("Modal", [])).toEqual([{ text: "Modal", match: false }]);
  });
});

describe("isSearchShortcut", () => {
  const key = (init: Partial<KeyboardEvent> & { target?: EventTarget | null }) =>
    ({ key: "/", ctrlKey: false, metaKey: false, altKey: false, defaultPrevented: false, target: document.body, ...init }) as KeyboardEvent;

  it("accepts a bare slash on the page", () => {
    expect(isSearchShortcut(key({}))).toBe(true);
  });

  it("ignores other keys and modified slashes", () => {
    expect(isSearchShortcut(key({ key: "a" }))).toBe(false);
    expect(isSearchShortcut(key({ ctrlKey: true }))).toBe(false);
    expect(isSearchShortcut(key({ metaKey: true }))).toBe(false);
    expect(isSearchShortcut(key({ altKey: true }))).toBe(false);
  });

  it.each(["input", "textarea", "select"])("ignores a slash typed in a %s", (tag) => {
    expect(isSearchShortcut(key({ target: document.createElement(tag) }))).toBe(false);
  });

  it("ignores a slash typed in a contenteditable, and inside one", () => {
    const editable = document.createElement("div");
    editable.setAttribute("contenteditable", "true");
    const inner = document.createElement("span");
    editable.append(inner);
    expect(isSearchShortcut(key({ target: editable }))).toBe(false);
    expect(isSearchShortcut(key({ target: inner }))).toBe(false);
  });
});

describe("resultsMessage", () => {
  it("counts, with the singular and the empty case", () => {
    expect(resultsMessage(0)).toBe("No matches");
    expect(resultsMessage(1)).toBe("1 page found");
    expect(resultsMessage(7)).toBe("7 pages found");
  });
});

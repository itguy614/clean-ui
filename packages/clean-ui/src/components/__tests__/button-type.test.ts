import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * #238 — a <button> with no `type` is a submit button, so any component that renders one
 * submits the surrounding <form> when it is clicked. CuiTabs did it on every tab switch
 * (fixed in #167), and CuiPagination and CuiDataGridViewManager still did when this guard
 * was added. A per-component behaviour test only protects that component; this one reads
 * every component template, so the next untyped button fails here instead of in a
 * consumer's form.
 *
 * CuiButton is not a literal <button> in its template — it renders one through
 * <component :is> and defaults its `type` prop to "button".
 */
const COMPONENTS = resolve(__dirname, "..");

/** `<button ...>` open tags in a template, attribute values allowed to contain `>`. */
const BUTTON_TAG = /<button\b((?:[^>"]|"[^"]*")*)>/g;
const HAS_TYPE = /(^|\s)(:|v-bind:)?type\s*=/;

describe("every <button> a component renders has an explicit type", () => {
  const files = readdirSync(COMPONENTS).filter((f) => f.endsWith(".vue"));

  it("finds the component templates", () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it.each(files)("%s", (file) => {
    const source = readFileSync(resolve(COMPONENTS, file), "utf8");
    const template = source.slice(Math.max(0, source.indexOf("<template")));
    const untyped = [...template.matchAll(BUTTON_TAG)]
      .filter(([, attrs]) => !HAS_TYPE.test(attrs))
      .map((m) => `line ${template.slice(0, m.index).split("\n").length}: ${m[0].replace(/\s+/g, " ").slice(0, 60)}`);
    expect(untyped).toEqual([]);
  });
});

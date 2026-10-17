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
const BUTTON_TAG = /<button\b((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
const HAS_TYPE = /(^|\s)(:|v-bind:)?type\s*=/;
/** Quoted attribute values, blanked so a `type =` inside one (e.g. in a handler) is not read as the attribute. */
const QUOTED = /"[^"]*"|'[^']*'/g;

/** The `<template>` block only, with HTML comments blanked (newlines kept, so line numbers hold). */
function templateOf(source: string): string {
  const start = source.indexOf("<template");
  const end = source.lastIndexOf("</template>");
  if (start < 0 || end < start) return "";
  return source.slice(start, end).replace(/<!--[\s\S]*?-->/g, (c) => c.replace(/[^\n]/g, " "));
}

describe("every <button> a component renders has an explicit type", () => {
  const files = readdirSync(COMPONENTS).filter((f) => f.endsWith(".vue"));

  it("finds the component templates", () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it.each(files)("%s", (file) => {
    const source = readFileSync(resolve(COMPONENTS, file), "utf8");
    const template = templateOf(source);
    const untyped = [...template.matchAll(BUTTON_TAG)]
      .filter(([, attrs]) => !HAS_TYPE.test(attrs.replace(QUOTED, '""')))
      .map((m) => `line ${template.slice(0, m.index).split("\n").length}: ${m[0].replace(/\s+/g, " ").slice(0, 60)}`);
    expect(untyped).toEqual([]);
  });
});

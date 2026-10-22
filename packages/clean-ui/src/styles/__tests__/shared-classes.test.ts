import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { readTag, walk } from "./css-helpers";

// #217: two techniques every form control needs had been copied into components and had
// drifted — the visually-hidden block (three spellings, a deprecated `clip`, one inline in a
// template) and the field error message (two sizes, three line heights, one inline style).
// `.cui-sr-only` and `.cui-field-error` in `styles/components-shared.css` are the one copy of
// each. Both packages: the editor's error message was a ninth copy.
const PACKAGES = resolve(__dirname, "../../../..");
const files = ["clean-ui", "clean-ui-editor"]
  .flatMap((pkg) => walk(resolve(PACKAGES, pkg, "src")))
  .filter((f) => /\.(vue|css)$/.test(f) && !f.endsWith("components-shared.css"))
  .map((f) => ({ name: relative(PACKAGES, f), src: readFileSync(f, "utf8") }));
const offenders = (pattern: RegExp) => files.filter((f) => pattern.test(f.src)).map((f) => f.name);


/** Error message elements: those bound to the field's error id (useFieldDescribedBy), and CuiFormField's, shown on `showError`. */
const errorTags = files.flatMap(({ name, src }) =>
  [...src.matchAll(/<[a-z]+\b(?=[^>]*(?::id="errorId"|v-if="showError"))/g)].map((m) => ({ name, tag: readTag(src, m.index!) })),
);

describe("shared component classes", () => {
  it("nothing hand-writes the visually-hidden technique; it uses .cui-sr-only", () => {
    expect(offenders(/clip:\s*rect\(|clip-path:\s*inset\(\s*50%\s*\)/)).toEqual([]);
  });

  it("no error-message rule or inline style paints the text; .cui-field-error does", () => {
    // Any selector naming an `__error` part (bare, compound or `:where()`) that sets the
    // text's size or colour (not `border-color`), or an error element styled inline. Its
    // gap — a margin — is the control's own layout, and stays.
    expect(offenders(/__error\b[^{}]*\{[^}]*(?<![-\w])(font-size|line-height|color)\s*:/)).toEqual([]);
    expect(errorTags.filter(({ tag }) => /\s:style=/.test(tag)).map(({ name }) => name)).toEqual([]);
  });

  it("every error message element carries .cui-field-error", () => {
    // A floor, so a scan that stopped matching can't pass vacuously: nine controls and the editor.
    expect(errorTags.length).toBeGreaterThanOrEqual(10);
    expect(errorTags.filter(({ tag }) => !/\bclass="[^"]*\bcui-field-error\b/.test(tag)).map(({ name }) => name)).toEqual([]);
  });
});

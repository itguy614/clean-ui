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

describe("shared component classes", () => {
  it("nothing hand-writes the visually-hidden technique; it uses .cui-sr-only", () => {
    expect(offenders(/clip:\s*rect\(|clip-path:\s*inset\(\s*50%\s*\)/)).toEqual([]);
  });

  it("no error-message rule or inline style paints the text; .cui-field-error does", () => {
    // Any selector naming an `__error` part (bare, compound or `:where()`), or an error
    // element styled inline. Its gap — a margin — is the control's own layout, and stays.
    expect(offenders(/__error\b[^{}]*\{[^}]*\b(font-size|line-height|color)\s*:|:id="errorId"[^>]*:style=/)).toEqual([]);
  });

  it("every error message element carries .cui-field-error", () => {
    // The error element is the one bound to the field's error id (useFieldDescribedBy);
    // CuiFormField's shares the description id and shows on `showError`.
    const missing = files.flatMap(({ name, src }) =>
      [...src.matchAll(/<[a-z]+\b(?=[^>]*(?::id="errorId"|v-if="showError"))/g)]
        .map((m) => readTag(src, m.index!))
        .filter((tag) => !/\bclass="[^"]*\bcui-field-error\b/.test(tag))
        .map(() => name),
    );
    expect(missing).toEqual([]);
  });
});

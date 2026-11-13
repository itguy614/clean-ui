import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// #180: the form controls take `label` / `description` / `error` / `errorMessage` / `required` /
// `readonly` / `disabled` from `FormControlProps` (types/common.ts), whole or as a `Pick<>` of the
// keys the control actually has — never a copy. A copy drifts: a different doc line, a different
// type, and `size-props.test.ts`-style sweeps can't see it. This is the same job that test does
// for `size`.
const src = dirname(fileURLToPath(import.meta.url));
const components = join(src, "../components");

/** Source with comments stripped, so an example in a doc comment isn't read as code. */
function code(file: string): string {
  return readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/[^\n]*$/gm, "");
}

/** The `export interface <Name>Props ... { body }` block: its `extends` clause and its body. */
function propsInterface(source: string, name: RegExp): { ext: string; body: string } | null {
  const m = source.match(new RegExp(`export interface (${name.source})([^{]*)\\{([\\s\\S]*?)\\n\\}`));
  return m ? { ext: m[2], body: m[3] } : null;
}

const KEYS = [...code(join(src, "../types/common.ts")).match(/interface FormControlProps[^{]*\{([\s\S]*?)\n\}/)![1].matchAll(/^\s+(\w+)\??:/gm)].map(
  (m) => m[1],
);

// Component file -> the file that holds its props interface. The two groups share one, in a .ts
// (`<script setup>` cannot export it, and the two differ only in the key they provide under).
const GROUP_PROPS = "multi-select-group-context.ts";
const FORM_CONTROLS: Record<string, string> = {
  "CuiCheckbox.vue": "CuiCheckbox.vue",
  "CuiCheckboxGroup.vue": GROUP_PROPS,
  "CuiCombobox.vue": "CuiCombobox.vue",
  "CuiDatePicker.vue": "CuiDatePicker.vue",
  "CuiDateRangePicker.vue": "CuiDateRangePicker.vue",
  "CuiFileUpload.vue": "CuiFileUpload.vue",
  "CuiInput.vue": "CuiInput.vue",
  "CuiInputStepper.vue": "CuiInputStepper.vue",
  "CuiMaskedInput.vue": "CuiMaskedInput.vue",
  "CuiPinInput.vue": "CuiPinInput.vue",
  "CuiRadio.vue": "CuiRadio.vue",
  "CuiRadioGroup.vue": "CuiRadioGroup.vue",
  "CuiRating.vue": "CuiRating.vue",
  "CuiSelect.vue": "CuiSelect.vue",
  "CuiSlider.vue": "CuiSlider.vue",
  "CuiTagInput.vue": "CuiTagInput.vue",
  "CuiTextarea.vue": "CuiTextarea.vue",
  "CuiTimePicker.vue": "CuiTimePicker.vue",
  "CuiToggle.vue": "CuiToggle.vue",
  "CuiToggleGroup.vue": GROUP_PROPS,
};

// Components that carry the keys without being a control, with the reason. A stale entry fails.
const NOT_CONTROLS: Record<string, string> = {
  "CuiFormField.vue": "the wrapper that supplies label/error/required to a control, not a control; its error and errorMessage are standalone-mode only (ignored when form-bound)",
};

function interfaceFor(file: string) {
  const holder = FORM_CONTROLS[file];
  const source = code(join(components, holder));
  const name = holder === GROUP_PROPS ? /MultiSelectGroupProps/ : /Cui\w+Props/;
  return propsInterface(source, name);
}

describe("form control props (#180)", () => {
  it("knows which keys FormControlProps carries", () => {
    expect(KEYS).toEqual(["label", "description", "error", "errorMessage", "required", "readonly"]);
  });

  it.each(Object.keys(FORM_CONTROLS))("%s takes the shared props from FormControlProps", (file) => {
    const iface = interfaceFor(file);
    expect(iface, "props interface not found").not.toBeNull();
    // `FormControlProps` itself, or a `Pick<FormControlProps, …>` of the keys the control has.
    expect(iface!.ext).toMatch(/\bFormControlProps\b/);
    const redeclared = KEYS.concat("disabled").filter((k) => new RegExp(`^\\s+${k}\\??:`, "m").test(iface!.body));
    expect(redeclared, "re-declared outside the mixin").toEqual([]);
  });

  it("every Pick<FormControlProps> names real keys", () => {
    for (const file of Object.keys(FORM_CONTROLS)) {
      const picked = interfaceFor(file)!.ext.match(/Pick<\s*FormControlProps\s*,([^>]*)>/);
      if (!picked) continue;
      for (const k of [...picked[1].matchAll(/"(\w+)"/g)].map((m) => m[1])) expect(KEYS, `${file}: ${k}`).toContain(k);
    }
  });

  // A new control must be added to FORM_CONTROLS: two or more of the shared keys (or `disabled`
  // alongside `readonly`) is the signature of one, so a control without an `errorMessage` is seen too.
  it("every component declaring the shared keys is on the list or exempt", () => {
    const declaring = readdirSync(components)
      .filter((f) => f.endsWith(".vue"))
      .filter((f) => {
        const iface = propsInterface(code(join(components, f)), /Cui\w+Props/);
        if (iface === null) return false;
        return KEYS.filter((k) => new RegExp(`^\\s+${k}\\??:`, "m").test(iface.body)).length >= 2;
      });
    expect(declaring.filter((f) => !(f in FORM_CONTROLS) && !(f in NOT_CONTROLS))).toEqual([]);
  });

  it("every listed control exists", () => {
    const files = readdirSync(components);
    expect(Object.keys(FORM_CONTROLS).filter((f) => !files.includes(f))).toEqual([]);
  });

  // CuiMarkdownEditor (clean-ui-editor) cannot `extends` an imported interface — defineProps
  // reaches clean-ui only through its built dist — so it declares the props by hand and the build
  // fails if they drift from FormControlProps, as it does for AriaLabelableProps.
  it("CuiMarkdownEditor guards its by-hand copy against FormControlProps", () => {
    const editor = code(join(src, "../../../clean-ui-editor/src/components/CuiMarkdownEditor.vue"));
    expect(editor).toMatch(/Pick<FormControlProps, FormKeys>/);
    expect(editor).toMatch(/\[FormContract\] extends \[FormCopy\]/);
  });
});

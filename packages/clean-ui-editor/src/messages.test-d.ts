import { test, expectTypeOf } from "vitest";
// Type-only fixture (see clean-ui's own `messages.test-d.ts` for the sibling
// pattern) — verifies the augmentation task 5.2.2 depends on, not exercised
// by `vitest run` (excluded from both projects' `include`); check with
// `vue-tsc -p tsconfig.typecheck.json`.
//
// Unlike clean-ui's own fixture, importing `@itguy614/clean-ui` here always
// resolves to that package's *compiled* declarations (the pnpm workspace
// link points at its `package.json`'s `types` field, same as a real
// consumer) — this package is never in the same program as clean-ui's own
// `defaultMessages` literal, so there's no self-reference trick to work around.
import type { CuiMessages, DeepPartialMessages } from "@itguy614/clean-ui";
import type { CuiMarkdownEditorMessages } from "./messages";

test("markdownEditor merges into CuiMessages with its exact shape", () => {
  expectTypeOf<CuiMessages>().toHaveProperty("markdownEditor");
  expectTypeOf<CuiMessages["markdownEditor"]>().toEqualTypeOf<CuiMarkdownEditorMessages>();

  // Existing clean-ui keys keep their exact types — nothing became loosely typed.
  expectTypeOf<CuiMessages["close"]>().toBeString();
  expectTypeOf<CuiMessages["pagination"]["perPage"]>().toBeFunction();
});

test("CuiConfigProvider's messages prop type-checks a markdownEditor override — one field at a time", () => {
  // The flat shape (see messages.ts's doc comment) means a single field
  // overrides with no need to also supply its former sibling group's fields.
  const overrides: DeepPartialMessages = {
    markdownEditor: { toolbarBold: "Gras" },
  };
  expectTypeOf(overrides).toMatchTypeOf<DeepPartialMessages>();

  const overrideFunction: DeepPartialMessages = {
    markdownEditor: { maxLengthExceeded: (overage, limit) => `${overage} over ${limit}` },
  };
  expectTypeOf(overrideFunction).toMatchTypeOf<DeepPartialMessages>();

  // @ts-expect-error toolbarBold must be a string, not a number
  const wrongShape: DeepPartialMessages = { markdownEditor: { toolbarBold: 42 } };
  expectTypeOf(wrongShape).toMatchTypeOf<DeepPartialMessages>();
});

test("the shared URL dialog strings are one key each; the old per-kind keys are gone (#398)", () => {
  const shared: DeepPartialMessages = {
    markdownEditor: {
      urlDialogCancel: "Annuler",
      urlDialogInsert: "Insérer",
      urlDialogUrlRequired: "Une URL est requise.",
      urlDialogUrlSchemeNotAllowed: "Ce schéma d'URL n'est pas autorisé.",
    },
  };
  expectTypeOf(shared).toMatchTypeOf<DeepPartialMessages>();

  // @ts-expect-error renamed to urlDialogCancel
  const linkCancel: DeepPartialMessages = { markdownEditor: { linkDialogCancel: "Annuler" } };
  // @ts-expect-error renamed to urlDialogCancel
  const imageCancel: DeepPartialMessages = { markdownEditor: { imageDialogCancel: "Annuler" } };
  // @ts-expect-error renamed to urlDialogInsert
  const linkInsert: DeepPartialMessages = { markdownEditor: { linkDialogInsert: "Insérer" } };
  // @ts-expect-error renamed to urlDialogInsert
  const imageInsert: DeepPartialMessages = { markdownEditor: { imageDialogInsert: "Insérer" } };
  // @ts-expect-error renamed to urlDialogUrlRequired
  const linkRequired: DeepPartialMessages = { markdownEditor: { linkDialogUrlRequired: "x" } };
  // @ts-expect-error renamed to urlDialogUrlRequired
  const imageRequired: DeepPartialMessages = { markdownEditor: { imageDialogUrlRequired: "x" } };
  // @ts-expect-error renamed to urlDialogUrlSchemeNotAllowed
  const linkScheme: DeepPartialMessages = { markdownEditor: { linkDialogUrlSchemeNotAllowed: "x" } };
  // @ts-expect-error renamed to urlDialogUrlSchemeNotAllowed
  const imageScheme: DeepPartialMessages = { markdownEditor: { imageDialogUrlSchemeNotAllowed: "x" } };
  expectTypeOf([linkCancel, imageCancel, linkInsert, imageInsert, linkRequired, imageRequired, linkScheme, imageScheme]).toMatchTypeOf<DeepPartialMessages[]>();
});

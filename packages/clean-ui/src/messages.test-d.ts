import { test, expectTypeOf } from "vitest";
// Targets source. This used to have to target the BUILT declarations: because
// declaration merging is whole-program, augmenting CuiMessageNamespaces from a
// file sharing a program with messages.ts made that file's own
// `defaultMessages` literal fail its own type check — the augmented CuiMessages
// required a namespace this package cannot provide for itself. Splitting
// CuiCoreMessages out (#107) removed that, so the fixture no longer needs a
// `pnpm build` to have run first, and no longer asserts against a stale build.
import type { CuiMessages, DeepPartialMessages } from "./messages";

// Simulates a satellite package augmenting the catalog via declaration
// merging. A real package targets the public specifier ("@itguy614/clean-ui");
// here the module resolves to the same file as the import above.
declare module "./messages" {
  interface CuiMessageNamespaces {
    exampleSatellite: {
      greeting: string;
    };
  }
}

test("a satellite namespace merges into CuiMessages with its exact shape", () => {
  expectTypeOf<CuiMessages>().toHaveProperty("exampleSatellite");
  expectTypeOf<CuiMessages["exampleSatellite"]>().toEqualTypeOf<{ greeting: string }>();

  // Existing keys keep their exact types — nothing became loosely typed.
  expectTypeOf<CuiMessages["close"]>().toBeString();
  expectTypeOf<CuiMessages["pagination"]["perPage"]>().toBeFunction();
});

test("CuiConfigProvider's messages prop type-checks a satellite namespace", () => {
  const overrides: DeepPartialMessages = {
    exampleSatellite: { greeting: "hi" },
  };
  expectTypeOf(overrides).toMatchTypeOf<DeepPartialMessages>();

  // @ts-expect-error greeting must be a string, not a number
  const wrongShape: DeepPartialMessages = { exampleSatellite: { greeting: 42 } };
  expectTypeOf(wrongShape).toMatchTypeOf<DeepPartialMessages>();
});

import { test, expectTypeOf } from "vitest";
// Targets the BUILT declarations, not "./messages" source: declaration merging
// is whole-program, so augmenting CuiMessageNamespaces from a file that shares
// a program with messages.ts's own `defaultMessages` literal would make that
// literal fail its own type check. A real satellite package never sees that
// literal either — only this package's compiled .d.ts — so this fixture
// mirrors real usage instead of the source layout. Requires `pnpm build` to
// have run first (CI always builds before testing; see tsconfig.typecheck.json).
import type { CuiMessages, DeepPartialMessages } from "../dist/messages";

// Simulates a satellite package augmenting the catalog via declaration
// merging. A real package targets the public specifier ("@itguy614/clean-ui");
// here the module resolves to the same compiled file as the import above.
declare module "../dist/messages" {
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

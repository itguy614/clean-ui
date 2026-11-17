import type { InjectionKey } from "vue";
import type { UseCommandPalette } from "./useCommandPalette";

/**
 * Where a command registry is provided (#530): `app.provide(CuiCommandPaletteKey, createCommandPalette())`
 * for an app, `useCommandPaletteProvider()` for a subtree. Read it with `useCommandPalette()`.
 */
export const CuiCommandPaletteKey: InjectionKey<UseCommandPalette> = Symbol("CuiCommandPalette");

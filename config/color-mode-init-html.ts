import type { Plugin } from "vite";
import { ssrColorModeInitScript } from "../packages/clean-ui/src/ssr-color-mode-init";

/**
 * Put `ssrColorModeInitScript` at the top of a docs app's <head>, so a stored dark mode is on
 * <html> before the first paint and a refresh doesn't flash light (#487). The same script a
 * consumer pastes, from the library source, so the docs exercise exactly what ships.
 */
export function colorModeInitHtml(): Plugin {
  return {
    name: "cui-color-mode-init",
    transformIndexHtml: () => [{ tag: "script", children: ssrColorModeInitScript, injectTo: "head-prepend" }],
  };
}

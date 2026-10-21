import type { Plugin } from "vue";
import type { CleanUIConfig } from "../components/config-context";

/** `createCleanUI()`'s options: the app-wide defaults `configureCleanUI()` takes (#149). */
export interface CleanUIOptions extends CleanUIConfig {
  prefix?: string;
}

export type CleanUIPlugin = Plugin;

// Re-export grid types
export type {
  TailwindSpacing,
  TailwindBreakpoint,
  ResponsiveValue,
  GridColumns,
  GridRows,
  GridSpan,
  FlexDirection,
  FlexWrap,
} from "./grid";

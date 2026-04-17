import type { Plugin } from "vue";

export interface CleanUIOptions {
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

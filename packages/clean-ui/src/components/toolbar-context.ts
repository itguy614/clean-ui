import { inject, provide, type InjectionKey, type Ref } from "vue";
import type { CuiOrientation } from "../types/common";

export interface ToolbarContext {
  /** The toolbar's axis. A separator stands across it. */
  orientation: Ref<CuiOrientation>;
}

export const ToolbarContextKey: InjectionKey<ToolbarContext> = Symbol("toolbar-context");

/** CuiToolbar provides the family's context through this. */
export function useToolbarProvider(context: ToolbarContext) {
  provide(ToolbarContextKey, context);
}

/** CuiToolbarSeparator reads it through this, and fails clearly outside a CuiToolbar. */
export function useToolbarContext(): ToolbarContext {
  const context = inject(ToolbarContextKey, null);
  if (!context) throw new Error("[CuiToolbarSeparator] must be used inside a <CuiToolbar> component.");
  return context;
}

import { inject, provide, type InjectionKey, type Ref, type VNodeChild } from "vue";
import type { CuiColor } from "../types/common";

export type TabVariant = "underline" | "segmented";
export type TabOrientation = "horizontal" | "vertical";
export type TabTransition = "fade" | "slide" | "none";

export interface TabDefinition {
  value: string;
  label: string;
  disabled?: boolean;
  closeable?: boolean;
  /**
   * CuiTab's `#label` slot, forwarded so CuiTabs can render it inside the tab
   * button (the button lives in the bar, which the parent owns). Absent when the
   * tab has no `#label` slot, in which case the parent renders `label` as text.
   */
  labelSlot?: () => VNodeChild;
}

export interface TabsContext {
  activeTab: Ref<string>;
  variant: Ref<TabVariant>;
  orientation: Ref<TabOrientation>;
  color: Ref<CuiColor>;
  keepAlive: Ref<boolean>;
  transition: Ref<TabTransition>;
  previousTab: Ref<string>;
  register: (tab: TabDefinition) => void;
  unregister: (value: string) => void;
  activate: (value: string) => void;
  close: (value: string) => void;
  /**
   * The ids linking a tab and its panel (#271): per tab set, so two sets sharing values
   * never collide — the tab's aria-controls names the panel, the panel's aria-labelledby
   * the tab. Optional only so that a context provided by hand (TabsContextKey is exported)
   * still type-checks; without them the panel carries no reference.
   */
  tabId?: (value: string) => string;
  panelId?: (value: string) => string;
  /** Which way a slide transition goes, from the registered tab order (optional, as above). */
  slideDirection?: Ref<"left" | "right">;
  /**
   * The last switch came from the keyboard: the panel shows with no transition (#269), as
   * arrowing along a tab bar is a hundred-times-a-day action. Optional, as above.
   */
  keyed?: Ref<boolean>;
}

export const TabsContextKey: InjectionKey<TabsContext> = Symbol("tabs-context");

/** CuiTabs provides the family's context through this. */
export function useTabsProvider(context: TabsContext) {
  provide(TabsContextKey, context);
}

/** CuiTab reads it through this, and fails clearly outside a CuiTabs. */
export function useTabsContext(): TabsContext {
  const context = inject(TabsContextKey);
  if (!context) throw new Error("[CuiTab] must be used inside a <CuiTabs> component.");
  return context;
}

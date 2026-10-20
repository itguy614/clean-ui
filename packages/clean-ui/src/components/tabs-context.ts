import type { InjectionKey, Ref, VNodeChild } from "vue";
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
}

export const TabsContextKey: InjectionKey<TabsContext> = Symbol("tabs-context");

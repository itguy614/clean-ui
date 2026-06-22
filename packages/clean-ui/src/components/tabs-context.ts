import type { InjectionKey, Ref } from "vue";
import type { CuiColor } from "../types/common";

export type TabVariant = "underline" | "segmented";
export type TabOrientation = "horizontal" | "vertical";
export type TabTransition = "fade" | "slide" | "none";

export interface TabDefinition {
  value: string;
  label: string;
  disabled?: boolean;
  closeable?: boolean;
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
}

export const TabsContextKey: InjectionKey<TabsContext> = Symbol("tabs-context");

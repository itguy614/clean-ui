import type { InjectionKey, Ref } from "vue";

export type TableSize = "sm" | "md" | "lg";

export interface TableContext {
  size: Ref<TableSize>;
  stickyHeader: Ref<boolean>;
}

export interface TableSectionContext {
  isHead: boolean;
}

export const TableContextKey: InjectionKey<TableContext> = Symbol("table-context");
export const TableSectionContextKey: InjectionKey<TableSectionContext> = Symbol("table-section-context");

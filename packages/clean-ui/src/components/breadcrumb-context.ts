import type { InjectionKey } from "vue";

export interface BreadcrumbContext {
  separator: string;
}

export const BreadcrumbContextKey: InjectionKey<BreadcrumbContext> = Symbol("breadcrumb-context");

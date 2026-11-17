import { inject, provide, type InjectionKey } from "vue";

/** A marker: the parts only need to know a CuiSidebar is around them. */
export type SidebarContext = Record<string, never>;

export const SidebarKey: InjectionKey<SidebarContext> = Symbol("cui-sidebar");

/** CuiSidebar provides the family's context through this. */
export function useSidebarProvider(context: SidebarContext) {
  provide(SidebarKey, context);
}

/**
 * CuiSidebarHeader / Content / Footer read it through this, and fail clearly outside a
 * CuiSidebar. CuiSidebarGroup deliberately does not read it: it works without a sidebar
 * around it, since CuiNavbarMenu renders one in its drawer.
 */
export function useSidebarContext(): SidebarContext {
  const context = inject(SidebarKey, null);
  if (!context) throw new Error("[CuiSidebar] this part must be used inside a <CuiSidebar> component.");
  return context;
}

import { inject, provide, type InjectionKey } from "vue";

export interface SidebarContext {
  /**
   * True while the sidebar's content is rendered inside its drawer (the viewport is below
   * `collapseBelow`) rather than as an inline column. Getter, so a part follows the change.
   */
  readonly inDrawer: boolean;
}

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

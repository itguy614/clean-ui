import { inject, provide, type ComputedRef, type InjectionKey, type Ref } from "vue";

/**
 * What CuiNavbar tells its parts. The nav is written once; where it renders is decided here:
 * `collapsed` is false while the bar has room (the nav is horizontal, a menu is a dropdown)
 * and true below the breakpoint (the nav lives in a drawer, a menu is a collapsible group).
 */
export interface NavbarContext {
  /** True below the `collapse-below` breakpoint, once mounted. */
  collapsed: ComputedRef<boolean>;
  /** Whether the drawer is open. Only ever true while collapsed. */
  open: Ref<boolean>;
  /** The id of the drawer's panel, which the menu button's `aria-controls` names. */
  drawerId: string;
  /** The accessible name of the `<nav>` landmark. */
  label: ComputedRef<string>;
  /** The accessible name of the drawer's dialog: the menu, not the landmark inside it. */
  drawerName: ComputedRef<string>;
  /** Close the drawer: following a link leaves it. */
  close: () => void;
  /** A CuiNavbarNav registers while mounted: without one there is no menu button to show. */
  registerNav: () => () => void;
}

export const NavbarKey: InjectionKey<NavbarContext> = Symbol("cui-navbar");

/** CuiNavbar provides the family's context through this. */
export function useNavbarProvider(context: NavbarContext) {
  provide(NavbarKey, context);
}

/**
 * Every part reads it through this, and fails clearly outside a CuiNavbar. That includes
 * CuiNavbarMenu: unlike CuiSidebarGroup it has no standalone form, since which of its two
 * presentations to draw is the navbar's decision, so a menu without one has nothing to follow.
 */
export function useNavbarContext(): NavbarContext {
  const context = inject(NavbarKey, null);
  if (!context) throw new Error("[CuiNavbar] this part must be used inside a <CuiNavbar> component.");
  return context;
}

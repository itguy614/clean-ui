import type { InjectionKey, Ref } from "vue";
import type { PanelSide } from "../utils/position";
import type { MenuEdge } from "../utils/menu";

export type DropdownTrigger = "click" | "hover" | "hover-focus";
export type DropdownPlacement = PanelSide;

export interface DropdownContext {
  isOpen: Ref<boolean>;
  isClosing: Ref<boolean>;
  trigger: Ref<DropdownTrigger>;
  triggerEl: Ref<HTMLElement | null>;
  placement: Ref<DropdownPlacement>;
  /**
   * Identifies this menu's panels: each one — the menu and every sub-menu — carries it as
   * `data-cui-menu-owner`, which is how the teleported panels are found (see utils/menu).
   */
  ownerId: string;
  /**
   * CuiDropdown only. Which item CuiDropdownMenu focuses once it has rendered: a fresh
   * object per request, so an explicit one (Arrow Up/Down on the trigger) moves focus in
   * even while the menu is already open.
   */
  focusRequest?: Ref<{ edge: MenuEdge } | null>;
  /** Open, then focus the first item — or the last, for Arrow Up on the trigger. */
  open: (edge?: MenuEdge) => void;
  close: () => void;
  toggle: () => void;
  closeAll: () => void;
  /** Register a sub-menu close callback; returns unregister function */
  registerSubMenu: (close: () => void) => () => void;
  /** Close all sibling sub-menus */
  closeSiblingSubMenus: (except?: () => void) => void;
  /** Reposition the menu (called on scroll when pinned) */
  reposition: () => void;
}

export const DropdownContextKey: InjectionKey<DropdownContext> = Symbol("dropdown-context");

export interface DropdownRadioContext {
  modelValue: Ref<string | number>;
  select: (value: string | number) => void;
}

export const DropdownRadioKey: InjectionKey<DropdownRadioContext> = Symbol("dropdown-radio");

import type { InjectionKey, Ref } from "vue";
import type { PanelSide } from "../utils/position";

export type DropdownTrigger = "click" | "hover" | "hover-focus";
export type DropdownPlacement = PanelSide;

export interface DropdownContext {
  isOpen: Ref<boolean>;
  isClosing: Ref<boolean>;
  trigger: Ref<DropdownTrigger>;
  triggerEl: Ref<HTMLElement | null>;
  placement: Ref<DropdownPlacement>;
  open: () => void;
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

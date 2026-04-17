import type { InjectionKey, Ref } from "vue";

export type DropdownTrigger = "click" | "hover" | "hover-focus";
export type DropdownPlacement = "bottom" | "top" | "left" | "right";

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

/**
 * Compute dropdown position synchronously from a reference element.
 * Returns CSS styles for the floating panel.
 */
export function computeDropdownPosition(
  triggerEl: HTMLElement,
  preferredPlacement: DropdownPlacement = "bottom",
): { styles: Record<string, string>; actualPlacement: DropdownPlacement } {
  const rect = triggerEl.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  let placement = preferredPlacement;

  // Auto-flip vertical
  if (placement === "bottom" && viewportHeight - rect.bottom < 200 && rect.top > viewportHeight - rect.bottom) {
    placement = "top";
  } else if (placement === "top" && rect.top < 200 && viewportHeight - rect.bottom > rect.top) {
    placement = "bottom";
  }

  // Auto-flip horizontal
  if (placement === "right" && viewportWidth - rect.right < 200 && rect.left > viewportWidth - rect.right) {
    placement = "left";
  } else if (placement === "left" && rect.left < 200 && viewportWidth - rect.right > rect.left) {
    placement = "right";
  }

  const gap = 4;
  const styles: Record<string, string> = {
    position: "fixed",
    zIndex: "9990",
  };

  switch (placement) {
    case "bottom":
      styles.top = `${rect.bottom + gap}px`;
      styles.left = `${rect.left}px`;
      styles.maxHeight = `${Math.min(viewportHeight - rect.bottom - gap - 16, 400)}px`;
      break;
    case "top":
      styles.bottom = `${viewportHeight - rect.top + gap}px`;
      styles.left = `${rect.left}px`;
      styles.maxHeight = `${Math.min(rect.top - gap - 16, 400)}px`;
      break;
    case "right":
      styles.top = `${rect.top}px`;
      styles.left = `${rect.right + gap}px`;
      styles.maxHeight = `${Math.min(viewportHeight - rect.top - 16, 400)}px`;
      break;
    case "left":
      styles.top = `${rect.top}px`;
      styles.right = `${viewportWidth - rect.left + gap}px`;
      styles.maxHeight = `${Math.min(viewportHeight - rect.top - 16, 400)}px`;
      break;
  }

  return { styles, actualPlacement: placement };
}

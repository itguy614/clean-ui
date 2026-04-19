import type { InjectionKey, Ref } from "vue";
import type { ButtonColor } from "./CuiButton.vue";

export interface AccordionContext {
  openItems: Ref<Array<string>>;
  multiple: Ref<boolean>;
  color: Ref<ButtonColor>;
  noAnimation: Ref<boolean>;
  toggle: (value: string) => void;
  isOpen: (value: string) => boolean;
}

export const AccordionContextKey: InjectionKey<AccordionContext> = Symbol("accordion-context");

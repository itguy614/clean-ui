import type { InjectionKey, Ref } from "vue";

export interface AccordionContext {
  openItems: Ref<Array<string>>;
  multiple: Ref<boolean>;
  noAnimation: Ref<boolean>;
  toggle: (value: string) => void;
  isOpen: (value: string) => boolean;
}

export const AccordionContextKey: InjectionKey<AccordionContext> = Symbol("accordion-context");

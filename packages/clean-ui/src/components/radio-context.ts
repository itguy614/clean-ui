import type { InjectionKey, Ref } from "vue";
import type { ButtonColor } from "./CuiButton.vue";
import type { ButtonSize } from "./CuiButton.vue";

export type RadioGroupVariant = "default" | "buttons";

export interface RadioGroupContext {
  modelValue: Ref<string | number | boolean | undefined>;
  name: string;
  color: Ref<ButtonColor>;
  disabled: Ref<boolean>;
  readonly: Ref<boolean>;
  variant: Ref<RadioGroupVariant>;
  size: Ref<ButtonSize>;
  select: (value: string | number | boolean) => void;
}

export const RadioGroupKey: InjectionKey<RadioGroupContext> = Symbol("radio-group");

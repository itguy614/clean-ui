import type { InjectionKey, Ref } from "vue";
import type { CuiColor } from "../types/common";
import type { CuiSize } from "../types/common";

export type RadioGroupVariant = "default" | "buttons";

export interface RadioGroupContext {
  modelValue: Ref<string | number | boolean | undefined>;
  name: string;
  color: Ref<CuiColor>;
  disabled: Ref<boolean>;
  readonly: Ref<boolean>;
  variant: Ref<RadioGroupVariant>;
  size: Ref<CuiSize>;
  select: (value: string | number | boolean) => void;
}

export const RadioGroupKey: InjectionKey<RadioGroupContext> = Symbol("radio-group");

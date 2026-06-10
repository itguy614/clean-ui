import type { InjectionKey, Ref } from "vue";
import type { CuiColor } from "../types/common";

export interface CheckboxGroupContext {
  modelValue: Ref<Array<string | number>>;
  color: Ref<CuiColor>;
  disabled: Ref<boolean>;
  readonly: Ref<boolean>;
  toggle: (value: string | number) => void;
}

export const CheckboxGroupKey: InjectionKey<CheckboxGroupContext> = Symbol("checkbox-group");

import type { InjectionKey, Ref } from "vue";
import type { ButtonColor } from "./CuiButton.vue";

export interface ToggleGroupContext {
  modelValue: Ref<Array<string | number>>;
  color: Ref<ButtonColor>;
  disabled: Ref<boolean>;
  readonly: Ref<boolean>;
  toggle: (value: string | number) => void;
}

export const ToggleGroupKey: InjectionKey<ToggleGroupContext> = Symbol("toggle-group");

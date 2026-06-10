import type { InjectionKey, Ref } from "vue";
import type { CuiColor } from "../types/common";

/**
 * Shared context for multi-select groups (CheckboxGroup, ToggleGroup).
 * Both have identical shapes — this prevents drift.
 */
export interface MultiSelectGroupContext {
  modelValue: Ref<Array<string | number>>;
  color: Ref<CuiColor>;
  disabled: Ref<boolean>;
  readonly: Ref<boolean>;
  toggle: (value: string | number) => void;
}

export const CheckboxGroupKey: InjectionKey<MultiSelectGroupContext> = Symbol("checkbox-group");
export const ToggleGroupKey: InjectionKey<MultiSelectGroupContext> = Symbol("toggle-group");

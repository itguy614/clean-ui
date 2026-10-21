import { inject, provide, type InjectionKey, type Ref } from "vue";
import type { CuiAutoOrientation, CuiColor, HideableProps, ColorableProps, DisableableProps, AriaLabelableProps } from "../types/common";

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

/** The public names for each group's context — the same shape. */
export type CheckboxGroupContext = MultiSelectGroupContext;
export type ToggleGroupContext = MultiSelectGroupContext;

export const CheckboxGroupKey: InjectionKey<MultiSelectGroupContext> = Symbol("checkbox-group");
export const ToggleGroupKey: InjectionKey<MultiSelectGroupContext> = Symbol("toggle-group");

/** The props CuiCheckboxGroup and CuiToggleGroup share — all of them (#206). */
export interface MultiSelectGroupProps extends AriaLabelableProps, HideableProps, ColorableProps, DisableableProps {
  /** Array of selected values */
  modelValue?: Array<string | number>;
  /** Layout orientation — auto: horizontal for ≤2 options, vertical for 3+ */
  orientation?: CuiAutoOrientation;
  /** Make every option readonly */
  readonly?: boolean;
  /** Show error state */
  error?: boolean;
  /** Error message displayed below the group */
  errorMessage?: string;
  /** Accessible label for the group */
  label?: string;
}

/**
 * Provide a multi-select group's context (#206): the group's state, passed as refs, plus
 * `toggle`, which adds or removes one value and emits the new array. CuiCheckboxGroup and
 * CuiToggleGroup differ only in the key they provide under.
 */
export function useMultiSelectGroupProvider(
  key: InjectionKey<MultiSelectGroupContext>,
  state: Omit<MultiSelectGroupContext, "toggle">,
  emit: (event: "update:modelValue", value: Array<string | number>) => void,
) {
  provide(key, {
    ...state,
    toggle(value: string | number) {
      if (state.disabled.value || state.readonly.value) return;
      const current = [...state.modelValue.value];
      const idx = current.indexOf(value);
      if (idx >= 0) current.splice(idx, 1);
      else current.push(value);
      emit("update:modelValue", current);
    },
  });
}

/**
 * The enclosing group's context, or `null` for a standalone checkbox or toggle. Optional, so
 * named apart from the `useXContext` convention, which throws outside its parent: standalone
 * is a supported mode here.
 */
export function useOptionalMultiSelectGroupContext(key: InjectionKey<MultiSelectGroupContext>): MultiSelectGroupContext | null {
  return inject(key, null);
}

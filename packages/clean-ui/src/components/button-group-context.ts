import type { ComputedRef, InjectionKey } from "vue";

export type ButtonGroupOrientation = "horizontal" | "vertical";

/** Where a button sits among the members of its group, in DOM order. */
export type ButtonGroupPosition = "first" | "middle" | "last" | "only";

/** What one button learns from its group: where it sits, and which corners and edges merge. */
export interface ButtonGroupSlot {
  position: ComputedRef<ButtonGroupPosition>;
  /** The leading corners are square: a painted neighbour comes before it. */
  flatStart: ComputedRef<boolean>;
  /** The trailing corners are square: a painted neighbour comes after it. */
  flatEnd: ComputedRef<boolean>;
  /** The classes the button wears for all of that, which `styles/components-shared.css` styles. */
  classes: ComputedRef<string[]>;
  /** Called once the button is mounted: only then is its place in the DOM known. */
  attach: () => void;
  detach: () => void;
}

export interface ButtonGroupContext {
  /** A button calls this in setup; `painted` is false for a ghost button, which draws no edge. */
  join: (el: () => HTMLElement | null | undefined, painted: () => boolean) => ButtonGroupSlot;
}

export const ButtonGroupContextKey: InjectionKey<ButtonGroupContext> = Symbol("button-group-context");

import { inject, provide, type InjectionKey } from "vue";

export type ListVariant = "plain" | "inset";

export interface ListContext {
  /** The list's visual style. Getters, so an item follows a prop change on its list. */
  readonly variant: ListVariant;
  /** Whether rows are separated by a divider. Always true for `inset`. */
  readonly divided: boolean;
  /**
   * The element each item renders as: `li` inside a `ul`/`ol`, else `div`. A `div` list of
   * `li` children would be invalid markup, and a `ul` of `div`s would lose its item count.
   */
  readonly itemTag: "li" | "div";
}

export const ListContextKey: InjectionKey<ListContext> = Symbol("list-context");

/** CuiList provides the family's context through this. */
export function useListProvider(context: ListContext) {
  provide(ListContextKey, context);
}

/** CuiListItem reads it through this, and fails clearly outside a CuiList. */
export function useListContext(): ListContext {
  const context = inject(ListContextKey, null);
  if (!context) throw new Error("[CuiListItem] must be used inside a <CuiList> component.");
  return context;
}

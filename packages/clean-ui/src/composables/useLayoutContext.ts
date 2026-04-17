import { inject, provide, ref, type InjectionKey, type Ref } from "vue";

export interface LayoutContext {
  type: "grid" | "flex";
  isNested: boolean;
  depth: number;
  debug: boolean;
}

const GridContextKey: InjectionKey<Ref<LayoutContext>> = Symbol("grid-context");
const FlexContextKey: InjectionKey<Ref<LayoutContext>> = Symbol("flex-context");

function createContext(type: "grid" | "flex") {
  const key = type === "grid" ? GridContextKey : FlexContextKey;
  const parent = inject(key, null);

  const context = ref<LayoutContext>({
    type,
    isNested: parent !== null,
    depth: parent ? parent.value.depth + 1 : 0,
    debug: parent?.value.debug ?? false,
  });

  provide(key, context);
  return { context, parentContext: parent };
}

export function useGridContext() {
  return createContext("grid");
}

export function useFlexContext() {
  return createContext("flex");
}

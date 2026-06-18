import type { ComputedRef, InjectionKey } from "vue";
import type { CuiMessages } from "../messages";

/** Resolved (merged) message catalog provided by CuiConfigProvider. */
export const CuiConfigKey: InjectionKey<ComputedRef<CuiMessages>> = Symbol("cui-config");

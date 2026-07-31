import type { InjectionKey, Ref } from "vue";

export const ShowDebugKey: InjectionKey<Ref<boolean>> = Symbol("show-debug");

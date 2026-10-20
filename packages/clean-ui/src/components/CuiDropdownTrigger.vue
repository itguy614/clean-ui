<script setup lang="ts">
import { Comment, Fragment, cloneVNode, computed, inject, onMounted, ref, useSlots, type VNode } from "vue";
import { DropdownContextKey } from "./dropdown-context";
import { warnOnce } from "../utils/devWarn";

/**
 * The menu button (#160). The wrapper is not the button and is not focusable: the slotted
 * child is — normally a CuiButton — so the menu-button semantics go on *it*, as Radix's
 * `asChild` does. The wrapper keeps the click and the keys, which bubble up from the child.
 */
const ctx = inject(DropdownContextKey);
const slots = useSlots();
const el = ref<HTMLElement>();

onMounted(() => {
  if (ctx && el.value) {
    ctx.triggerEl.value = el.value;
  }
});

const expanded = computed(() => !!ctx?.isOpen.value && !ctx.isClosing.value);

// A component vnode passes them on as attrs, so they land on CuiButton's <button>.
const forwarded = computed(() => ({
  "aria-haspopup": "menu",
  "aria-expanded": expanded.value ? "true" : "false",
  "aria-controls": expanded.value && ctx ? `${ctx.ownerId}-menu` : undefined,
}));

/** The slot's nodes, with fragments flattened and comments (a false `v-if`) dropped. */
function flatten(nodes: VNode[]): VNode[] {
  return nodes.flatMap((n) => (n.type === Fragment ? flatten(n.children as VNode[]) : n.type === Comment ? [] : [n]));
}

/** Renders the slot, with the attributes cloned onto its one child. */
const Child = () => {
  const nodes = flatten(slots.default?.() ?? []);
  const only = nodes.length === 1 ? nodes[0] : undefined;
  // An element or a component; a bare text node has nowhere to take the attributes.
  if (only && typeof only.type !== "symbol") return cloneVNode(only, forwarded.value, true);
  warnOnce(
    "[clean-ui] CuiDropdownTrigger: the default slot should be one element or component — " +
      "a CuiButton or <button> — so it can carry the menu-button attributes and keyboard focus.",
  );
  return nodes;
};

function onClick() {
  if (ctx?.trigger.value === "click") {
    ctx.toggle();
  }
}

/** Whether the browser turns this key on the target into a click by itself. */
function clicksNatively(target: EventTarget | null, key: string) {
  if (!(target instanceof Element)) return false;
  if (target.closest("button, input, select, textarea")) return true;
  return key === "Enter" && !!target.closest("a[href]");
}

function onKeydown(e: KeyboardEvent) {
  if (!ctx || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    // Any trigger mode: it is the keyboard's way into a hover menu too.
    e.preventDefault();
    ctx.open(e.key === "ArrowUp" ? "last" : "first");
  } else if ((e.key === "Enter" || e.key === " ") && !clicksNatively(e.target, e.key)) {
    e.preventDefault();
    onClick();
  }
}
</script>

<template>
  <div ref="el" class="cui-dropdown-trigger" @click="onClick" @keydown="onKeydown">
    <Child />
  </div>
</template>

<style scoped>
.cui-dropdown-trigger {
  display: inline-flex;
}
</style>

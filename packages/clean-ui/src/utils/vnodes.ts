import { Comment, Fragment, type VNode } from "vue";

/**
 * A slot's vnodes as rendered: fragments (`v-for`, `<template>`) unwrapped at any depth, and
 * the comment a false `v-if` leaves behind dropped. Text vnodes are kept, for the caller to
 * count or ignore.
 */
export function slotNodes(vnodes: VNode[]): VNode[] {
  return vnodes.flatMap((vnode) => {
    if (vnode.type === Comment) return [];
    if (vnode.type === Fragment) return Array.isArray(vnode.children) ? slotNodes(vnode.children as VNode[]) : [];
    return [vnode];
  });
}

<script setup lang="ts">
import { ref, computed, useTemplateRef } from "vue";
import CuiTreeNode from "./CuiTreeNode.vue";
import type { HideableProps } from "../types/common";
import { scaleDensity, scaleControlHeight } from "../utils/sizing";

export interface TreeNode {
  /** Unique identifier */
  id: string | number;
  /** Display label */
  label: string;
  /** Icon name */
  icon?: string;
  /** Children nodes */
  children?: TreeNode[];
  /** Disabled */
  disabled?: boolean;
  /** Any extra data */
  [key: string]: unknown;
}

export interface CuiTreeViewProps extends HideableProps {
  /** Tree data */
  nodes: TreeNode[];
  /** Selected node id(s) — string/number for single, array for multiple */
  modelValue?: string | number | (string | number)[] | null;
  /** Allow multiple selection */
  multiple?: boolean;
  /**
   * Expanded node ids (`v-model:expanded`). Pass it and expansion is
   * controlled — the tree renders exactly these ids and every change is emitted
   * for you to apply, so expansion can be driven from app state, persisted, or
   * restored. Omit it and the tree manages expansion itself, seeded from
   * `defaultExpanded` / `expandAll`.
   */
  expanded?: (string | number)[];
  /** Initially expanded node ids — read once, for uncontrolled use */
  defaultExpanded?: (string | number)[];
  /** Expand all nodes by default — read once, for uncontrolled use */
  expandAll?: boolean;
  /** Show connecting lines */
  showLines?: boolean;
  /** Selectable nodes (false = expand only, no selection) */
  selectable?: boolean;
  /** Animate expand/collapse */
  animated?: boolean;
  /** Size */
  size?: "sm" | "md" | "lg";
}

const props = withDefaults(defineProps<CuiTreeViewProps>(), {
  multiple: false,
  expandAll: false,
  showLines: true,
  selectable: true,
  animated: true,
  size: "md",
  hidden: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string | number | (string | number)[] | null];
  "update:expanded": [value: (string | number)[]];
  "node-click": [node: TreeNode];
  "node-expand": [node: TreeNode, expanded: boolean];
}>();

const el = useTemplateRef<HTMLElement>("el");

/** Ids of every node that has children — the ones expansion applies to. */
function expandableIds(nodes: TreeNode[]): (string | number)[] {
  return nodes.flatMap((node) =>
    node.children && node.children.length > 0 ? [node.id, ...expandableIds(node.children)] : [],
  );
}

function findNode(nodes: TreeNode[], id: string | number): TreeNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = node.children && findNode(node.children, id);
    if (found) return found;
  }
  return undefined;
}

// Expansion is controlled whenever `expanded` is passed, and uncontrolled
// otherwise — the same split `modelValue` already uses for selection, so the
// tree can never drift from the ids a parent is holding. `defaultExpanded` and
// `expandAll` only ever seed the uncontrolled ref; they are read once, which is
// what "default" means.
const uncontrolledExpanded = ref(
  new Set<string | number>(props.expandAll ? expandableIds(props.nodes) : (props.defaultExpanded ?? [])),
);

const expandedSet = computed(() =>
  props.expanded !== undefined ? new Set(props.expanded) : uncontrolledExpanded.value,
);

function setExpanded(next: Set<string | number>) {
  if (props.expanded === undefined) uncontrolledExpanded.value = next;
  emit("update:expanded", [...next]);
}

/** Expand or collapse one id, emitting `node-expand` when it actually changes. */
function setNodeExpanded(id: string | number, shouldExpand: boolean) {
  const next = new Set(expandedSet.value);
  if (next.has(id) === shouldExpand) return;
  shouldExpand ? next.add(id) : next.delete(id);
  setExpanded(next);

  const node = findNode(props.nodes, id);
  if (node) emit("node-expand", node, shouldExpand);
}

function onToggleExpand(node: TreeNode) {
  setNodeExpanded(node.id, !expandedSet.value.has(node.id));
}

// Selected state
const selectedSet = computed(() => {
  if (props.modelValue == null) return new Set<string | number>();
  if (Array.isArray(props.modelValue)) return new Set(props.modelValue);
  return new Set([props.modelValue]);
});

function selectNode(node: TreeNode) {
  if (!props.selectable || node.disabled) return;
  emit("node-click", node);

  if (props.multiple) {
    const current = new Set(selectedSet.value);
    current.has(node.id) ? current.delete(node.id) : current.add(node.id);
    emit("update:modelValue", [...current]);
  } else {
    emit("update:modelValue", selectedSet.value.has(node.id) ? null : node.id);
  }
}

// `hitSize` is the chevron's clickable box, floored at 24px (WCAG 2.5.8) by
// scaleControlHeight — the same floor CuiButton/CuiInput use. It's deliberately
// independent of `iconSize`, which stays the glyph's visual size: at sm the caret
// still draws at 12px, inside a 24px target.
const sizeConfig: Record<string, { fontSize: string; iconSize: string; hitSize: string; indent: string; padY: string; padX: string }> = {
  sm: { fontSize: "0.8125rem", iconSize: "0.75rem", hitSize: scaleControlHeight("0.75rem"), indent: scaleDensity("1rem"), padY: scaleDensity("0.1875rem"), padX: scaleDensity("0.375rem") },
  md: { fontSize: "0.875rem", iconSize: "0.875rem", hitSize: scaleControlHeight("0.875rem"), indent: scaleDensity("1.25rem"), padY: scaleDensity("0.25rem"), padX: scaleDensity("0.5rem") },
  lg: { fontSize: "0.9375rem", iconSize: "1rem", hitSize: scaleControlHeight("1rem"), indent: scaleDensity("1.5rem"), padY: scaleDensity("0.375rem"), padX: scaleDensity("0.625rem") },
};
const cfg = computed(() => sizeConfig[props.size]);

/**
 * Imperative expansion, for the cases a bound array is clumsy for: expanding on
 * row click, an "expand all" toolbar button, revealing a search hit. Each one
 * works in both controlled and uncontrolled mode.
 *
 * `expandAll`/`collapseAll` emit `update:expanded` once rather than a
 * `node-expand` per node — use the model for bulk changes.
 */
defineExpose({
  el,
  /** Expand one node by id. No-op if it is already expanded. */
  expand: (id: string | number) => setNodeExpanded(id, true),
  /** Collapse one node by id. No-op if it is already collapsed. */
  collapse: (id: string | number) => setNodeExpanded(id, false),
  /** Flip one node's expanded state. */
  toggleExpand: (id: string | number) => setNodeExpanded(id, !expandedSet.value.has(id)),
  /** Expand every node that has children, at any depth. */
  expandAll: () => setExpanded(new Set(expandableIds(props.nodes))),
  /** Collapse everything. */
  collapseAll: () => setExpanded(new Set()),
  /** Expand a node and all of its ancestors, so a deep node is revealed. */
  reveal: (id: string | number) => {
    const path: (string | number)[] = [];
    const walk = (nodes: TreeNode[], trail: (string | number)[]): boolean =>
      nodes.some((node) => {
        if (node.id === id) {
          path.push(...trail);
          return true;
        }
        return node.children ? walk(node.children, [...trail, node.id]) : false;
      });
    if (!walk(props.nodes, [])) return;
    setExpanded(new Set([...expandedSet.value, ...path]));
  },
  /** Whether a node id is currently expanded. */
  isExpanded: (id: string | number) => expandedSet.value.has(id),
  /** The ids currently expanded, in insertion order. */
  expandedIds: () => [...expandedSet.value],
});
</script>

<template>
  <div ref="el" v-show="!hidden" class="cui-tree-view" role="tree">
    <CuiTreeNode
      v-for="(node, idx) in nodes"
      :key="String(node.id)"
      :node="node"
      :depth="0"
      :is-last="idx === nodes.length - 1"
      :expanded="expandedSet"
      :selected-set="selectedSet"
      :selectable="selectable"
      :show-lines="showLines"
      :animated="animated"
      :cfg="cfg"
      @toggle-expand="onToggleExpand"
      @select-node="selectNode"
    >
      <template #node="slotProps">
        <slot name="node" v-bind="slotProps" />
      </template>
    </CuiTreeNode>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import CuiTreeNode from "./CuiTreeNode.vue";

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

export interface CuiTreeViewProps {
  /** Tree data */
  nodes: TreeNode[];
  /** Selected node id(s) — string/number for single, array for multiple */
  modelValue?: string | number | (string | number)[] | null;
  /** Allow multiple selection */
  multiple?: boolean;
  /** Initially expanded node ids */
  defaultExpanded?: (string | number)[];
  /** Expand all nodes by default */
  expandAll?: boolean;
  /** Show connecting lines */
  showLines?: boolean;
  /** Selectable nodes (false = expand only, no selection) */
  selectable?: boolean;
  /** Animate expand/collapse */
  animated?: boolean;
  /** Size */
  size?: "sm" | "md" | "lg";
  /** Hidden */
  hidden?: boolean;
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
  "node-click": [node: TreeNode];
  "node-expand": [node: TreeNode, expanded: boolean];
}>();

// Expanded state
const expanded = ref(new Set<string | number>(props.defaultExpanded ?? []));

// If expandAll, populate on mount
if (props.expandAll) {
  function collectIds(nodes: TreeNode[]) {
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        expanded.value.add(node.id);
        collectIds(node.children);
      }
    }
  }
  collectIds(props.nodes);
}

// Selected state
const selectedSet = computed(() => {
  if (props.modelValue == null) return new Set<string | number>();
  if (Array.isArray(props.modelValue)) return new Set(props.modelValue);
  return new Set([props.modelValue]);
});

function toggleExpand(node: TreeNode) {
  const next = new Set(expanded.value);
  const isExpanded = next.has(node.id);
  isExpanded ? next.delete(node.id) : next.add(node.id);
  expanded.value = next;
  emit("node-expand", node, !isExpanded);
}

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

const sizeConfig: Record<string, { fontSize: string; iconSize: string; indent: string; padding: string }> = {
  sm: { fontSize: "0.8125rem", iconSize: "0.75rem", indent: "1rem", padding: "0.1875rem 0.375rem" },
  md: { fontSize: "0.875rem", iconSize: "0.875rem", indent: "1.25rem", padding: "0.25rem 0.5rem" },
  lg: { fontSize: "0.9375rem", iconSize: "1rem", indent: "1.5rem", padding: "0.375rem 0.625rem" },
};
const cfg = computed(() => sizeConfig[props.size]);
</script>

<template>
  <div v-show="!hidden" role="tree">
    <CuiTreeNode
      v-for="node in nodes"
      :key="String(node.id)"
      :node="node"
      :depth="0"
      :expanded="expanded"
      :selected-set="selectedSet"
      :selectable="selectable"
      :show-lines="showLines"
      :animated="animated"
      :cfg="cfg"
      @toggle-expand="toggleExpand"
      @select-node="selectNode"
    >
      <template #node="slotProps">
        <slot name="node" v-bind="slotProps" />
      </template>
    </CuiTreeNode>
  </div>
</template>

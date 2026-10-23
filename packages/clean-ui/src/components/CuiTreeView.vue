<script setup lang="ts">
import { ref, computed, watch, nextTick, useTemplateRef } from "vue";
import CuiTreeNode from "./CuiTreeNode.vue";
import type { HideableProps, SizeableProps } from "../types/common";
import { scaleDensity, scaleControlHeight, clampSize } from "../utils/sizing";
import { useListNavigation } from "../composables/useListNavigation";

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

export interface CuiTreeViewProps extends HideableProps, SizeableProps {
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

/**
 * The tree as the keyboard sees it: every item currently *visible*, in the order
 * a user tabs through them. Arrow keys cross depth boundaries — Down from the
 * last child of one branch lands on the next uncle — so this has to be a flat
 * projection of the nested data filtered by what is expanded, not a per-node
 * walk. It lives here because CuiTreeView owns `expandedSet`; the recursive
 * CuiTreeNode has no view of its siblings, let alone its parent's.
 */
interface VisibleItem {
  node: TreeNode;
  depth: number;
  parentId: string | number | null;
  hasChildren: boolean;
}

const visibleItems = computed<VisibleItem[]>(() => {
  const out: VisibleItem[] = [];
  const walk = (nodes: TreeNode[], depth: number, parentId: string | number | null) => {
    for (const node of nodes) {
      const hasChildren = !!node.children && node.children.length > 0;
      out.push({ node, depth, parentId, hasChildren });
      if (hasChildren && expandedSet.value.has(node.id)) walk(node.children!, depth + 1, node.id);
    }
  };
  walk(props.nodes, 0, null);
  return out;
});

const focusableItems = computed(() => visibleItems.value.filter((item) => !item.node.disabled));

// Roving focus: ONE tab stop for the whole tree. A `tabindex="0"` per node would
// add a tab stop per node — 200 of them in a 200-node tree — which is the thing
// the roving pattern exists to avoid.
const focusedId = ref<string | number | null>(null);

/** The item that currently carries `tabindex="0"`. */
const activeId = computed<string | number | null>(() => {
  const items = focusableItems.value;
  if (items.length === 0) return null;
  // Falls back to the first focusable item so the tree is reachable by Tab
  // before it has ever been focused, and recovers if the focused node is
  // collapsed away or removed from `nodes`.
  if (focusedId.value == null || !items.some((item) => item.node.id === focusedId.value)) {
    return items[0].node.id;
  }
  return focusedId.value;
});

function elementFor(id: string | number): HTMLElement | null {
  const items = el.value?.querySelectorAll<HTMLElement>('[role="treeitem"]');
  for (const candidate of items ?? []) {
    if (candidate.dataset.cuiTreeId === String(id)) return candidate;
  }
  return null;
}

function focusItem(id: string | number | null) {
  if (id == null) return;
  focusedId.value = id;
  nextTick(() => elementFor(id)?.focus());
}

/** `id`, or the closest of its ancestors that isn't disabled; null if there is none. */
function enabledAncestor(id: string | number | null): string | number | null {
  const byId = new Map(visibleItems.value.map((v) => [v.node.id, v]));
  for (let at = id == null ? undefined : byId.get(id); at; at = at.parentId == null ? undefined : byId.get(at.parentId)) {
    if (!at.node.disabled) return at.node.id;
  }
  return null;
}

function currentItem(): VisibleItem | undefined {
  return visibleItems.value.find((item) => item.node.id === activeId.value);
}

// Up/Down/Home/End and type-ahead through the visible, non-disabled items: the shared
// index maths (#289). No wrap; Left and Right are the tree's own (expand, collapse, step
// in and out), handled below.
const nav = useListNavigation({ typeahead: () => true });

/**
 * Into an open parent: the first focusable item inside it, the one after it in order. A
 * disabled first child is skipped, and an expanded one's own children count. Nothing when
 * every one is disabled: the next item would be outside it.
 */
function focusFirstChild(id: string | number) {
  const items = focusableItems.value;
  const next = items[items.findIndex((item) => item.node.id === id) + 1];
  if (next && isInside(next, id)) focusItem(next.node.id);
}

function isInside(item: VisibleItem, ancestor: string | number): boolean {
  const parentOf = new Map(visibleItems.value.map((v) => [v.node.id, v.parentId]));
  for (let p = item.parentId; p != null; p = parentOf.get(p) ?? null) if (p === ancestor) return true;
  return false;
}

/** The roving focus's move for `e`, if it is one. */
function navigate(e: KeyboardEvent): boolean {
  const items = focusableItems.value;
  const from = items.findIndex((item) => item.node.id === activeId.value);
  const to = nav.indexForKey(e, from, { count: items.length, label: (i) => items[i].node.label });
  if (to === null || to < 0) return false;
  focusItem(items[to].node.id);
  return true;
}

function onTreeKeydown(e: KeyboardEvent) {
  const item = currentItem();
  if (!item) return;
  const { node, hasChildren, parentId } = item;
  const isExpanded = expandedSet.value.has(node.id);

  switch (e.key) {
    case "ArrowRight":
      e.preventDefault();
      // Collapsed parent opens; already-open parent steps into its first child;
      // a leaf does nothing.
      if (hasChildren && !isExpanded) setNodeExpanded(node.id, true);
      else if (hasChildren && isExpanded) focusFirstChild(node.id);
      break;
    case "ArrowLeft":
      e.preventDefault();
      // Open parent closes; anything else steps out to its parent, or the nearest enabled
      // one above it: a disabled node can't take focus, and naming it would leave the tab
      // stop on another node than the one with focus (#390).
      if (hasChildren && isExpanded) setNodeExpanded(node.id, false);
      else focusItem(enabledAncestor(parentId));
      break;
    case "Enter":
    case " ":
      e.preventDefault();
      // Exactly what a click on the row does, so the two never diverge.
      if (hasChildren && !props.selectable) onToggleExpand(node);
      else selectNode(node);
      break;
    case "*": {
      e.preventDefault();
      // Expand every sibling at this level, per the APG tree pattern. Not a disabled one,
      // which nothing could then collapse (#390).
      const siblings = visibleItems.value.filter((i) => i.parentId === parentId && i.hasChildren && !i.node.disabled);
      if (siblings.length) {
        setExpanded(new Set([...expandedSet.value, ...siblings.map((i) => i.node.id)]));
      }
      break;
    }
    default:
      if (navigate(e)) e.preventDefault();
      // A letter matching nothing is still the tree's: it mustn't scroll or reach the page.
      // (The modifier rule is useListNavigation's: those keys are someone else's.)
      else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) e.preventDefault();
  }
}

/** Pointer and keyboard share one notion of "current", so Tab resumes where the mouse left off. */
function onNodeFocused(id: string | number) {
  focusedId.value = id;
}

// A collapse can hide the focused node; move focus to its nearest visible
// ancestor rather than letting it fall off the tree onto <body>.
watch(visibleItems, () => {
  if (focusedId.value == null) return;
  if (!focusableItems.value.some((item) => item.node.id === focusedId.value)) {
    focusedId.value = activeId.value;
  }
});

// `hitSize` is the chevron's clickable box, floored at 24px (WCAG 2.5.8) by
// scaleControlHeight — the same floor CuiButton/CuiInput use. It's deliberately
// independent of `iconSize`, which stays the glyph's visual size: at sm the caret
// still draws at 12px, inside a 24px target.
const SUPPORTED_SIZES = ["sm", "md", "lg"] as const;
const sizeConfig: Record<(typeof SUPPORTED_SIZES)[number], { fontSize: string; iconSize: string; hitSize: string; indent: string; padY: string; padX: string }> = {
  sm: { fontSize: "0.8125rem", iconSize: "0.75rem", hitSize: scaleControlHeight("0.75rem"), indent: scaleDensity("1rem"), padY: scaleDensity("0.1875rem"), padX: scaleDensity("0.375rem") },
  md: { fontSize: "0.875rem", iconSize: "0.875rem", hitSize: scaleControlHeight("0.875rem"), indent: scaleDensity("1.25rem"), padY: scaleDensity("0.25rem"), padX: scaleDensity("0.5rem") },
  lg: { fontSize: "0.9375rem", iconSize: "1rem", hitSize: scaleControlHeight("1rem"), indent: scaleDensity("1.5rem"), padY: scaleDensity("0.375rem"), padX: scaleDensity("0.625rem") },
};
const cfg = computed(() => sizeConfig[clampSize(props.size, SUPPORTED_SIZES)]);

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
  <div
    ref="el"
    v-show="!hidden"
    class="cui-tree-view"
    role="tree"
    :aria-multiselectable="multiple || undefined"
    @keydown="onTreeKeydown"
  >
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
      :active-id="activeId"
      :size-of-set="nodes.length"
      :position-in-set="idx + 1"
      @toggle-expand="onToggleExpand"
      @select-node="selectNode"
      @node-focused="onNodeFocused"
    >
      <template #node="slotProps">
        <slot name="node" v-bind="slotProps" />
      </template>
    </CuiTreeNode>
  </div>
</template>

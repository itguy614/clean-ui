<script setup lang="ts">
import { computed, ref, watch, nextTick } from "vue";
import { useCollapsible } from "../composables/useCollapsible";
import CuiIcon from "./CuiIcon.vue";
import type { TreeNode } from "./CuiTreeView.vue";

const props = defineProps<{
  node: TreeNode;
  depth: number;
  isLast: boolean;
  expanded: Set<string | number>;
  selectedSet: Set<string | number>;
  selectable: boolean;
  showLines: boolean;
  animated: boolean;
  cfg: { fontSize: string; iconSize: string; hitSize: string; indent: string; padY: string; padX: string };
  /** The single item carrying `tabindex="0"` — roving focus is owned by CuiTreeView. */
  activeId: string | number | null;
  /** aria-setsize / aria-posinset for this node among its siblings. */
  sizeOfSet: number;
  positionInSet: number;
}>();

const emit = defineEmits<{
  "toggle-expand": [node: TreeNode];
  "select-node": [node: TreeNode];
  "node-focused": [id: string | number];
}>();

const hasChildren = computed(() => props.node.children && props.node.children.length > 0);
const isActive = computed(() => props.activeId === props.node.id);
const isExpanded = computed(() => props.expanded.has(props.node.id));
const isSelected = computed(() => props.selectedSet.has(props.node.id));

// Children are mounted the first time the node opens, and kept: a collapse is a grid row
// going 1fr -> 0fr and then the group is hidden (until-found, else inert), so nothing in a
// shut branch is focusable or in the accessibility tree, and the rows animate both ways.
// A branch never opened isn't rendered at all, which keeps a large tree cheap, and means
// find-in-page only reaches branches that have been opened.
const mounted = ref(isExpanded.value);
// What the group's open class follows. It trails the first mount by a drawn frame: an
// element created already open has nothing to transition from.
const groupOpen = ref(isExpanded.value);
watch(isExpanded, async (expanded) => {
  if (expanded && !mounted.value) {
    mounted.value = true;
    await nextTick();
    void group.value?.offsetHeight;
  }
  groupOpen.value = expanded;
});
const { panel: group, hiddenAttr, inertAttr, onBeforeMatch } = useCollapsible(
  () => isExpanded.value,
  () => emit("toggle-expand", props.node),
);

function onChevronClick(e: Event) {
  e.stopPropagation();
  if (props.node.disabled) return;
  emit("toggle-expand", props.node);
}

function onNodeClick() {
  // A disabled node does nothing, in either mode: selecting was already blocked, but in
  // expand-only mode a click still opened or closed it (#390).
  if (props.node.disabled) return;
  emit("node-focused", props.node.id);
  if (hasChildren.value && !props.selectable) {
    emit("toggle-expand", props.node);
  } else {
    emit("select-node", props.node);
  }
}

// Line positioning helpers
const pad = computed(() => props.cfg.padX);
const lineColor = "var(--cui-border-strong, var(--cui-border))";
</script>

<template>
  <div
    class="cui-tree-node"
    role="treeitem"
    :data-cui-tree-id="String(node.id)"
    :tabindex="node.disabled ? undefined : isActive ? 0 : -1"
    :aria-expanded="hasChildren ? isExpanded : undefined"
    :aria-selected="selectable ? isSelected : undefined"
    :aria-disabled="node.disabled || undefined"
    :aria-level="depth + 1"
    :aria-setsize="sizeOfSet"
    :aria-posinset="positionInSet"
    :style="{ position: 'relative', outline: 'none' }"
    @focusin.self="emit('node-focused', node.id)"
  >
    <!--
      Parent's vertical continuation line — extends full height of this treeitem
      so siblings appear connected. Last sibling doesn't draw this.
    -->
    <div
      v-if="showLines && depth > 0 && !isLast"
      :style="{
        position: 'absolute',
        left: `calc((${depth} - 1) * ${cfg.indent} + ${pad} + 0.5rem)`,
        top: '0',
        bottom: '0',
        width: '0',
        borderLeft: `1px solid ${lineColor}`,
        zIndex: '0',
      }"
    />

    <!--
      L-connector for last sibling — vertical line stops at row midpoint
    -->
    <div
      v-if="showLines && depth > 0 && isLast"
      :style="{
        position: 'absolute',
        left: `calc((${depth} - 1) * ${cfg.indent} + ${pad} + 0.5rem)`,
        top: '0',
        height: `calc(${cfg.padY} + 0.625em)`,
        width: '0',
        borderLeft: `1px solid ${lineColor}`,
        zIndex: '0',
      }"
    />

    <!-- Horizontal branch connecting to parent's vertical line -->
    <div
      v-if="showLines && depth > 0"
      :style="{
        position: 'absolute',
        left: `calc((${depth} - 1) * ${cfg.indent} + ${pad} + 0.5rem)`,
        top: `calc(${cfg.padY} + 0.625em)`,
        width: `calc(${cfg.indent} * 0.5)`,
        height: '0',
        borderTop: `1px solid ${lineColor}`,
        zIndex: '0',
      }"
    />

    <!-- Node row -->
    <div
      class="cui-tree-node__row"
      :style="{
        display: 'flex',
        alignItems: 'center',
        gap: 'calc(0.25rem * var(--cui-density-scale, 1))',
        paddingTop: cfg.padY,
        paddingRight: cfg.padX,
        paddingBottom: cfg.padY,
        paddingLeft: `calc(${pad} + ${depth} * ${cfg.indent})`,
        fontSize: cfg.fontSize,
        cursor: node.disabled ? 'default' : 'pointer',
        borderRadius: '0.25rem',
        background: isSelected ? 'var(--cui-primary-bg)' : 'transparent',
        color: node.disabled ? 'var(--cui-text-tertiary)' : isSelected ? 'var(--cui-primary)' : 'var(--cui-text-body)',
        fontWeight: isSelected ? '600' : '400',
        opacity: node.disabled ? '0.5' : '1',
        position: 'relative',
        zIndex: '1',
      }"
      @click="onNodeClick"
    >
      <!-- Expand/collapse chevron. The box is cfg.hitSize (>= 24px), not the
           glyph size, so the caret stays visually small but is tappable. Leaf
           nodes render the same box empty, which keeps labels aligned and every
           row the same height. -->
      <div
        class="cui-tree-node__chevron"
        :style="{
          width: cfg.hitSize,
          height: cfg.hitSize,
          marginLeft: `calc((${cfg.iconSize} - ${cfg.hitSize}) / 2)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: '0',
          transition: 'transform var(--cui-duration-slow) var(--cui-ease-in-out)',
          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
        }"
        @click="hasChildren && onChevronClick($event)"
      >
        <CuiIcon v-if="hasChildren" name="caret-right" :size="cfg.iconSize" :style="{ color: 'var(--cui-text-tertiary)' }" />
      </div>

      <!-- Node icon -->
      <CuiIcon
        v-if="node.icon"
        :name="node.icon"
        :size="cfg.iconSize"
        :style="{ flexShrink: '0', color: isSelected ? 'var(--cui-primary)' : 'var(--cui-text-secondary)' }"
      />

      <!-- Node content -->
      <div :style="{ flex: '1', minWidth: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }">
        <slot name="node" :node="node" :selected="isSelected" :expanded="isExpanded" :depth="depth">
          {{ node.label }}
        </slot>
      </div>
    </div>

    <!-- Children (recursive) -->
    <div
      v-if="hasChildren && mounted"
      ref="group"
      class="cui-tree-node__group"
      :class="{
        'cui-tree-node__group--open': groupOpen,
        'cui-tree-node__group--animated': animated,
      }"
      role="group"
      :hidden.attr="hiddenAttr"
      :inert.attr="inertAttr"
      @beforematch="onBeforeMatch"
    >
      <div class="cui-tree-node__clip">
        <CuiTreeNode
          v-for="(child, idx) in node.children"
          :key="String(child.id)"
          :node="child"
          :depth="depth + 1"
          :is-last="idx === (node.children!.length - 1)"
          :expanded="expanded"
          :selected-set="selectedSet"
          :selectable="selectable"
          :show-lines="showLines"
          :animated="animated"
          :cfg="cfg"
          :active-id="activeId"
          :size-of-set="node.children!.length"
          :position-in-set="idx + 1"
          @toggle-expand="emit('toggle-expand', $event)"
          @select-node="emit('select-node', $event)"
          @node-focused="emit('node-focused', $event)"
        >
          <template #node="slotProps: any">
            <slot name="node" v-bind="slotProps" />
          </template>
        </CuiTreeNode>
      </div>
    </div>
  </div>
</template>

<style scoped>
/*
  The focus ring goes on the ROW, not on the element that holds it. `treeitem`
  has to sit on the outer node — it is what contains the child `group`, per the
  ARIA tree pattern — but that element wraps the entire subtree, so an outline on
  it would draw a box around every descendant. Outlining the row instead marks
  exactly the item that has focus.
*/
.cui-tree-node:focus-visible > .cui-tree-node__row {
  outline: 2px solid var(--cui-primary-focus-ring);
  outline-offset: -2px;
  border-radius: 0.25rem;
}

/* The collapse: one grid row, 0fr -> 1fr, with the clip shrinking inside it. The row
   transitions only when the tree is `animated`. */
.cui-tree-node__group {
  position: relative;
  display: grid;
  grid-template-rows: 0fr;
}

.cui-tree-node__group--open {
  grid-template-rows: 1fr;
}

.cui-tree-node__group--animated {
  transition: grid-template-rows var(--cui-duration-slow) var(--cui-ease-out);
}

.cui-tree-node__group[inert] {
  visibility: hidden;
}

.cui-tree-node__clip {
  min-height: 0;
  overflow: hidden;
}
</style>

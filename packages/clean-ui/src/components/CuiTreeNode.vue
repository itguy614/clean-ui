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
  /** The glyph size, for CuiIcon. Every other size reaches the stylesheet as `--_tree-view-*`, from the root. */
  iconSize: string;
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
  groupOpen.value = isExpanded.value;
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

// The one value a row needs that the root can't give it: how deep it is. Indent and the
// connector lines are `calc()`s of it in the stylesheet.
const depthVars = computed(() => ({ "--_tree-view-depth": String(props.depth) }));
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
    :style="depthVars"
    @focusin.self="emit('node-focused', node.id)"
  >
    <!--
      Parent's vertical continuation line — extends full height of this treeitem
      so siblings appear connected. Last sibling doesn't draw this.
    -->
    <div v-if="showLines && depth > 0 && !isLast" class="cui-tree-node__line cui-tree-node__line--through" />

    <!--
      L-connector for last sibling — vertical line stops at row midpoint
    -->
    <div v-if="showLines && depth > 0 && isLast" class="cui-tree-node__line cui-tree-node__line--elbow" />

    <!-- Horizontal branch connecting to parent's vertical line -->
    <div v-if="showLines && depth > 0" class="cui-tree-node__line cui-tree-node__line--branch" />

    <!-- Node row -->
    <div
      class="cui-tree-node__row"
      :class="{ 'cui-tree-node__row--selected': isSelected, 'cui-tree-node__row--disabled': node.disabled }"
      @click="onNodeClick"
    >
      <!-- Expand/collapse chevron. The box is the hit size (>= 24px), not the
           glyph size, so the caret stays visually small but is tappable. Leaf
           nodes render the same box empty, which keeps labels aligned and every
           row the same height. -->
      <div
        class="cui-tree-node__chevron"
        :class="{ 'cui-tree-node__chevron--expanded': isExpanded }"
        @click="hasChildren && onChevronClick($event)"
      >
        <CuiIcon v-if="hasChildren" class="cui-tree-node__caret" name="caret-right" :size="iconSize" />
      </div>

      <!-- Node icon -->
      <CuiIcon
        v-if="node.icon"
        class="cui-tree-node__icon"
        :name="node.icon"
        :size="iconSize"
      />

      <!-- Node content -->
      <div class="cui-tree-node__content">
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
          :icon-size="iconSize"
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
  Themeable paint (#468): every rule that reads a token is a whole-compound :where(), so
  a consumer's plain class rule or a `--cui-tree-view-<slot>` on a container wins without
  !important. CuiTreeView emits the size scale as private `--_tree-view-*` properties on
  its root; this node adds only its depth. Layout stays at normal specificity. A row is
  crossed by the keyboard, so none of its colours transition.
*/
.cui-tree-node {
  position: relative;
  outline: none;
}

/* Connector lines. `through` is a parent's continuation, `elbow` stops at the row's
   midpoint for a last sibling, `branch` runs across to the parent's line. */
.cui-tree-node__line {
  position: absolute;
  left: calc((var(--_tree-view-depth) - 1) * var(--_tree-view-indent) + var(--cui-tree-view-px, var(--_tree-view-px)) + 0.5rem);
  width: 0;
  z-index: 0;
}

.cui-tree-node__line--through {
  top: 0;
  bottom: 0;
  border-left-width: 1px;
  border-left-style: solid;
}

.cui-tree-node__line--elbow {
  top: 0;
  height: calc(var(--cui-tree-view-py, var(--_tree-view-py)) + 0.625em);
  border-left-width: 1px;
  border-left-style: solid;
}

.cui-tree-node__line--branch {
  top: calc(var(--cui-tree-view-py, var(--_tree-view-py)) + 0.625em);
  width: calc(var(--_tree-view-indent) * 0.5);
  height: 0;
  border-top-width: 1px;
  border-top-style: solid;
}

:where(.cui-tree-node__line--through, .cui-tree-node__line--elbow) {
  border-left-color: var(--cui-tree-view-border, var(--cui-border-strong, var(--cui-border)));
}

:where(.cui-tree-node__line--branch) {
  border-top-color: var(--cui-tree-view-border, var(--cui-border-strong, var(--cui-border)));
}

.cui-tree-node__row {
  display: flex;
  align-items: center;
  position: relative;
  z-index: 1;
  cursor: pointer;
}

.cui-tree-node__row--disabled {
  cursor: default;
  opacity: 0.5;
}

.cui-tree-node__row--selected {
  font-weight: 600;
}

:where(.cui-tree-node__row) {
  gap: var(--cui-tree-view-gap, var(--_tree-view-gap));
  padding-top: var(--cui-tree-view-py, var(--_tree-view-py));
  padding-right: var(--cui-tree-view-px, var(--_tree-view-px));
  padding-bottom: var(--cui-tree-view-py, var(--_tree-view-py));
  padding-left: calc(var(--cui-tree-view-px, var(--_tree-view-px)) + var(--_tree-view-depth) * var(--_tree-view-indent));
  font-size: var(--cui-tree-view-font-size, var(--_tree-view-font-size));
  font-weight: 400;
  border-radius: var(--cui-tree-view-radius, var(--_tree-view-radius));
  background: var(--cui-tree-view-bg, transparent);
  color: var(--cui-tree-view-color, var(--cui-text-body));
}

/* Selected is the toggle's "on" state: the subtle tint, never the hero colour. */
:where(.cui-tree-node__row--selected) {
  background: var(--cui-tree-view-pressed-bg, var(--cui-primary-bg));
  color: var(--cui-tree-view-pressed-color, var(--cui-primary));
}

/* After selected, so a disabled selected row is still dimmed text on the tint. */
:where(.cui-tree-node__row--disabled) {
  color: var(--cui-tree-view-color, var(--cui-text-tertiary));
}

/* The expand/collapse box is the hit size, not the glyph's. */
.cui-tree-node__chevron {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform var(--cui-duration-slow) var(--cui-ease-in-out);
  transform: rotate(0deg);
}

.cui-tree-node__chevron--expanded {
  transform: rotate(90deg);
}

:where(.cui-tree-node__chevron) {
  width: var(--cui-tree-view-height, var(--_tree-view-height));
  height: var(--cui-tree-view-height, var(--_tree-view-height));
  margin-left: calc((var(--_tree-view-icon-size) - var(--cui-tree-view-height, var(--_tree-view-height))) / 2);
}

:where(.cui-tree-node__caret) {
  color: var(--cui-text-tertiary);
}

:where(.cui-tree-node__icon) {
  color: var(--cui-text-secondary);
}

:where(.cui-tree-node__row--selected .cui-tree-node__icon) {
  color: var(--cui-primary);
}

.cui-tree-node__content {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/*
  The focus ring goes on the ROW, not on the element that holds it. `treeitem`
  has to sit on the outer node — it is what contains the child `group`, per the
  ARIA tree pattern — but that element wraps the entire subtree, so an outline on
  it would draw a box around every descendant. Outlining the row instead marks
  exactly the item that has focus.
*/
:where(.cui-tree-node:focus-visible > .cui-tree-node__row) {
  outline: 2px solid var(--cui-tree-view-focus-ring, var(--cui-primary-focus-ring));
  outline-offset: -2px;
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

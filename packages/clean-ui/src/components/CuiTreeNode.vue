<script setup lang="ts">
import { computed, ref, watch, nextTick } from "vue";
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
  cfg: { fontSize: string; iconSize: string; indent: string; padding: string };
}>();

const emit = defineEmits<{
  "toggle-expand": [node: TreeNode];
  "select-node": [node: TreeNode];
}>();

const hasChildren = computed(() => props.node.children && props.node.children.length > 0);
const isExpanded = computed(() => props.expanded.has(props.node.id));
const isSelected = computed(() => props.selectedSet.has(props.node.id));

// Animation
const childrenRef = ref<HTMLElement | null>(null);
const animHeight = ref<string | undefined>(undefined);
const showChildren = ref(isExpanded.value);

watch(isExpanded, (expanded) => {
  if (!props.animated) {
    showChildren.value = expanded;
    return;
  }

  if (expanded) {
    showChildren.value = true;
    animHeight.value = "0px";
    nextTick(() => {
      if (childrenRef.value) {
        animHeight.value = childrenRef.value.scrollHeight + "px";
        setTimeout(() => { animHeight.value = undefined; }, 250);
      }
    });
  } else {
    if (childrenRef.value) {
      animHeight.value = childrenRef.value.scrollHeight + "px";
      requestAnimationFrame(() => {
        animHeight.value = "0px";
        setTimeout(() => { showChildren.value = false; animHeight.value = undefined; }, 250);
      });
    }
  }
});

function onChevronClick(e: Event) {
  e.stopPropagation();
  emit("toggle-expand", props.node);
}

function onNodeClick() {
  if (hasChildren.value && !props.selectable) {
    emit("toggle-expand", props.node);
  } else {
    emit("select-node", props.node);
  }
}

// Line positioning helpers
const pad = computed(() => props.cfg.padding.split(' ')[1] || props.cfg.padding.split(' ')[0]);
const lineColor = "var(--cui-border-strong, var(--cui-border))";
</script>

<template>
  <div
    role="treeitem"
    :aria-expanded="hasChildren ? isExpanded : undefined"
    :style="{ position: 'relative' }"
  >
    <!--
      Parent's vertical continuation line — extends full height of this treeitem
      so siblings appear connected. Last sibling doesn't draw this.
    -->
    <div
      v-if="showLines && depth > 0 && !isLast"
      :style="{
        position: 'absolute',
        left: `calc(${(depth - 1) * parseFloat(cfg.indent)}rem + ${pad} + 0.5rem)`,
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
        left: `calc(${(depth - 1) * parseFloat(cfg.indent)}rem + ${pad} + 0.5rem)`,
        top: '0',
        height: `calc(${cfg.padding.split(' ')[0]} + 0.625em)`,
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
        left: `calc(${(depth - 1) * parseFloat(cfg.indent)}rem + ${pad} + 0.5rem)`,
        top: `calc(${cfg.padding.split(' ')[0]} + 0.625em)`,
        width: `calc(${parseFloat(cfg.indent) * 0.5}rem)`,
        height: '0',
        borderTop: `1px solid ${lineColor}`,
        zIndex: '0',
      }"
    />

    <!-- Node row -->
    <div
      :style="{
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        paddingTop: cfg.padding.split(' ')[0],
        paddingRight: cfg.padding.split(' ')[1] || cfg.padding.split(' ')[0],
        paddingBottom: cfg.padding.split(' ')[0],
        paddingLeft: `calc(${pad} + ${depth * parseFloat(cfg.indent)}rem)`,
        fontSize: cfg.fontSize,
        cursor: node.disabled ? 'default' : 'pointer',
        borderRadius: '0.25rem',
        background: isSelected ? 'var(--cui-primary-bg)' : 'transparent',
        color: node.disabled ? 'var(--cui-text-tertiary)' : isSelected ? 'var(--cui-primary)' : 'var(--cui-text-body)',
        fontWeight: isSelected ? '600' : '400',
        opacity: node.disabled ? '0.5' : '1',
        transition: 'background 0.1s ease',
        position: 'relative',
        zIndex: '1',
      }"
      @click="onNodeClick"
    >
      <!-- Expand/collapse chevron -->
      <div
        :style="{
          width: cfg.iconSize,
          height: cfg.iconSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: '0',
          transition: 'transform 0.15s ease',
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
      v-if="hasChildren && showChildren"
      ref="childrenRef"
      :style="{
        position: 'relative',
        overflow: animated ? 'hidden' : undefined,
        maxHeight: animHeight,
        transition: animated ? 'max-height 0.25s ease' : undefined,
      }"
    >
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
        @toggle-expand="emit('toggle-expand', $event)"
        @select-node="emit('select-node', $event)"
      >
        <template #node="slotProps: any">
          <slot name="node" v-bind="slotProps" />
        </template>
      </CuiTreeNode>
    </div>
  </div>
</template>

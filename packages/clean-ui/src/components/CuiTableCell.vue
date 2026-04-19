<script setup lang="ts">
import { computed, inject } from "vue";
import { TableSectionContextKey } from "./table-context";

export type TableCellAlign = "left" | "center" | "right";

export interface CuiTableCellProps {
  /** Explicit override: force <th> or <td> */
  header?: boolean;
  /** Text alignment */
  align?: TableCellAlign;
  /** CSS width */
  width?: string;
  /** HTML colspan */
  colspan?: number;
  /** HTML rowspan */
  rowspan?: number;
  /** Prevent text wrapping */
  nowrap?: boolean;
  /** Hide the component */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiTableCellProps>(), {
  align: "left",
  nowrap: false,
  hidden: false,
});

const section = inject(TableSectionContextKey, undefined);

const isHeader = computed(() => {
  if (props.header !== undefined) return props.header;
  return section?.isHead ?? false;
});

const tag = computed(() => (isHeader.value ? "th" : "td"));

const cellStyle = computed(() => {
  const s: Record<string, string> = {};
  if (props.align !== "left") s.textAlign = props.align;
  if (props.width) s.width = props.width;
  if (props.nowrap) s.whiteSpace = "nowrap";
  return s;
});
</script>

<template>
  <component
    :is="tag"
    v-show="!hidden"
    :style="cellStyle"
    :colspan="colspan"
    :rowspan="rowspan"
    :scope="isHeader ? 'col' : undefined"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { CuiTable, CuiTableHead, CuiTableBody, CuiTableRow, CuiTableCell } from "@itguy614/clean-ui";

export interface PropRow {
  name: string;
  type: string;
  default?: string;
  description: string;
}

defineProps<{
  props: PropRow[];
}>();
</script>

<template>
  <CuiTable size="sm" hoverable>
    <CuiTableHead>
      <CuiTableRow>
        <CuiTableCell>Prop</CuiTableCell>
        <CuiTableCell>Type</CuiTableCell>
        <CuiTableCell>Default</CuiTableCell>
        <CuiTableCell>Description</CuiTableCell>
      </CuiTableRow>
    </CuiTableHead>
    <CuiTableBody>
      <CuiTableRow v-for="prop in props" :key="prop.name">
        <CuiTableCell nowrap>
          <code class="cui-code" style="font-size: 0.8125rem;">{{ prop.name }}</code>
        </CuiTableCell>
        <CuiTableCell>
          <code class="cui-code" style="font-size: 0.8125rem;">{{ prop.type }}</code>
        </CuiTableCell>
        <CuiTableCell>
          <code v-if="prop.default" class="cui-code" style="font-size: 0.8125rem;">{{ prop.default }}</code>
          <span v-else style="color: var(--cui-text-tertiary);">—</span>
        </CuiTableCell>
        <CuiTableCell>{{ prop.description }}</CuiTableCell>
      </CuiTableRow>
    </CuiTableBody>
  </CuiTable>
</template>

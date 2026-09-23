<script setup lang="ts">
import { CuiTable, CuiTableHead, CuiTableBody, CuiTableRow, CuiTableCell } from "@itguy614/clean-ui";
import type { TokenRow } from "../meta/types";

defineProps<{
  tokens: TokenRow[];
}>();
</script>

<template>
  <CuiTable size="sm" hoverable>
    <CuiTableHead>
      <CuiTableRow>
        <CuiTableCell>Custom property</CuiTableCell>
        <CuiTableCell>Default</CuiTableCell>
        <CuiTableCell>Description</CuiTableCell>
      </CuiTableRow>
    </CuiTableHead>
    <CuiTableBody>
      <CuiTableRow v-for="t in tokens" :key="t.name">
        <CuiTableCell nowrap>
          <code class="cui-code" style="font-size: 0.8125rem;">{{ t.name }}</code>
        </CuiTableCell>
        <CuiTableCell nowrap>
          <code class="cui-code" style="font-size: 0.8125rem;">{{ t.default }}</code>
        </CuiTableCell>
        <CuiTableCell>{{ t.description }}</CuiTableCell>
      </CuiTableRow>
    </CuiTableBody>
  </CuiTable>
</template>

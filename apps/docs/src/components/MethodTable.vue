<script setup lang="ts">
import { CuiTable, CuiTableHead, CuiTableBody, CuiTableRow, CuiTableCell } from "@itguy614/clean-ui";
import type { MethodRow } from "../meta/types";

defineProps<{
  methods: MethodRow[];
}>();
</script>

<template>
  <CuiTable size="sm" hoverable>
    <CuiTableHead>
      <CuiTableRow>
        <CuiTableCell>Method</CuiTableCell>
        <CuiTableCell>Signature</CuiTableCell>
        <CuiTableCell>Description</CuiTableCell>
      </CuiTableRow>
    </CuiTableHead>
    <CuiTableBody>
      <CuiTableRow v-for="method in methods" :key="method.name">
        <CuiTableCell nowrap>
          <code class="cui-code" style="font-size: 0.8125rem;">{{ method.name }}</code>
        </CuiTableCell>
        <CuiTableCell nowrap>
          <code class="cui-code" style="font-size: 0.8125rem;">{{ method.signature }}</code>
        </CuiTableCell>
        <CuiTableCell>{{ method.description }}</CuiTableCell>
      </CuiTableRow>
    </CuiTableBody>
  </CuiTable>
</template>

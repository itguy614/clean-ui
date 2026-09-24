<script setup lang="ts">
import { CuiTable, CuiTableHead, CuiTableBody, CuiTableRow, CuiTableCell } from "@itguy614/clean-ui";
import type { SlotRow } from "../meta/types";

defineProps<{
  slots: SlotRow[];
}>();
</script>

<template>
  <CuiTable size="sm" hoverable>
    <CuiTableHead>
      <CuiTableRow>
        <CuiTableCell>Slot</CuiTableCell>
        <CuiTableCell>Slot props</CuiTableCell>
        <CuiTableCell>Description</CuiTableCell>
      </CuiTableRow>
    </CuiTableHead>
    <CuiTableBody>
      <CuiTableRow v-for="s in slots" :key="s.name">
        <CuiTableCell nowrap>
          <code class="cui-code" style="font-size: 0.8125rem;">{{ s.name }}</code>
        </CuiTableCell>
        <CuiTableCell>
          <code v-if="s.payload" class="cui-code" style="font-size: 0.8125rem;">{{ s.payload }}</code>
          <span v-else style="color: var(--cui-text-tertiary);">—</span>
        </CuiTableCell>
        <CuiTableCell>{{ s.description }}</CuiTableCell>
      </CuiTableRow>
    </CuiTableBody>
  </CuiTable>
</template>

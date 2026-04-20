<script setup lang="ts">
import { CuiTable, CuiTableHead, CuiTableBody, CuiTableRow, CuiTableCell } from "@itguy614/clean-ui";

export interface EventRow {
  name: string;
  payload: string;
  description: string;
}

defineProps<{
  events: EventRow[];
}>();
</script>

<template>
  <CuiTable size="sm" hoverable>
    <CuiTableHead>
      <CuiTableRow>
        <CuiTableCell>Event</CuiTableCell>
        <CuiTableCell>Payload</CuiTableCell>
        <CuiTableCell>Description</CuiTableCell>
      </CuiTableRow>
    </CuiTableHead>
    <CuiTableBody>
      <CuiTableRow v-for="event in events" :key="event.name">
        <CuiTableCell nowrap>
          <code class="cui-code" style="font-size: 0.8125rem;">{{ event.name }}</code>
        </CuiTableCell>
        <CuiTableCell>
          <code class="cui-code" style="font-size: 0.8125rem;">{{ event.payload }}</code>
        </CuiTableCell>
        <CuiTableCell>{{ event.description }}</CuiTableCell>
      </CuiTableRow>
    </CuiTableBody>
  </CuiTable>
</template>

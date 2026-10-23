<script setup lang="ts">
import { ref } from "vue";
import { CuiButton, CuiDataGrid, CuiModal, CuiSlideover, CuiToastProvider } from "@itguy614/clean-ui";

const columns = [
  { key: "name", label: "Name", sortable: true },
  { key: "role", label: "Role" },
];
const data = [
  { id: 1, name: "Alice", role: "Dev" },
  { id: 2, name: "Bob", role: "Ops" },
];
const modal = ref(false);
const sheet = ref(false);
</script>

<template>
  <CuiToastProvider>
    <CuiButton @click="modal = true">Open modal</CuiButton>
    <CuiButton @click="sheet = true">Open slideover</CuiButton>
    <CuiDataGrid :columns="columns" :data="data" />
    <CuiModal v-model:visible="modal" title="Modal">Body</CuiModal>
    <CuiSlideover v-model:visible="sheet" title="Slideover">Body</CuiSlideover>
  </CuiToastProvider>
</template>

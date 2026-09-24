<script setup lang="ts">
import { inject, computed } from "vue";
import { ShowDebugKey } from "../keys";
import { CuiGrid, CuiGridItem } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/grid-item";

const showDebugRef = inject(ShowDebugKey);
const showDebug = computed(() => showDebugRef?.value ?? false);
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiGrid :cols=&quot;3&quot; gap=&quot;4&quot;>
  <CuiGridItem :col-span=&quot;2&quot;>
    <div>Spans 2 columns</div>
  </CuiGridItem>
  <div>Normal</div>
</CuiGrid>`"
      >
        <CuiGrid :cols="3" gap="4" :debug="showDebug">
          <CuiGridItem :col-span="2">
            <div class="rounded-lg bg-success-500 p-4 text-white">Spans 2 columns</div>
          </CuiGridItem>
          <div class="rounded-lg bg-success-500 p-4 text-white">Normal</div>
        </CuiGrid>
      </Example>
    </template>
  </DocPage>
</template>

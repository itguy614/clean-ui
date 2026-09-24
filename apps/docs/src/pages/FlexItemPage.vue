<script setup lang="ts">
import { inject, computed } from "vue";
import { ShowDebugKey } from "../keys";
import { CuiFlex, CuiFlexItem } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/flex-item";

const showDebugRef = inject(ShowDebugKey);
const showDebug = computed(() => showDebugRef?.value ?? false);
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiFlex gap=&quot;4&quot;>
  <div>Fixed width</div>
  <CuiFlexItem flex=&quot;1&quot;>
    <div>Grows to fill space</div>
  </CuiFlexItem>
  <div>Fixed width</div>
</CuiFlex>`"
      >
        <CuiFlex gap="4" :debug="showDebug">
          <div class="rounded-lg bg-primary-500 p-4 text-white">Fixed width</div>
          <CuiFlexItem flex="1">
            <div class="rounded-lg bg-primary-500 p-4 text-white">Grows to fill space</div>
          </CuiFlexItem>
          <div class="rounded-lg bg-primary-500 p-4 text-white">Fixed width</div>
        </CuiFlex>
      </Example>
    </template>
  </DocPage>
</template>

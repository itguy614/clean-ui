<script setup lang="ts">
import { CuiFlex, CuiFlexItem } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/flex-item";
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
        <CuiFlex gap="4">
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

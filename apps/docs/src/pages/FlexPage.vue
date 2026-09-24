<script setup lang="ts">
import { inject, computed } from "vue";
import { ShowDebugKey } from "../keys";
import { CuiFlex, CuiStack } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/flex";

const showDebugRef = inject(ShowDebugKey);
const showDebug = computed(() => showDebugRef?.value ?? false);
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiFlex gap=&quot;4&quot;>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</CuiFlex>`"
      >
        <CuiFlex gap="4" :debug="showDebug">
          <div class="rounded-lg bg-primary-500 p-4 text-white">Item 1</div>
          <div class="rounded-lg bg-primary-500 p-4 text-white">Item 2</div>
          <div class="rounded-lg bg-primary-500 p-4 text-white">Item 3</div>
        </CuiFlex>
      </Example>
    </template>

    <template #examples>
      <Example
        title="Vertical Flex"
        :code="`<CuiFlex direction=&quot;col&quot; gap=&quot;4&quot;>
<div>Item 1</div>
<div>Item 2</div>
</CuiFlex>`"
      >
        <CuiFlex direction="col" gap="4" :debug="showDebug">
          <div class="rounded-lg bg-info-500 p-4 text-white">Item 1</div>
          <div class="rounded-lg bg-info-500 p-4 text-white">Item 2</div>
          <div class="rounded-lg bg-info-500 p-4 text-white">Item 3</div>
        </CuiFlex>
      </Example>

      <Example
        title="Cross-axis alignment (align)"
        :code="`<CuiFlex align=&quot;center&quot; gap=&quot;4&quot;>
<div>Short</div>
<div>Tall item</div>
</CuiFlex>`"
      >
        <CuiFlex align="center" gap="4" :debug="showDebug">
          <div class="rounded-lg bg-success-500 p-2 text-white">Short</div>
          <div class="rounded-lg bg-success-500 p-6 text-white">Tall item</div>
          <div class="rounded-lg bg-success-500 p-4 text-white">Medium</div>
        </CuiFlex>
      </Example>

      <Example
        title="Main-axis distribution (justify)"
        :code="`<CuiFlex justify=&quot;between&quot; gap=&quot;4&quot;>
<div>Item 1</div>
<div>Item 2</div>
<div>Item 3</div>
</CuiFlex>`"
      >
        <CuiFlex justify="between" gap="4" :debug="showDebug">
          <div class="rounded-lg bg-warning-500 p-4 text-white">Item 1</div>
          <div class="rounded-lg bg-warning-500 p-4 text-white">Item 2</div>
          <div class="rounded-lg bg-warning-500 p-4 text-white">Item 3</div>
        </CuiFlex>
      </Example>
    </template>
  </DocPage>
</template>

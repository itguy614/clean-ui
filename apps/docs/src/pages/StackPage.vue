<script setup lang="ts">
import { CuiStack } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/stack";
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiStack spacing=&quot;4&quot;>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</CuiStack>`"
      >
        <CuiStack spacing="4">
          <div class="rounded-lg bg-primary-500 p-3 text-white">Item 1</div>
          <div class="rounded-lg bg-primary-500 p-3 text-white">Item 2</div>
          <div class="rounded-lg bg-primary-500 p-3 text-white">Item 3</div>
        </CuiStack>
      </Example>
    </template>

    <template #examples>
      <Example
        title="Horizontal Stack"
        :code="`<CuiStack orientation=&quot;horizontal&quot; spacing=&quot;3&quot;>
<div>Item 1</div>
<div>Item 2</div>
</CuiStack>`"
      >
        <CuiStack orientation="horizontal" spacing="3">
          <div class="rounded-lg bg-info-500 p-3 text-white">Item 1</div>
          <div class="rounded-lg bg-info-500 p-3 text-white">Item 2</div>
          <div class="rounded-lg bg-info-500 p-3 text-white">Item 3</div>
        </CuiStack>
      </Example>
    </template>
  </DocPage>
</template>

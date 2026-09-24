<script setup lang="ts">
import { inject, computed } from "vue";
import { ShowDebugKey } from "../keys";
import { CuiFlex, CuiSpacer, CuiStack } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/spacer";

const showDebugRef = inject(ShowDebugKey);
const showDebug = computed(() => showDebugRef?.value ?? false);
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiFlex>
  <div>Left</div>
  <CuiSpacer />
  <div>Right</div>
</CuiFlex>`"
      >
        <CuiFlex gap="4" :debug="showDebug" class="rounded-lg bg-surface-200 p-4 dark:bg-surface-800">
          <div class="rounded-lg bg-error-500 p-3 text-white">Left</div>
          <CuiSpacer />
          <div class="rounded-lg bg-error-500 p-3 text-white">Right</div>
        </CuiFlex>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-sm text-surface-700 dark:text-surface-300">
        The spacer is an empty <code>&lt;div&gt;</code> carrying <code>aria-hidden="true"</code>,
        so it never appears in the accessibility tree. That matters because a screen reader
        otherwise reports an unlabelled element between the two things it separates, and
        spacing should not be something a user has to step over.
      </p>
    </template>

    <template #examples>
      <Example
        title="Fixed Size Spacer"
        :code="`<CuiFlex>
<div>Item 1</div>
<CuiSpacer size=&quot;20&quot; />
<div>Item 2</div>
</CuiFlex>`"
      >
        <CuiFlex gap="4" :debug="showDebug" class="rounded-lg bg-surface-200 p-4 dark:bg-surface-800">
          <div class="rounded-lg bg-warning-500 p-3 text-white">Item 1</div>
          <CuiSpacer size="20" />
          <div class="rounded-lg bg-warning-500 p-3 text-white">Item 2</div>
        </CuiFlex>
      </Example>
    </template>
  </DocPage>
</template>

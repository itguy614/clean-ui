<script setup lang="ts">
import { ref } from "vue";
import { CuiCard, CuiCardHeader, CuiCardBody, CuiButton, CuiCodeBlock } from "@itguy614/clean-ui";

defineProps<{
  title?: string;
  code?: string;
}>();

const showCode = ref(false);
</script>

<template>
  <CuiCard variant="outline">
    <CuiCardHeader v-if="title" :title="title">
      <template #actions>
        <CuiButton
          v-if="code"
          variant="ghost"
          size="xs"
          @click="showCode = !showCode"
        >
          {{ showCode ? "Hide Code" : "Show Code" }}
        </CuiButton>
      </template>
    </CuiCardHeader>

    <!-- Preview -->
    <CuiCardBody>
      <slot />
    </CuiCardBody>

    <!-- Code -->
    <CuiCodeBlock
      v-if="code && showCode"
      :code="code"
      language="vue"
      :copyable="true"
      size="sm"
      :style="{ borderRadius: '0', borderLeft: 'none', borderRight: 'none', borderBottom: 'none' }"
    />
  </CuiCard>
</template>

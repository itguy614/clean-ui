<script setup lang="ts">
import { ref } from "vue";
import { CuiCard, CuiCardHeader, CuiCardBody, CuiButton, CuiCodeBlock } from "@itguy614/clean-ui";
import { slug } from "../utils/slug";

const props = withDefaults(
  defineProps<{
    title?: string;
    code?: string;
    /** Start with the code visible — for the canonical usage example at the top of a page. */
    codeOpen?: boolean;
  }>(),
  { codeOpen: false },
);

const showCode = ref(props.codeOpen);
</script>

<template>
  <CuiCard variant="outline">
    <!-- A real <h3>, not CuiCardHeader's `title` prop: that renders a <div>, so every
         example title on every page was invisible both to `PageNav` and to anyone
         navigating by heading. Passing the heading through the default slot keeps the
         header's layout and its #actions area. -->
    <CuiCardHeader v-if="title">
      <h3 :id="slug(title)" class="text-[1.0625rem] font-semibold leading-snug text-[var(--cui-text-emphasis)]">
        {{ title }}
      </h3>
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

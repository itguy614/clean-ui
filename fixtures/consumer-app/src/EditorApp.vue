<script setup lang="ts">
import { ref } from "vue";
import { CuiButton, CuiIcon } from "@itguy614/clean-ui";
import { CuiMarkdownEditor } from "@itguy614/clean-ui-editor";

const content = ref("# Hello\n\nStart typing **markdown**…");
</script>

<template>
  <!-- clean-ui is a peer: the page uses it in both builds, so the baseline carries clean-ui's
       own base cost (CuiIcon's built-in icons among it) and the delta is what the editor adds. -->
  <CuiButton @click="content = ''">
    <template #prefix><CuiIcon name="caret-down" /></template>
    Clear
  </CuiButton>
  <CuiMarkdownEditor v-model="content" placeholder="Write something…" />
</template>

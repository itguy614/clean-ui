<script setup lang="ts">
import { createMarkdownRenderAdapter, CuiMarkdownViewer } from "@itguy614/clean-ui-editor/render";

const adapter = createMarkdownRenderAdapter();
const source = "# Changelog\n\n- **Fixed:** the `/render` subpath no longer ships CodeMirror.";
</script>

<template>
  <CuiMarkdownViewer :model-value="source" :adapter="adapter" />
</template>

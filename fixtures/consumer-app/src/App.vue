<script setup lang="ts">
import { CuiButton, CuiIcon, useTheme, version } from "@itguy614/clean-ui";

const { theme, setTheme } = useTheme();
</script>

<template>
  <main style="padding: 2rem">
    <p>clean-ui version: {{ version }}</p>
    <p>theme: {{ theme }}</p>
    <CuiButton @click="setTheme('forest')">
      <template #prefix><CuiIcon name="caret-down" /></template>
      Hello from a packed tarball
    </CuiButton>
  </main>
</template>

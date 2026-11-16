<script setup lang="ts">
import { IconCaretDown } from "@itguy614/clean-ui/icons/generated/caret-down";
import { CuiButton, CuiIcon, useTheme, version } from "@itguy614/clean-ui";

const { theme, setTheme } = useTheme();
</script>

<template>
  <main style="padding: 2rem">
    <p>clean-ui version: {{ version }}</p>
    <p>theme: {{ theme }}</p>
    <CuiButton @click="setTheme('forest')">
      <template #prefix><CuiIcon :icon="IconCaretDown" /></template>
      Hello from a packed tarball
    </CuiButton>
  </main>
</template>

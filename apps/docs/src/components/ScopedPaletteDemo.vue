<script setup lang="ts">
import { ref } from "vue";
import { CuiButton, CuiCommandPalette, CuiFlex, CuiKbd, useCommandPaletteProvider } from "@itguy614/clean-ui";

// This component's subtree gets a registry of its own: the palette below reads it, and the
// page's palette, which reads the default one, never sees these commands.
const scoped = useCommandPaletteProvider();
const lastRan = ref("(nothing yet)");

scoped.register([
  { id: "scoped.one", label: "Scoped command one", group: "scoped", action: () => (lastRan.value = "Scoped command one") },
  { id: "scoped.two", label: "Scoped command two", group: "scoped", action: () => (lastRan.value = "Scoped command two") },
]);
</script>

<template>
  <CuiFlex gap="3" align="center" wrap="wrap">
    <CuiButton variant="outline" @click="scoped.open()">Open the scoped palette</CuiButton>
    <span>
      or press <CuiKbd>Ctrl</CuiKbd> <CuiKbd>J</CuiKbd> (<CuiKbd>⌘</CuiKbd> <CuiKbd>J</CuiKbd> on a Mac)
    </span>
  </CuiFlex>
  <p style="margin: 0.75rem 0 0">Last run: {{ lastRan }}</p>
  <CuiCommandPalette hotkey="mod+j" label="Scoped command palette" :groups="[{ id: 'scoped', label: 'Scoped' }]" />
</template>

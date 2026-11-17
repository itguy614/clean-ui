<script setup lang="ts">
import { inject, ref } from "vue";
import { useRouter } from "vue-router";
import {
  CuiCommandPalette,
  useColorMode,
  useCommandPalette,
  useTheme,
  type CuiCommand,
  type CuiCommandGroup,
} from "@itguy614/clean-ui";
import { ShowDebugKey } from "../keys";
import { PAGES } from "../navigation/pages";

// The docs site's one command palette (#531): mounted once, in the app shell, so every route has
// it. It reads the default registry, which is also what the header button's `useCommandPalette()`
// opens. The Command Palette page's demo gives itself a scoped registry and another shortcut, so
// this palette keeps Mod-K on that page too.
const router = useRouter();
const colorMode = useColorMode();
const { theme, presets, setTheme } = useTheme();
const palette = useCommandPalette();
const showDebug = inject(ShowDebugKey, ref(false));

// Actions first, then one group per navigation group, in the order the sidebar lists them.
const pageGroups = [...new Set(PAGES.map((p) => p.group))];
const groups: CuiCommandGroup[] = [
  { id: "site", label: "Site", priority: 1000 },
  { id: "theme", label: "Theme", priority: 999 },
  ...pageGroups.map((id, i): CuiCommandGroup => ({ id, label: id, priority: pageGroups.length - i })),
];

palette.register(
  PAGES.map(
    (page): CuiCommand => ({
      id: `go.${page.id}`,
      label: page.label,
      description: page.group,
      keywords: page.keywords,
      group: page.group,
      icon: "file-text",
      action: () => void router.push(page.path),
    }),
  ),
);

// A getter, so labels and icons follow the color mode, the debug switch and the current theme.
palette.register(() => [
  {
    id: "site.color-mode",
    label: "Toggle color mode",
    description: colorMode.isDark.value ? "Switch to light" : "Switch to dark",
    keywords: ["dark", "light", "appearance", "night"],
    group: "site",
    icon: colorMode.isDark.value ? "sun" : "moon",
    action: () => colorMode.toggle(),
  },
  {
    id: "site.debug",
    label: showDebug.value ? "Hide debug overlays" : "Show debug overlays",
    keywords: ["grid", "layout", "outline"],
    group: "site",
    icon: "eye",
    action: () => (showDebug.value = !showDebug.value),
  },
  ...presets.map(
    (preset): CuiCommand => ({
      id: `site.theme.${preset.id}`,
      label: `${preset.label} theme`,
      description: preset.id === theme.value ? "Current theme" : undefined,
      keywords: ["theme", "color", "preset"],
      group: "theme",
      icon: "palette",
      action: () => setTheme(preset.id),
    }),
  ),
]);
</script>

<template>
  <CuiCommandPalette :groups="groups" :max-results="200" :recent="3" label="Search documentation" />
</template>

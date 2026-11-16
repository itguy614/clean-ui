<script setup lang="ts">
import { computed, useTemplateRef } from "vue";
import {
  CuiBadge,
  CuiList,
  CuiListItem,
  CuiSidebar,
  CuiSidebarContent,
  CuiSidebarGroup,
  CuiSidebarHeader,
} from "@itguy614/clean-ui";
import versionRaw from "../../../../packages/clean-ui-editor/package.json?raw";

/** Whether the mobile drawer is open (`v-model:open`): the header's menu button drives it. */
const open = defineModel<boolean>("open", { default: false });

// The header's menu button binds these (aria-expanded, aria-controls and the translated menu
// name) instead of hard-coding them.
const sidebar = useTemplateRef("sidebar");
defineExpose({ toggleAttrs: computed(() => sidebar.value?.toggleAttrs) });

const version = JSON.parse(versionRaw).version as string;

const sections = [
  { id: "overview", label: "Overview", path: "/" },
  { id: "installation", label: "Installation", path: "/installation" },
  { id: "editor", label: "Editor", path: "/editor" },
];

// Three guides are the one set that earns a collapsible group; the rest are single pages, so
// they stand alone rather than each sitting under a heading of one.
const guides = [
  { id: "plugins", label: "Plugin Authoring", path: "/guides/plugins" },
  { id: "integration", label: "Integration & Testing", path: "/guides/integration" },
  { id: "accessibility", label: "Accessibility & Mobile", path: "/guides/accessibility" },
];
</script>

<template>
  <CuiSidebar ref="sidebar" v-model:open="open" label="Documentation" :toggle="false" :style="{ width: '100%' }">
    <CuiSidebarHeader title="Clean UI Editor" subtitle="Markdown Editor for Vue">
      <template #suffix><CuiBadge color="primary" size="sm">v{{ version }}</CuiBadge></template>
    </CuiSidebarHeader>

    <CuiSidebarContent>
      <CuiList>
        <CuiListItem v-for="section in sections" :key="section.id" :to="section.path" :title="section.label" />
      </CuiList>

      <!-- Opens on mount when the current page is one of its guides. -->
      <CuiSidebarGroup label="Guides">
        <CuiList>
          <CuiListItem v-for="guide in guides" :key="guide.id" :to="guide.path" :title="guide.label" />
        </CuiList>
      </CuiSidebarGroup>
    </CuiSidebarContent>
  </CuiSidebar>
</template>

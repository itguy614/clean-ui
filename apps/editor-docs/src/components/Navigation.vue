<script setup lang="ts">
import { CuiBadge } from "@itguy614/clean-ui";
import versionRaw from "../../../../packages/clean-ui-editor/package.json?raw";

defineEmits<{ navigate: [] }>();

const version = JSON.parse(versionRaw).version as string;

const sections = [
  { id: "overview", label: "Overview", path: "/", group: "Getting Started" },
  { id: "installation", label: "Installation", path: "/installation", group: "Getting Started" },

  { id: "editor", label: "Editor", path: "/editor", group: "Reference" },

  { id: "plugins", label: "Plugin Authoring", path: "/guides/plugins", group: "Guides" },
  { id: "integration", label: "Integration & Testing", path: "/guides/integration", group: "Guides" },
  { id: "accessibility", label: "Accessibility & Mobile", path: "/guides/accessibility", group: "Guides" },
];

const groupedSections = sections.reduce((acc, section) => {
  if (!acc[section.group]) {
    acc[section.group] = [];
  }
  acc[section.group].push(section);
  return acc;
}, {} as Record<string, typeof sections>);
</script>

<template>
  <nav
    class="cui-scrollbar bg-surface-50 dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800"
    :style="{ height: '100%', overflowY: 'auto', padding: '1.5rem' }"
  >
    <div style="margin-bottom: 1.5rem;">
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--cui-text-emphasis);">Clean UI Editor</h2>
        <CuiBadge color="primary" size="sm">v{{ version }}</CuiBadge>
      </div>
      <p style="margin-top: 0.25rem; font-size: 0.875rem; color: var(--cui-text-secondary);">Markdown Editor for Vue</p>
    </div>

    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      <div v-for="(items, group) in groupedSections" :key="group">
        <h3 :style="{ marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--cui-text-tertiary)' }">
          {{ group }}
        </h3>
        <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.125rem;">
          <li v-for="section in items" :key="section.id">
            <router-link
              :to="section.path"
              :class="[
                'block w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
                'text-surface-700 hover:bg-surface-200 dark:text-surface-300 dark:hover:bg-surface-800'
              ]"
              active-class="[color:var(--cui-primary-text)]! [background:var(--cui-primary-solid,var(--cui-primary))] hover:[background:var(--cui-primary-solid-hover,var(--cui-primary-hover))]"
              @click="$emit('navigate')"
            >
              {{ section.label }}
            </router-link>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

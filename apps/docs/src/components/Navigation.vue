<script setup lang="ts">
defineEmits<{ navigate: [] }>();

const sections = [
  // Getting Started
  { id: "overview", label: "Overview", path: "/", group: "Getting Started" },
  { id: "installation", label: "Installation", path: "/installation", group: "Getting Started" },

  // Foundations (alphabetical)
  { id: "colors", label: "Colors", path: "/foundations/colors", group: "Foundations" },
  { id: "icons", label: "Icons", path: "/foundations/icons", group: "Foundations" },
  { id: "themes", label: "Themes", path: "/foundations/themes", group: "Foundations" },
  { id: "typography", label: "Typography", path: "/foundations/typography", group: "Foundations" },

  // Layout (alphabetical)
  { id: "container", label: "Container", path: "/components/container", group: "Layout" },
  { id: "divider", label: "Divider", path: "/components/divider", group: "Layout" },
  { id: "flex", label: "Flex", path: "/components/flex", group: "Layout" },
  { id: "flex-item", label: "Flex Item", path: "/components/flex-item", group: "Layout" },
  { id: "grid", label: "Grid", path: "/components/grid", group: "Layout" },
  { id: "grid-item", label: "Grid Item", path: "/components/grid-item", group: "Layout" },
  { id: "resizable-panels", label: "Resizable Panels", path: "/components/resizable-panels", group: "Layout" },
  { id: "spacer", label: "Spacer", path: "/components/spacer", group: "Layout" },
  { id: "stack", label: "Stack", path: "/components/stack", group: "Layout" },

  // Form Controls (alphabetical)
  { id: "checkbox", label: "Checkbox", path: "/components/checkbox", group: "Form Controls" },
  { id: "color-picker", label: "Color Picker", path: "/components/color-picker", group: "Form Controls" },
  { id: "combobox", label: "Combobox", path: "/components/combobox", group: "Form Controls" },
  { id: "date-picker", label: "Date Picker", path: "/components/date-picker", group: "Form Controls" },
  { id: "date-range-picker", label: "Date Range", path: "/components/date-range-picker", group: "Form Controls" },
  { id: "fieldset", label: "Fieldset", path: "/components/fieldset", group: "Form Controls" },
  { id: "file-upload", label: "File Upload", path: "/components/file-upload", group: "Form Controls" },
  { id: "form-field", label: "Form Field", path: "/components/form-field", group: "Form Controls" },
  { id: "input", label: "Input", path: "/components/input", group: "Form Controls" },
  { id: "input-stepper", label: "Input Stepper", path: "/components/input-stepper", group: "Form Controls" },
  { id: "masked-input", label: "Masked Input", path: "/components/masked-input", group: "Form Controls" },
  { id: "radio", label: "Radio", path: "/components/radio", group: "Form Controls" },
  { id: "rating", label: "Rating", path: "/components/rating", group: "Form Controls" },
  { id: "select", label: "Select", path: "/components/select", group: "Form Controls" },
  { id: "slider", label: "Slider", path: "/components/slider", group: "Form Controls" },
  { id: "tag-input", label: "Tag Input", path: "/components/tag-input", group: "Form Controls" },
  { id: "textarea", label: "Textarea", path: "/components/textarea", group: "Form Controls" },
  { id: "time-picker", label: "Time Picker", path: "/components/time-picker", group: "Form Controls" },
  { id: "toggle", label: "Toggle", path: "/components/toggle", group: "Form Controls" },
  { id: "transfer-list", label: "Transfer List", path: "/components/transfer-list", group: "Form Controls" },

  // Actions (alphabetical)
  { id: "button", label: "Button", path: "/components/button", group: "Actions" },
  { id: "button-group", label: "Button Group", path: "/components/button-group", group: "Actions" },
  { id: "copy-button", label: "Copy Button", path: "/components/copy-button", group: "Actions" },

  // Feedback (alphabetical)
  { id: "alert", label: "Alert", path: "/components/alert", group: "Feedback" },
  { id: "banner", label: "Banner", path: "/components/banner", group: "Feedback" },
  { id: "empty-state", label: "Empty State", path: "/components/empty-state", group: "Feedback" },
  { id: "skeleton", label: "Skeleton", path: "/components/skeleton", group: "Feedback" },
  { id: "spinner", label: "Spinner", path: "/components/spinner", group: "Feedback" },
  { id: "toast", label: "Toast", path: "/components/toast", group: "Feedback" },

  // Data Display (alphabetical)
  { id: "accordion", label: "Accordion", path: "/components/accordion", group: "Data Display" },
  { id: "avatar", label: "Avatar", path: "/components/avatar", group: "Data Display" },
  { id: "badge", label: "Badge", path: "/components/badge", group: "Data Display" },
  { id: "card", label: "Card", path: "/components/card", group: "Data Display" },
  { id: "code-block", label: "Code Block", path: "/components/code-block", group: "Data Display" },
  { id: "data-grid", label: "Data Grid", path: "/components/data-grid", group: "Data Display" },
  { id: "kbd", label: "Kbd", path: "/components/kbd", group: "Data Display" },
  { id: "progress", label: "Progress", path: "/components/progress", group: "Data Display" },
  { id: "table", label: "Table", path: "/components/table", group: "Data Display" },
  { id: "timeline", label: "Timeline", path: "/components/timeline", group: "Data Display" },
  { id: "tree-view", label: "Tree View", path: "/components/tree-view", group: "Data Display" },

  // Navigation (alphabetical)
  { id: "breadcrumb", label: "Breadcrumb", path: "/components/breadcrumb", group: "Navigation" },
  { id: "pagination", label: "Pagination", path: "/components/pagination", group: "Navigation" },
  { id: "stepper", label: "Stepper", path: "/components/stepper", group: "Navigation" },
  { id: "tabs", label: "Tabs", path: "/components/tabs", group: "Navigation" },

  // Overlay (alphabetical)
  { id: "confirm-dialog", label: "Confirm Dialog", path: "/components/confirm-dialog", group: "Overlay" },
  { id: "context-menu", label: "Context Menu", path: "/components/context-menu", group: "Overlay" },
  { id: "dropdown", label: "Dropdown", path: "/components/dropdown", group: "Overlay" },
  { id: "modal", label: "Modal", path: "/components/modal", group: "Overlay" },
  { id: "popover", label: "Popover", path: "/components/popover", group: "Overlay" },
  { id: "slideover", label: "Slideover", path: "/components/slideover", group: "Overlay" },
  { id: "tooltip", label: "Tooltip", path: "/components/tooltip", group: "Overlay" },
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
  <nav :style="{ height: '100%', overflowY: 'auto', padding: '1.5rem', background: 'var(--color-surface-50)' }">
    <div style="margin-bottom: 1.5rem;">
      <h2 style="font-size: 1.25rem; font-weight: 700;">Clean UI</h2>
      <p style="margin-top: 0.25rem; font-size: 0.875rem; color: var(--cui-text-secondary);">Vue Component Library</p>
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
              active-class="text-white [background:var(--cui-primary)] hover:[background:var(--cui-primary-hover)]"
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

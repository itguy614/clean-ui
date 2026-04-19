<script setup lang="ts">
const sections = [
  // Getting Started
  { id: "overview", label: "Overview", path: "/", group: "Getting Started" },
  { id: "installation", label: "Installation", path: "/installation", group: "Getting Started" },

  // Foundations
  { id: "icons", label: "Icons", path: "/foundations/icons", group: "Foundations" },
  { id: "colors", label: "Colors", path: "/foundations/colors", group: "Foundations" },
  { id: "themes", label: "Themes", path: "/foundations/themes", group: "Foundations" },
  { id: "typography", label: "Typography", path: "/foundations/typography", group: "Foundations" },

  // Layout
  { id: "grid", label: "Grid", path: "/components/grid", group: "Layout" },
  { id: "grid-item", label: "Grid Item", path: "/components/grid-item", group: "Layout" },
  { id: "flex", label: "Flex", path: "/components/flex", group: "Layout" },
  { id: "flex-item", label: "Flex Item", path: "/components/flex-item", group: "Layout" },
  { id: "stack", label: "Stack", path: "/components/stack", group: "Layout" },
  { id: "container", label: "Container", path: "/components/container", group: "Layout" },
  { id: "divider", label: "Divider", path: "/components/divider", group: "Layout" },
  { id: "resizable-panels", label: "Resizable Panels", path: "/components/resizable-panels", group: "Layout" },
  { id: "spacer", label: "Spacer", path: "/components/spacer", group: "Layout" },

  // Form Controls
  { id: "form-field", label: "Form Field", path: "/components/form-field", group: "Form Controls" },
  { id: "fieldset", label: "Fieldset", path: "/components/fieldset", group: "Form Controls" },
  { id: "input", label: "Input", path: "/components/input", group: "Form Controls" },
  { id: "masked-input", label: "Masked Input", path: "/components/masked-input", group: "Form Controls" },
  { id: "textarea", label: "Textarea", path: "/components/textarea", group: "Form Controls" },
  { id: "select", label: "Select", path: "/components/select", group: "Form Controls" },
  { id: "checkbox", label: "Checkbox", path: "/components/checkbox", group: "Form Controls" },
  { id: "combobox", label: "Combobox", path: "/components/combobox", group: "Form Controls" },
  { id: "color-picker", label: "Color Picker", path: "/components/color-picker", group: "Form Controls" },
  { id: "date-picker", label: "Date Picker", path: "/components/date-picker", group: "Form Controls" },
  { id: "date-range-picker", label: "Date Range", path: "/components/date-range-picker", group: "Form Controls" },
  { id: "file-upload", label: "File Upload", path: "/components/file-upload", group: "Form Controls" },
  { id: "radio", label: "Radio", path: "/components/radio", group: "Form Controls" },
  { id: "input-stepper", label: "Input Stepper", path: "/components/input-stepper", group: "Form Controls" },
  { id: "slider", label: "Slider", path: "/components/slider", group: "Form Controls" },
  { id: "tag-input", label: "Tag Input", path: "/components/tag-input", group: "Form Controls" },
  { id: "time-picker", label: "Time Picker", path: "/components/time-picker", group: "Form Controls" },
  { id: "toggle", label: "Toggle", path: "/components/toggle", group: "Form Controls" },
  { id: "transfer-list", label: "Transfer List", path: "/components/transfer-list", group: "Form Controls" },

  // Actions
  { id: "button", label: "Button", path: "/components/button", group: "Actions" },
  { id: "button-group", label: "Button Group", path: "/components/button-group", group: "Actions" },
  { id: "copy-button", label: "Copy Button", path: "/components/copy-button", group: "Actions" },

  // Feedback
  { id: "alert", label: "Alert", path: "/components/alert", group: "Feedback" },
  { id: "banner", label: "Banner", path: "/components/banner", group: "Feedback" },
  { id: "badge", label: "Badge", path: "/components/badge", group: "Feedback" },
  { id: "card", label: "Card", path: "/components/card", group: "Data Display" },
  { id: "accordion", label: "Accordion", path: "/components/accordion", group: "Data Display" },
  { id: "avatar", label: "Avatar", path: "/components/avatar", group: "Data Display" },
  { id: "progress", label: "Progress", path: "/components/progress", group: "Data Display" },
  { id: "data-grid", label: "Data Grid", path: "/components/data-grid", group: "Data Display" },
  { id: "table", label: "Table", path: "/components/table", group: "Data Display" },
  { id: "kbd", label: "Kbd", path: "/components/kbd", group: "Data Display" },
  { id: "timeline", label: "Timeline", path: "/components/timeline", group: "Data Display" },
  { id: "tree-view", label: "Tree View", path: "/components/tree-view", group: "Data Display" },
  { id: "breadcrumb", label: "Breadcrumb", path: "/components/breadcrumb", group: "Navigation" },
  { id: "pagination", label: "Pagination", path: "/components/pagination", group: "Navigation" },
  { id: "stepper", label: "Stepper", path: "/components/stepper", group: "Navigation" },
  { id: "tabs", label: "Tabs", path: "/components/tabs", group: "Navigation" },
  { id: "context-menu", label: "Context Menu", path: "/components/context-menu", group: "Overlay" },
  { id: "dropdown", label: "Dropdown", path: "/components/dropdown", group: "Overlay" },
  { id: "confirm-dialog", label: "Confirm Dialog", path: "/components/confirm-dialog", group: "Overlay" },
  { id: "modal", label: "Modal", path: "/components/modal", group: "Overlay" },
  { id: "popover", label: "Popover", path: "/components/popover", group: "Overlay" },
  { id: "slideover", label: "Slideover", path: "/components/slideover", group: "Overlay" },
  { id: "empty-state", label: "Empty State", path: "/components/empty-state", group: "Feedback" },
  { id: "skeleton", label: "Skeleton", path: "/components/skeleton", group: "Feedback" },
  { id: "spinner", label: "Spinner", path: "/components/spinner", group: "Feedback" },
  { id: "toast", label: "Toast", path: "/components/toast", group: "Feedback" },
  { id: "tooltip", label: "Tooltip", path: "/components/tooltip", group: "Feedback" },
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
  <nav class="h-full overflow-y-auto border-r border-surface-200 bg-surface-50 p-6 dark:border-surface-800 dark:bg-surface-900">
    <div class="mb-6">
      <h2 class="text-xl font-bold">Clean UI</h2>
      <p class="mt-1 text-sm text-surface-600 dark:text-surface-400">Vue Component Library</p>
    </div>

    <div class="space-y-6">
      <div v-for="(items, group) in groupedSections" :key="group">
        <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400">
          {{ group }}
        </h3>
        <ul class="space-y-1">
          <li v-for="section in items" :key="section.id">
            <router-link
              :to="section.path"
              :class="[
                'block w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
                'text-surface-700 hover:bg-surface-200 dark:text-surface-300 dark:hover:bg-surface-800'
              ]"
              active-class="text-white [background:var(--cui-primary)] hover:[background:var(--cui-primary-hover)]"
            >
              {{ section.label }}
            </router-link>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

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
import versionRaw from "../../../../VERSION?raw";

/** Whether the mobile drawer is open (`v-model:open`): the header's menu button drives it. */
const open = defineModel<boolean>("open", { default: false });

// The header's menu button binds these (aria-expanded, aria-controls and the translated menu
// name) instead of hard-coding them.
const sidebar = useTemplateRef("sidebar");
defineExpose({ toggleAttrs: computed(() => sidebar.value?.toggleAttrs) });

const version = versionRaw.trim();

const sections = [
  // Getting Started
  { id: "overview", label: "Overview", path: "/", group: "Getting Started" },
  { id: "installation", label: "Installation", path: "/installation", group: "Getting Started" },
  { id: "changelog", label: "Changelog", path: "/changelog", group: "Getting Started" },

  // Foundations (alphabetical)
  { id: "colors", label: "Colors", path: "/foundations/colors", group: "Foundations" },
  { id: "icons", label: "Icons", path: "/foundations/icons", group: "Foundations" },
  { id: "themes", label: "Themes", path: "/foundations/themes", group: "Foundations" },
  { id: "typography", label: "Typography", path: "/foundations/typography", group: "Foundations" },
  { id: "localization", label: "Localization", path: "/foundations/localization", group: "Foundations" },
  { id: "motion", label: "Motion", path: "/foundations/motion", group: "Foundations" },
  { id: "density", label: "Density", path: "/foundations/density", group: "Foundations" },
  { id: "utilities", label: "Utilities", path: "/foundations/utilities", group: "Foundations" },

  // Layout (alphabetical)
  { id: "container", label: "Container", path: "/components/container", group: "Layout" },
  { id: "divider", label: "Divider", path: "/components/divider", group: "Layout" },
  { id: "flex", label: "Flex", path: "/components/flex", group: "Layout" },
  { id: "flex-item", label: "Flex Item", path: "/components/flex-item", group: "Layout" },
  { id: "grid", label: "Grid", path: "/components/grid", group: "Layout" },
  { id: "grid-item", label: "Grid Item", path: "/components/grid-item", group: "Layout" },
  { id: "panel", label: "Panel", path: "/components/panel", group: "Layout" },
  { id: "resizable-panels", label: "Resizable Panels", path: "/components/resizable-panels", group: "Layout" },
  { id: "scroll-area", label: "Scroll Area", path: "/components/scroll-area", group: "Layout" },
  { id: "sidebar", label: "Sidebar", path: "/components/sidebar", group: "Layout" },
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
  { id: "form", label: "Form", path: "/components/form", group: "Form Controls" },
  { id: "form-field", label: "Form Field", path: "/components/form-field", group: "Form Controls" },
  { id: "input", label: "Input", path: "/components/input", group: "Form Controls" },
  { id: "input-stepper", label: "Input Stepper", path: "/components/input-stepper", group: "Form Controls" },
  { id: "masked-input", label: "Masked Input", path: "/components/masked-input", group: "Form Controls" },
  { id: "pin-input", label: "Pin Input", path: "/components/pin-input", group: "Form Controls" },
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
  { id: "toolbar", label: "Toolbar", path: "/components/toolbar", group: "Actions" },

  // Feedback (alphabetical)
  { id: "alert", label: "Alert", path: "/components/alert", group: "Feedback" },
  { id: "banner", label: "Banner", path: "/components/banner", group: "Feedback" },
  { id: "empty-state", label: "Empty State", path: "/components/empty-state", group: "Feedback" },
  { id: "skeleton", label: "Skeleton", path: "/components/skeleton", group: "Feedback" },
  { id: "spinner", label: "Spinner", path: "/components/spinner", group: "Feedback" },
  { id: "status-dot", label: "Status Dot", path: "/components/status-dot", group: "Feedback" },
  { id: "toast", label: "Toast", path: "/components/toast", group: "Feedback" },

  // Data Display (alphabetical)
  { id: "accordion", label: "Accordion", path: "/components/accordion", group: "Data Display" },
  { id: "avatar", label: "Avatar", path: "/components/avatar", group: "Data Display" },
  { id: "badge", label: "Badge", path: "/components/badge", group: "Data Display" },
  { id: "card", label: "Card", path: "/components/card", group: "Data Display" },
  { id: "code-block", label: "Code Block", path: "/components/code-block", group: "Data Display" },
  { id: "data-grid", label: "Data Grid", path: "/components/data-grid", group: "Data Display" },
  { id: "kbd", label: "Kbd", path: "/components/kbd", group: "Data Display" },
  { id: "list", label: "List", path: "/components/list", group: "Data Display" },
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

  // Composables (#296) — interaction, positioning, responsive, forms
  { id: "click-outside", label: "Click Outside", path: "/composables/click-outside", group: "Composables" },
  { id: "color-mode", label: "Color Mode", path: "/composables/color-mode", group: "Composables" },
  { id: "roving-focus", label: "Roving Focus", path: "/composables/roving-focus", group: "Composables" },
  { id: "locale", label: "Locale", path: "/composables/locale", group: "Composables" },
  { id: "overlay", label: "Overlay", path: "/composables/overlay", group: "Composables" },
  { id: "floating-panels", label: "Floating Panels", path: "/composables/floating-panels", group: "Composables" },
  { id: "scroll-shadows", label: "Scroll Shadows", path: "/composables/scroll-shadows", group: "Composables" },
  { id: "scroll-spy", label: "Scroll Spy", path: "/composables/scroll-spy", group: "Composables" },
  { id: "breakpoint", label: "Breakpoint & Layout Context", path: "/composables/breakpoint", group: "Composables" },
  { id: "color-scheme", label: "Color Scheme", path: "/composables/color-scheme", group: "Composables" },
  { id: "field-aria", label: "Field ARIA", path: "/composables/field-aria", group: "Composables" },
];

// Links outside any group stand alone at the top; everything else is a collapsible group.
const STANDALONE = "Getting Started";
const standalone = sections.filter((s) => s.group === STANDALONE);
const groups = Object.entries(
  sections
    .filter((s) => s.group !== STANDALONE)
    .reduce(
      (acc, section) => {
        (acc[section.group] ??= []).push(section);
        return acc;
      },
      {} as Record<string, typeof sections>,
    ),
).map(([label, items]) => ({ label, items }));
</script>

<template>
  <CuiSidebar ref="sidebar" v-model:open="open" label="Documentation" :toggle="false" :style="{ width: '100%' }">
    <CuiSidebarHeader title="Clean UI" subtitle="Vue Component Library">
      <template #suffix><CuiBadge color="primary" size="sm">v{{ version }}</CuiBadge></template>
    </CuiSidebarHeader>

    <CuiSidebarContent>
      <CuiList>
        <CuiListItem v-for="section in standalone" :key="section.id" :to="section.path" :title="section.label" />
      </CuiList>

      <!-- The group holding the current page opens by itself, and follows the route. -->
      <CuiSidebarGroup v-for="group in groups" :key="group.label" :label="group.label">
        <CuiList>
          <CuiListItem v-for="section in group.items" :key="section.id" :to="section.path" :title="section.label" />
        </CuiList>
      </CuiSidebarGroup>
    </CuiSidebarContent>
  </CuiSidebar>
</template>

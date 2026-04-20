<script setup lang="ts">
import { ref } from "vue";
import {
  CuiAvatar,
  CuiBadge,
  CuiCombobox,
  CuiFlex,
  CuiIcon,
  CuiStack,
  type ComboboxOption,
} from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import EventTable from "../components/EventTable.vue";
import Example from "../components/Example.vue";

// Simple options
const fruits: ComboboxOption[] = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "date", label: "Date" },
  { value: "elderberry", label: "Elderberry" },
  { value: "fig", label: "Fig" },
  { value: "grape", label: "Grape" },
  { value: "honeydew", label: "Honeydew" },
  { value: "kiwi", label: "Kiwi" },
  { value: "lemon", label: "Lemon" },
  { value: "mango", label: "Mango" },
  { value: "orange", label: "Orange" },
];
const selectedFruit = ref<string | null>(null);
const selectedFruits = ref<string[]>([]);

// Rich options with icons + descriptions
const techStack: ComboboxOption[] = [
  { value: "vue", label: "Vue.js", description: "Progressive JavaScript framework", icon: "code" },
  { value: "react", label: "React", description: "Library for building UIs", icon: "code" },
  { value: "angular", label: "Angular", description: "Platform for web applications", icon: "code" },
  { value: "svelte", label: "Svelte", description: "Cybernetically enhanced web apps", icon: "code" },
  { value: "nuxt", label: "Nuxt", description: "Vue framework for production", icon: "globe" },
  { value: "next", label: "Next.js", description: "React framework for production", icon: "globe" },
  { value: "tailwind", label: "Tailwind CSS", description: "Utility-first CSS framework", icon: "paint-brush" },
  { value: "typescript", label: "TypeScript", description: "Typed superset of JavaScript", icon: "file-ts" },
  { value: "vite", label: "Vite", description: "Next-generation build tool", icon: "lightning" },
  { value: "prisma", label: "Prisma", description: "Next-generation ORM for Node.js", icon: "database" },
];
const selectedTech = ref<string[]>([]);

// Users with avatars
const users: ComboboxOption[] = [
  { value: "1", label: "Alice Johnson", description: "Engineering", image: "https://i.pravatar.cc/64?u=alice" },
  { value: "2", label: "Bob Smith", description: "Design", image: "https://i.pravatar.cc/64?u=bob" },
  { value: "3", label: "Carol Williams", description: "Marketing", image: "https://i.pravatar.cc/64?u=carol" },
  { value: "4", label: "David Brown", description: "Sales", image: "https://i.pravatar.cc/64?u=david" },
  { value: "5", label: "Eva Martinez", description: "Support", image: "https://i.pravatar.cc/64?u=eva" },
  { value: "6", label: "Frank Lee", description: "Engineering", image: "https://i.pravatar.cc/64?u=frank" },
];
const selectedUser = ref<string | null>(null);
const selectedUsers = ref<string[]>([]);

// Simulated async search
const asyncResult = ref<string | null>(null);
async function fetchCountries(query: string): Promise<ComboboxOption[]> {
  const all = [
    "Afghanistan", "Albania", "Algeria", "Argentina", "Australia", "Austria", "Belgium",
    "Brazil", "Canada", "Chile", "China", "Colombia", "Croatia", "Denmark", "Egypt",
    "Finland", "France", "Germany", "Greece", "Hungary", "Iceland", "India", "Indonesia",
    "Ireland", "Israel", "Italy", "Japan", "Kenya", "Mexico", "Netherlands", "New Zealand",
    "Nigeria", "Norway", "Pakistan", "Peru", "Philippines", "Poland", "Portugal", "Romania",
    "Russia", "South Africa", "South Korea", "Spain", "Sweden", "Switzerland", "Thailand",
    "Turkey", "Ukraine", "United Kingdom", "United States", "Vietnam",
  ];
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 400));
  return all
    .filter((c) => c.toLowerCase().includes(query.toLowerCase()))
    .map((c) => ({ value: c.toLowerCase().replace(/\s/g, "-"), label: c }));
}
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Combobox</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        A searchable select with type-ahead filtering. Supports single and multiple selection,
        rich option rendering (icons, images, descriptions), async server-side search,
        and custom option templates via scoped slots.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'modelValue', type: 'string | number | array | null', default: 'null', description: 'Selected value(s)' },
          { name: 'options', type: 'ComboboxOption[]', default: '[]', description: 'Static options array' },
          { name: 'multiple', type: 'boolean', default: 'false', description: 'Allow multiple selection' },
          { name: 'fetchOptions', type: '(query) => Promise<Option[]>', default: '—', description: 'Async search function' },
          { name: 'debounce', type: 'number', default: '300', description: 'Debounce delay for search (ms)' },
          { name: 'minChars', type: 'number', default: '0', description: 'Min characters before searching' },
          { name: 'maxVisible', type: 'number', default: '8', description: 'Max visible items before scrolling' },
          { name: 'placeholder', type: 'string', default: 'Search...', description: 'Placeholder text' },
          { name: 'noResultsText', type: 'string', default: 'No results found', description: 'Text when no options match' },
          { name: 'size', type: 'sm | md | lg', default: 'md', description: 'Size' },
          { name: 'label', type: 'string', default: '—', description: 'Label text' },
          { name: 'error', type: 'boolean', default: 'false', description: 'Error state' },
          { name: 'errorMessage', type: 'string', default: '—', description: 'Error message' },
          { name: 'color', type: 'primary | secondary | success | error | warning | info', default: 'primary', description: 'Color role' },
          { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state' },
          { name: 'loading', type: 'boolean', default: 'false', description: 'External loading state' },
          { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the component' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Events</h2>
      <EventTable
        :events="[
          { name: 'update:modelValue', payload: 'string | number | Array | null', description: 'Fires when the selection changes (v-model)' },
          { name: 'search', payload: 'string', description: 'Fires on input change with the current search query' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic single -->
        <Example title="Single Select" :code="`<CuiCombobox v-model=&quot;value&quot; :options=&quot;fruits&quot; label=&quot;Fruit&quot; />`">
          <CuiFlex gap="4" class="items-start">
            <div style="width: 16rem;">
              <CuiCombobox v-model="selectedFruit" :options="fruits" label="Favorite Fruit" placeholder="Pick a fruit..." />
            </div>
            <div class="text-sm" style="color: var(--cui-text-secondary); padding-top: 1.5rem;">
              Selected: <code class="cui-code">{{ selectedFruit ?? 'null' }}</code>
            </div>
          </CuiFlex>
        </Example>

        <!-- Multiple -->
        <Example title="Multiple Select with Tags" :code="`<CuiCombobox v-model=&quot;values&quot; :options=&quot;fruits&quot; multiple />`">
          <CuiFlex gap="4" class="items-start">
            <div style="width: 20rem;">
              <CuiCombobox v-model="selectedFruits" :options="fruits" multiple label="Fruits" placeholder="Add fruits..." />
            </div>
            <div class="text-sm" style="color: var(--cui-text-secondary); padding-top: 1.5rem;">
              Selected: <code class="cui-code">{{ selectedFruits }}</code>
            </div>
          </CuiFlex>
        </Example>

        <!-- Rich options with icons -->
        <Example title="Rich Options (Icons + Descriptions)" :code="`<CuiCombobox
  v-model=&quot;selected&quot;
  :options=&quot;techStack&quot;
  multiple
  label=&quot;Tech Stack&quot;
  placeholder=&quot;Search technologies...&quot;
/>`">
          <div style="width: 22rem;">
            <CuiCombobox v-model="selectedTech" :options="techStack" multiple label="Tech Stack" placeholder="Search technologies..." />
          </div>
        </Example>

        <!-- Users with avatars -->
        <Example title="User Select (Images)" :code="`<CuiCombobox
  v-model=&quot;user&quot;
  :options=&quot;users&quot;
  label=&quot;Assign To&quot;
  placeholder=&quot;Search users...&quot;
/>`">
          <CuiFlex gap="4" class="items-start flex-wrap">
            <div style="width: 18rem;">
              <CuiCombobox v-model="selectedUser" :options="users" label="Assign To" placeholder="Search users..." />
            </div>
            <div style="width: 20rem;">
              <CuiCombobox v-model="selectedUsers" :options="users" multiple label="Team Members" placeholder="Add members..." />
            </div>
          </CuiFlex>
        </Example>

        <!-- Custom slot -->
        <Example title="Custom Option Slot" :code="`<CuiCombobox :options=&quot;users&quot;>
  <template #option=&quot;{ option, selected }&quot;>
    <CuiAvatar :src=&quot;option.image&quot; size=&quot;xs&quot; />
    <div>...</div>
  </template>
</CuiCombobox>`">
          <div style="width: 22rem;">
            <CuiCombobox v-model="selectedUser" :options="users" label="Custom Rendering" placeholder="Search...">
              <template #option="{ option, selected }">
                <CuiAvatar :src="option.image as string" :name="option.label" size="xs" />
                <div :style="{ flex: '1' }">
                  <div :style="{ fontWeight: selected ? '600' : '400', fontSize: '0.875rem' }">{{ option.label }}</div>
                  <div :style="{ fontSize: '0.6875rem', color: 'var(--cui-text-tertiary)' }">{{ option.description }}</div>
                </div>
                <CuiBadge v-if="selected" color="success" size="sm">Selected</CuiBadge>
              </template>
            </CuiCombobox>
          </div>
        </Example>

        <!-- Async search -->
        <Example title="Async Server Search" :code="`<CuiCombobox
  :fetch-options=&quot;fetchCountries&quot;
  :min-chars=&quot;2&quot;
  placeholder=&quot;Type to search countries...&quot;
/>`">
          <CuiFlex gap="4" class="items-start">
            <div style="width: 20rem;">
              <CuiCombobox
                v-model="asyncResult"
                :fetch-options="fetchCountries"
                :min-chars="2"
                label="Country"
                placeholder="Type to search countries..."
              />
            </div>
            <div class="text-sm" style="color: var(--cui-text-secondary); padding-top: 1.5rem;">
              Selected: <code class="cui-code">{{ asyncResult ?? 'null' }}</code>
            </div>
          </CuiFlex>
        </Example>

        <!-- Error state -->
        <Example title="Error State" :code="`<CuiCombobox
  v-model=&quot;value&quot;
  :options=&quot;fruits&quot;
  label=&quot;Required Field&quot;
  error
  error-message=&quot;Please select a fruit&quot;
/>`">
          <div style="width: 16rem;">
            <CuiCombobox v-model="selectedFruit" :options="fruits" label="Required Field" error error-message="Please select a fruit" placeholder="Pick a fruit..." />
          </div>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>

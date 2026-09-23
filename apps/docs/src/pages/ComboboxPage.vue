<script setup lang="ts">
import { ref } from "vue";
import {
  CuiAvatar,
  CuiBadge,
  CuiCombobox,
  CuiFlex,
  type ComboboxOption,
} from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import meta from "../meta/combobox";
import Example from "../components/Example.vue";

// Simple options
const usageValue = ref<string | null>(null);
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
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiCombobox v-model=&quot;value&quot; :options=&quot;options&quot; label=&quot;Fruit&quot; />`"
      >
        <CuiCombobox v-model="usageValue" :options="fruits" label="Fruit" :style="{ maxWidth: '20rem' }" />
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        The control is a text field with a listbox popup: typing filters, the arrow
        keys move through the results, <code>Enter</code> selects and
        <code>Escape</code> closes.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          The dropdown is teleported to <code>&lt;body&gt;</code> so it is never clipped
          by an ancestor, and it anchors to the control rather than the wrapper.
        </li>
        <li>
          Sizes come from the shared input scale, so a combobox is the same height and
          indent as a <code>CuiInput</code> or <code>CuiSelect</code> beside it.
        </li>
        <li>
          Pass <code>label</code>, or point <code>aria-labelledby</code> at your own —
          <code>CuiFormField</code> wires both up automatically.
        </li>
      </ul>
    </template>

    <template #examples>

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

        <!-- Rounded -->
        <Example title="Rounded" :code="`<CuiCombobox v-model=&quot;value&quot; :options=&quot;fruits&quot; rounded=&quot;none&quot; />
<CuiCombobox v-model=&quot;value&quot; :options=&quot;fruits&quot; rounded=&quot;lg&quot; />
<CuiCombobox v-model=&quot;value&quot; :options=&quot;fruits&quot; rounded=&quot;full&quot; />`">
          <CuiFlex gap="4" class="items-start flex-wrap">
            <div style="width: 14rem;">
              <CuiCombobox v-model="selectedFruit" :options="fruits" rounded="none" label="None" placeholder="Pick a fruit..." />
            </div>
            <div style="width: 14rem;">
              <CuiCombobox v-model="selectedFruit" :options="fruits" rounded="lg" label="Large" placeholder="Pick a fruit..." />
            </div>
            <div style="width: 14rem;">
              <CuiCombobox v-model="selectedFruit" :options="fruits" rounded="full" label="Full" placeholder="Pick a fruit..." />
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

    </template>
  </DocPage>
</template>

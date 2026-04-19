<script setup lang="ts">
import { ref } from "vue";
import { CuiFlex, CuiStack, CuiTagInput, type TagOption } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const tags1 = ref<string[]>(["vue", "typescript"]);
const tags2 = ref<string[]>([]);
const tags3 = ref<string[]>(["bug"]);
const tags4 = ref<string[]>([]);

const labelSuggestions: TagOption[] = [
  { value: "bug", label: "Bug", color: "error" },
  { value: "feature", label: "Feature", color: "success" },
  { value: "enhancement", label: "Enhancement", color: "info" },
  { value: "documentation", label: "Documentation", color: "secondary" },
  { value: "help-wanted", label: "Help Wanted", color: "warning" },
  { value: "good-first-issue", label: "Good First Issue", color: "primary" },
  { value: "duplicate", label: "Duplicate", color: "secondary" },
  { value: "wontfix", label: "Won't Fix", color: "error" },
  { value: "question", label: "Question", color: "info" },
  { value: "performance", label: "Performance", color: "warning" },
];

const techSuggestions: TagOption[] = [
  { value: "vue" }, { value: "react" }, { value: "angular" }, { value: "svelte" },
  { value: "typescript" }, { value: "javascript" }, { value: "python" }, { value: "rust" },
  { value: "go" }, { value: "tailwind" }, { value: "vite" }, { value: "node" },
];

// Simulated async
async function fetchSkills(query: string): Promise<TagOption[]> {
  const all = [
    "JavaScript", "TypeScript", "Python", "Rust", "Go", "Java", "C#", "Ruby",
    "PHP", "Swift", "Kotlin", "Dart", "Elixir", "Scala", "Haskell", "Clojure",
    "SQL", "GraphQL", "REST", "gRPC", "Docker", "Kubernetes", "AWS", "Azure",
    "Vue.js", "React", "Angular", "Svelte", "Next.js", "Nuxt", "Tailwind CSS",
  ];
  await new Promise((r) => setTimeout(r, 300));
  return all
    .filter((s) => s.toLowerCase().includes(query.toLowerCase()))
    .map((s) => ({ value: s.toLowerCase().replace(/[.\s]/g, "-"), label: s }));
}
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Tag Input</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        A multi-value text input with removable tags, suggestions dropdown,
        and optional creation of new tags. Supports async server search.
        Type and press Enter, comma, or Tab to add. Backspace removes the last tag.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'modelValue', type: 'string[]', default: '[]', description: 'Selected tags (v-model)' },
          { name: 'suggestions', type: 'TagOption[]', default: '[]', description: 'Predefined tag suggestions' },
          { name: 'fetchSuggestions', type: '(query) => Promise<TagOption[]>', default: '—', description: 'Async search function' },
          { name: 'allowCreate', type: 'boolean', default: 'true', description: 'Allow creating tags not in suggestions' },
          { name: 'maxTags', type: 'number', default: '0', description: 'Maximum tags allowed (0 = unlimited)' },
          { name: 'debounce', type: 'number', default: '300', description: 'Debounce for async search (ms)' },
          { name: 'minChars', type: 'number', default: '0', description: 'Min chars before searching' },
          { name: 'placeholder', type: 'string', default: 'Add tag...', description: 'Placeholder text' },
          { name: 'color', type: 'primary | ...', default: 'primary', description: 'Default tag color' },
          { name: 'createText', type: 'string', default: 'Create', description: 'Text for the create option' },
          { name: 'label', type: 'string', default: '—', description: 'Label text' },
          { name: 'size', type: 'sm | md | lg', default: 'md', description: 'Size' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Free-form tags -->
        <Example title="Free-Form (Create Any Tag)" :code="`<CuiTagInput v-model=&quot;tags&quot; label=&quot;Skills&quot; />`">
          <CuiFlex gap="4" class="items-start">
            <div style="width: 20rem;">
              <CuiTagInput v-model="tags1" label="Technologies" placeholder="Type and press Enter..." />
            </div>
            <div class="text-sm" style="color: var(--cui-text-secondary); padding-top: 1.5rem;">
              Tags: <code class="cui-code">{{ tags1 }}</code>
            </div>
          </CuiFlex>
        </Example>

        <!-- With suggestions -->
        <Example title="With Suggestions" :code="`<CuiTagInput :suggestions=&quot;options&quot; />`">
          <div style="width: 20rem;">
            <CuiTagInput v-model="tags2" :suggestions="techSuggestions" label="Tech Stack" placeholder="Search or type..." />
          </div>
        </Example>

        <!-- Colored tags (GitHub labels) -->
        <Example title="Colored Tags (GitHub Labels)">
          <CuiFlex gap="4" class="items-start">
            <div style="width: 22rem;">
              <CuiTagInput
                v-model="tags3"
                :suggestions="labelSuggestions"
                label="Issue Labels"
                placeholder="Add label..."
                :allow-create="false"
              />
            </div>
            <div class="text-sm" style="color: var(--cui-text-secondary); padding-top: 1.5rem;">
              Labels: <code class="cui-code">{{ tags3 }}</code>
            </div>
          </CuiFlex>
        </Example>

        <!-- Async search -->
        <Example title="Async Server Search" :code="`<CuiTagInput :fetch-suggestions=&quot;fetchSkills&quot; :min-chars=&quot;2&quot; />`">
          <div style="width: 22rem;">
            <CuiTagInput
              v-model="tags4"
              :fetch-suggestions="fetchSkills"
              :min-chars="2"
              label="Skills (server search)"
              placeholder="Type to search..."
            />
          </div>
        </Example>

        <!-- Max tags -->
        <Example title="Max 3 Tags" :code="`<CuiTagInput :max-tags=&quot;3&quot; />`">
          <div style="width: 20rem;">
            <CuiTagInput
              :model-value="['red', 'green', 'blue']"
              :max-tags="3"
              label="Favorite Colors (max 3)"
              placeholder="Add color..."
            />
          </div>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>

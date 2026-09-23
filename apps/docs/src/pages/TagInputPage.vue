<script setup lang="ts">
import { ref } from "vue";
import { CuiCard, CuiCardBody, CuiFlex, CuiStack, CuiTagInput, type TagOption } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import meta from "../meta/tag-input";
import Example from "../components/Example.vue";

const usageTags = ref<string[]>(["vue"]);
const tags1 = ref<string[]>(["vue", "typescript"]);
const tags2 = ref<string[]>([]);
const tags3 = ref<string[]>(["bug"]);
const tags4 = ref<string[]>([]);
const tags5 = ref<string[]>(["vue"]);

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
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiTagInput v-model=&quot;tags&quot; label=&quot;Technologies&quot; />`"
      >
        <CuiTagInput v-model="usageTags" label="Technologies" :style="{ maxWidth: '20rem' }" />
      </Example>
    </template>

    <template #accessibility>
      <CuiCard variant="outline">
        <CuiCardBody>
          <CuiStack spacing="3">
            <p class="text-surface-700 dark:text-surface-300">
              A text field with an optional suggestions popup. <code>Enter</code> commits the
              typed value, <code>Backspace</code> on an empty field removes the last tag, and
              the arrow keys move through suggestions when they are shown.
            </p>
            <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
              <li>Each tag's remove control is a real button, reachable by keyboard.</li>
              <li>
                Sizes come from the shared input scale, so a tag input is the same height and
                indent as a <code>CuiInput</code> beside it.
              </li>
              <li>
                Pass <code>label</code>, or point <code>aria-labelledby</code> at your own —
                <code>CuiFormField</code> wires both up automatically.
              </li>
            </ul>
          </CuiStack>
        </CuiCardBody>
      </CuiCard>
    </template>

    <template #examples>

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
        <Example title="With Suggestions" :code="`<CuiTagInput
  v-model=&quot;tags&quot;
  :suggestions=&quot;techSuggestions&quot;
  label=&quot;Tech Stack&quot;
  placeholder=&quot;Search or type...&quot;
/>`">
          <div style="width: 20rem;">
            <CuiTagInput v-model="tags2" :suggestions="techSuggestions" label="Tech Stack" placeholder="Search or type..." />
          </div>
        </Example>

        <!-- Colored tags (GitHub labels) -->
        <Example title="Colored Tags (GitHub Labels)" :code="`<CuiTagInput
  v-model=&quot;tags&quot;
  :suggestions=&quot;labelSuggestions&quot;
  label=&quot;Issue Labels&quot;
  :allow-create=&quot;false&quot;
/>`">
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

        <!-- Rounded -->
        <Example title="Rounded" :code="`<CuiTagInput v-model=&quot;tags&quot; rounded=&quot;none&quot; />
<CuiTagInput v-model=&quot;tags&quot; rounded=&quot;lg&quot; />
<CuiTagInput v-model=&quot;tags&quot; rounded=&quot;full&quot; />`">
          <CuiFlex gap="4" class="items-start flex-wrap">
            <div style="width: 16rem;">
              <CuiTagInput v-model="tags5" rounded="none" label="None" placeholder="Add tag..." />
            </div>
            <div style="width: 16rem;">
              <CuiTagInput v-model="tags5" rounded="lg" label="Large" placeholder="Add tag..." />
            </div>
            <div style="width: 16rem;">
              <CuiTagInput v-model="tags5" rounded="full" label="Full" placeholder="Add tag..." />
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
        <Example title="Max 3 Tags" :code="`<CuiTagInput
  :model-value=&quot;['red', 'green', 'blue']&quot;
  :max-tags=&quot;3&quot;
  label=&quot;Favorite Colors (max 3)&quot;
/>`">
          <div style="width: 20rem;">
            <CuiTagInput
              :model-value="['red', 'green', 'blue']"
              :max-tags="3"
              label="Favorite Colors (max 3)"
              placeholder="Add color..."
            />
          </div>
        </Example>

        <!-- Error state -->
        <Example title="Error State" :code="`<CuiTagInput
  v-model=&quot;tags&quot;
  label=&quot;Required Skills&quot;
  error
  error-message=&quot;Please add at least one skill&quot;
/>`">
          <div style="width: 20rem;">
            <CuiTagInput
              :model-value="[]"
              label="Required Skills"
              error
              error-message="Please add at least one skill"
              placeholder="Add skill..."
            />
          </div>
        </Example>

        <!-- Disabled -->
        <Example title="Disabled" :code="`<CuiTagInput
  :model-value=&quot;['vue', 'typescript']&quot;
  label=&quot;Skills&quot;
  disabled
/>`">
          <div style="width: 20rem;">
            <CuiTagInput
              :model-value="['vue', 'typescript']"
              label="Skills (read-only)"
              disabled
            />
          </div>
        </Example>

    </template>
  </DocPage>
</template>

<script setup lang="ts">
import { CuiCodeBlock, CuiGrid, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const vueExample = `<script setup lang="ts">
import { ref } from "vue";

const count = ref(0);
const message = ref("Hello, world!");

function increment() {
  count.value++;
}
<\/script>

<template>
  <button @click="increment">
    {{ message }} — Count: {{ count }}
  </button>
</template>`;

const cssExample = `:root {
  --cui-primary: oklch(0.45 0.18 270);
  --cui-primary-bg: oklch(0.97 0.02 270);
  --cui-primary-border: oklch(0.74 0.13 270);
  --cui-surface-base: white;
  --cui-border: oklch(0.90 0.006 270);
}

.dark {
  --cui-surface-base: oklch(0.27 0.01 270);
  --cui-border: oklch(0.38 0.01 270);
}`;

const bashExample = `# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test`;

const jsonExample = `{
  "name": "@itguy614/clean-ui",
  "version": "0.2.0",
  "type": "module",
  "dependencies": {
    "@floating-ui/vue": "^1.1.11",
    "@phosphor-icons/vue": "^2.2.1"
  },
  "peerDependencies": {
    "vue": "^3.5.0"
  }
}`;

const tsExample = `export interface DataGridColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: "text" | "select" | "multi-select";
  width?: string;
  align?: "left" | "center" | "right";
  sticky?: boolean;
}

export function useDataGrid(options: UseDataGridOptions) {
  const sort = ref<DataGridSort | null>(null);
  const filters = ref<DataGridFilter[]>([]);
  const page = ref(1);

  function applySort(key: string) {
    // Toggle: asc → desc → clear
    if (sort.value?.key === key) {
      sort.value = sort.value.direction === "asc"
        ? { key, direction: "desc" }
        : null;
    } else {
      sort.value = { key, direction: "asc" };
    }
  }

  return { sort, filters, page, applySort };
}`;
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Code Block</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        A styled code display with copy button, line numbers, line highlighting,
        and a language/filename header. Dark theme by default for contrast.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'code', type: 'string', default: '—', description: 'Code content (required)' },
          { name: 'language', type: 'string', default: '—', description: 'Language label (e.g., typescript, css)' },
          { name: 'filename', type: 'string', default: '—', description: 'File name (overrides language in header)' },
          { name: 'lineNumbers', type: 'boolean', default: 'false', description: 'Show line numbers' },
          { name: 'startLine', type: 'number', default: '1', description: 'Starting line number' },
          { name: 'highlightLines', type: 'number[]', default: '—', description: 'Line numbers to highlight' },
          { name: 'copyable', type: 'boolean', default: 'true', description: 'Show copy button' },
          { name: 'maxHeight', type: 'string', default: '—', description: 'Max height before scrolling' },
          { name: 'size', type: 'sm | md | lg', default: 'md', description: 'Font size' },
          { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the component' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic -->
        <Example title="Basic" :code="`<CuiCodeBlock :code=&quot;code&quot; language=&quot;bash&quot; />`">
          <CuiCodeBlock :code="bashExample" language="bash" />
        </Example>

        <!-- With filename -->
        <Example title="With Filename" :code="`<CuiCodeBlock :code=&quot;code&quot; filename=&quot;package.json&quot; />`">
          <CuiCodeBlock :code="jsonExample" filename="package.json" />
        </Example>

        <!-- Line numbers -->
        <Example title="Line Numbers" :code="`<CuiCodeBlock :code=&quot;code&quot; line-numbers />`">
          <CuiCodeBlock :code="vueExample" filename="Counter.vue" line-numbers />
        </Example>

        <!-- Line highlighting -->
        <Example title="Highlighted Lines" :code="`<CuiCodeBlock :highlight-lines=&quot;[4, 5, 6]&quot; line-numbers />`">
          <CuiCodeBlock :code="cssExample" filename="main.css" line-numbers :highlight-lines="[4, 5, 6]" />
        </Example>

        <!-- With max height -->
        <Example title="Max Height (Scrollable)" :code="`<CuiCodeBlock :code=&quot;code&quot; max-height=&quot;240px&quot; line-numbers :highlight-lines=&quot;[14, 15, 16]&quot; />`">
          <CuiCodeBlock :code="tsExample" filename="useDataGrid.ts" line-numbers max-height="240px" :highlight-lines="[14, 15, 16, 17, 18, 19]" />
        </Example>

        <!-- Sizes -->
        <Example title="Sizes" :code="`<CuiCodeBlock :code=&quot;code&quot; size=&quot;sm&quot; />
<CuiCodeBlock :code=&quot;code&quot; size=&quot;md&quot; />
<CuiCodeBlock :code=&quot;code&quot; size=&quot;lg&quot; />`">
          <CuiStack spacing="4">
            <div>
              <div class="text-xs font-medium mb-1" style="color: var(--cui-text-secondary);">Small:</div>
              <CuiCodeBlock :code="'const greeting = &quot;Hello, world!&quot;;'" language="javascript" size="sm" />
            </div>
            <div>
              <div class="text-xs font-medium mb-1" style="color: var(--cui-text-secondary);">Medium (default):</div>
              <CuiCodeBlock :code="'const greeting = &quot;Hello, world!&quot;;'" language="javascript" size="md" />
            </div>
            <div>
              <div class="text-xs font-medium mb-1" style="color: var(--cui-text-secondary);">Large:</div>
              <CuiCodeBlock :code="'const greeting = &quot;Hello, world!&quot;;'" language="javascript" size="lg" />
            </div>
          </CuiStack>
        </Example>

        <!-- No copy button -->
        <Example title="Without Copy Button" :code="`<CuiCodeBlock :code=&quot;code&quot; language=&quot;bash&quot; :copyable=&quot;false&quot; />`">
          <CuiCodeBlock :code="'npm install @itguy614/clean-ui'" language="bash" :copyable="false" />
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>

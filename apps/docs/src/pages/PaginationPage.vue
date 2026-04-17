<script setup lang="ts">
import { ref, computed } from "vue";
import { CuiPagination, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

// Basic
const basicPage = ref(1);
const basicPerPage = ref(15);

// Laravel meta
const laravelPage = ref(3);
const laravelPerPage = ref(15);
const laravelMeta = computed(() => ({
  current_page: laravelPage.value,
  last_page: Math.ceil(150 / laravelPerPage.value),
  per_page: laravelPerPage.value,
  total: 150,
  from: (laravelPage.value - 1) * laravelPerPage.value + 1,
  to: Math.min(laravelPage.value * laravelPerPage.value, 150),
}));

// Large
const largePage = ref(52);

// Small
const smallPage = ref(1);

// Sizes
const sizePage = ref(1);
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Pagination</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Page navigation with numbered buttons, per-page selector, and info text.
        Accepts Laravel's paginator response directly via the
        <code class="cui-code">meta</code> prop.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'meta', type: 'LaravelPaginatorMeta', default: '-', description: 'Laravel paginator object (current_page, last_page, per_page, total, from, to)' },
          { name: 'currentPage', type: 'number', default: '1', description: 'Current page (override or standalone)' },
          { name: 'totalPages', type: 'number', default: '1', description: 'Total pages (override or standalone)' },
          { name: 'perPage', type: 'number', default: '15', description: 'Items per page (override or standalone)' },
          { name: 'total', type: 'number', default: '0', description: 'Total item count' },
          { name: 'perPageOptions', type: 'number[]', default: '[10,15,25,50,100]', description: 'Options for per-page selector' },
          { name: 'hidePerPage', type: 'boolean', default: 'false', description: 'Hide the per-page selector' },
          { name: 'hideInfo', type: 'boolean', default: 'false', description: 'Hide the info text' },
          { name: 'color', type: 'ButtonColor', default: 'primary', description: 'Active page button color' },
          { name: 'size', type: 'sm | md', default: 'md', description: 'Button size' },
          { name: 'maxButtons', type: 'number', default: '5', description: 'Max page buttons before truncating' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic -->
        <Example title="Basic (individual props)" :code="`<CuiPagination
  :current-page=&quot;page&quot;
  :total-pages=&quot;10&quot;
  :per-page=&quot;15&quot;
  :total=&quot;150&quot;
  @update:current-page=&quot;page = $event&quot;
/>`">
          <CuiStack spacing="2">
            <CuiPagination
              :current-page="basicPage"
              :total-pages="10"
              :per-page="basicPerPage"
              :total="150"
              @update:current-page="basicPage = $event"
              @update:per-page="basicPerPage = $event"
            />
            <div class="text-sm text-surface-500">Page: {{ basicPage }}, Per page: {{ basicPerPage }}</div>
          </CuiStack>
        </Example>

        <!-- Laravel meta -->
        <Example title="Laravel Meta Prop" :code="`<CuiPagination
  :meta=&quot;users.meta&quot;
  @update:current-page=&quot;fetchPage($event)&quot;
/>`">
          <CuiStack spacing="2">
            <CuiPagination
              :meta="laravelMeta"
              @update:current-page="laravelPage = $event"
              @update:per-page="laravelPerPage = $event"
            />
            <pre class="cui-pre text-xs">{{ JSON.stringify(laravelMeta, null, 2) }}</pre>
          </CuiStack>
        </Example>

        <!-- Large page count -->
        <Example title="Large Page Count (100 pages)">
          <CuiPagination
            :current-page="largePage"
            :total-pages="100"
            :total="1500"
            :per-page="15"
            hide-per-page
            @update:current-page="largePage = $event"
          />
        </Example>

        <!-- Small page count -->
        <Example title="Small Page Count (3 pages)">
          <CuiPagination
            :current-page="smallPage"
            :total-pages="3"
            :total="42"
            :per-page="15"
            hide-per-page
            @update:current-page="smallPage = $event"
          />
        </Example>

        <!-- Hide info -->
        <Example title="Hidden Info Text">
          <CuiPagination
            :current-page="basicPage"
            :total-pages="10"
            :total="150"
            :per-page="15"
            hide-info
            @update:current-page="basicPage = $event"
          />
        </Example>

        <!-- Hide per-page -->
        <Example title="Hidden Per-Page Selector">
          <CuiPagination
            :current-page="basicPage"
            :total-pages="10"
            :total="150"
            :per-page="15"
            hide-per-page
            @update:current-page="basicPage = $event"
          />
        </Example>

        <!-- Minimal (no info, no per-page) -->
        <Example title="Minimal (buttons only)">
          <CuiPagination
            :current-page="basicPage"
            :total-pages="10"
            hide-info
            hide-per-page
            @update:current-page="basicPage = $event"
          />
        </Example>

        <!-- Colors -->
        <Example title="Colors">
          <CuiStack spacing="3">
            <CuiPagination :current-page="3" :total-pages="5" hide-info hide-per-page color="primary" />
            <CuiPagination :current-page="3" :total-pages="5" hide-info hide-per-page color="success" />
            <CuiPagination :current-page="3" :total-pages="5" hide-info hide-per-page color="error" />
            <CuiPagination :current-page="3" :total-pages="5" hide-info hide-per-page color="info" />
          </CuiStack>
        </Example>

        <!-- Sizes -->
        <Example title="Sizes">
          <CuiStack spacing="3">
            <CuiPagination
              :current-page="sizePage"
              :total-pages="10"
              :total="150"
              :per-page="15"
              size="sm"
              @update:current-page="sizePage = $event"
            />
            <CuiPagination
              :current-page="sizePage"
              :total-pages="10"
              :total="150"
              :per-page="15"
              size="md"
              @update:current-page="sizePage = $event"
            />
          </CuiStack>
        </Example>

        <!-- Inertia Integration -->
        <Example title="Inertia Integration">
          <div class="rounded-lg border border-surface-200 bg-surface-50 p-6 dark:border-surface-800 dark:bg-surface-900">
            <p class="mb-3 text-surface-600 dark:text-surface-400">
              With Inertia, pass the paginator meta directly and use
              <code class="cui-code">router.get()</code> to fetch new pages:
            </p>
            <pre class="cui-pre"><code>import { router } from '@inertiajs/vue3'
import { CuiPagination } from '@itguy614/clean-ui'

// props.users comes from Laravel: User::paginate(15)
const props = defineProps&lt;{ users: { data: User[], meta: LaravelPaginatorMeta } }&gt;()

function onPageChange(page: number) {
  router.get(route('users.index'), { page }, { preserveState: true })
}

function onPerPageChange(perPage: number) {
  router.get(route('users.index'), { per_page: perPage }, { preserveState: true })
}</code></pre>
            <pre class="cui-pre mt-3"><code>&lt;CuiPagination
  :meta="users.meta"
  @update:current-page="onPageChange"
  @update:per-page="onPerPageChange"
/&gt;</code></pre>
          </div>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>

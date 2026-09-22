<script setup lang="ts">
import { ref } from "vue";
import { CuiBadge, CuiButton, CuiCard, CuiCardBody, CuiFlex, CuiInput, CuiStack, CuiTreeView, type TreeNode } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import MethodTable from "../components/MethodTable.vue";
import EventTable from "../components/EventTable.vue";
import Example from "../components/Example.vue";

const fileTree: TreeNode[] = [
  {
    id: "src", label: "src", icon: "folder",
    children: [
      {
        id: "components", label: "components", icon: "folder",
        children: [
          { id: "Button.vue", label: "Button.vue", icon: "file-vue" },
          { id: "Input.vue", label: "Input.vue", icon: "file-vue" },
          { id: "Modal.vue", label: "Modal.vue", icon: "file-vue" },
          { id: "Card.vue", label: "Card.vue", icon: "file-vue" },
        ],
      },
      {
        id: "composables", label: "composables", icon: "folder",
        children: [
          { id: "useTheme.ts", label: "useTheme.ts", icon: "file-ts" },
          { id: "useToast.ts", label: "useToast.ts", icon: "file-ts" },
        ],
      },
      {
        id: "styles", label: "styles", icon: "folder",
        children: [
          { id: "main.css", label: "main.css", icon: "file-css" },
          { id: "themes.css", label: "themes.css", icon: "file-css" },
        ],
      },
      { id: "index.ts", label: "index.ts", icon: "file-ts" },
    ],
  },
  { id: "package.json", label: "package.json", icon: "file-text" },
  { id: "vite.config.ts", label: "vite.config.ts", icon: "file-ts" },
  { id: "README.md", label: "README.md", icon: "file-text" },
];

const orgTree: TreeNode[] = [
  {
    id: "ceo", label: "Jane Smith — CEO", icon: "user-circle",
    children: [
      {
        id: "cto", label: "Bob Lee — CTO", icon: "user",
        children: [
          { id: "dev1", label: "Alice — Senior Dev", icon: "user" },
          { id: "dev2", label: "Carol — Dev", icon: "user" },
          { id: "dev3", label: "David — Dev", icon: "user", disabled: true },
        ],
      },
      {
        id: "cmo", label: "Eva — CMO", icon: "user",
        children: [
          { id: "mkt1", label: "Frank — Marketing", icon: "user" },
          { id: "mkt2", label: "Grace — Design", icon: "user" },
        ],
      },
      { id: "cfo", label: "Henry — CFO", icon: "user" },
    ],
  },
];

const navTree: TreeNode[] = [
  {
    id: "dashboard", label: "Dashboard", icon: "house",
  },
  {
    id: "products", label: "Products", icon: "package",
    children: [
      { id: "all-products", label: "All Products", icon: "list" },
      { id: "add-product", label: "Add Product", icon: "plus" },
      { id: "categories", label: "Categories", icon: "tag" },
    ],
  },
  {
    id: "orders", label: "Orders", icon: "shopping-cart",
    children: [
      { id: "pending", label: "Pending", icon: "clock" },
      { id: "completed", label: "Completed", icon: "check-circle" },
      { id: "returned", label: "Returned", icon: "arrow-counter-clockwise" },
    ],
  },
  {
    id: "settings", label: "Settings", icon: "gear",
    children: [
      { id: "general", label: "General", icon: "sliders" },
      { id: "users", label: "Users", icon: "users" },
      { id: "billing", label: "Billing", icon: "credit-card", disabled: true },
    ],
  },
];

const selectedFile = ref<string | number | null>(null);
const selectedOrg = ref<(string | number)[]>([]);
const selectedNav = ref<string | number | null>("dashboard");

// JSON-driven example — simulate fetching from an API
const apiResponse = {
  departments: [
    {
      id: "eng",
      name: "Engineering",
      headCount: 24,
      teams: [
        { id: "frontend", name: "Frontend", headCount: 8, members: [
          { id: "fe-1", name: "Alice", role: "Lead" },
          { id: "fe-2", name: "Bob", role: "Senior" },
          { id: "fe-3", name: "Carol", role: "Mid" },
        ]},
        { id: "backend", name: "Backend", headCount: 10, members: [
          { id: "be-1", name: "David", role: "Lead" },
          { id: "be-2", name: "Eva", role: "Senior" },
        ]},
        { id: "devops", name: "DevOps", headCount: 6, members: [
          { id: "do-1", name: "Frank", role: "Lead" },
        ]},
      ],
    },
    {
      id: "design",
      name: "Design",
      headCount: 8,
      teams: [
        { id: "ux", name: "UX Research", headCount: 3, members: [
          { id: "ux-1", name: "Grace", role: "Lead" },
        ]},
        { id: "ui", name: "UI Design", headCount: 5, members: [
          { id: "ui-1", name: "Henry", role: "Lead" },
          { id: "ui-2", name: "Ivy", role: "Senior" },
        ]},
      ],
    },
  ],
};

// Transform API JSON into TreeNode[] format
function mapToTree(data: typeof apiResponse): TreeNode[] {
  return data.departments.map((dept) => ({
    id: dept.id,
    label: `${dept.name} (${dept.headCount})`,
    icon: "buildings",
    children: dept.teams.map((team) => ({
      id: team.id,
      label: `${team.name} (${team.headCount})`,
      icon: "users",
      children: team.members.map((member) => ({
        id: member.id,
        label: member.name,
        icon: "user",
        role: member.role,
      })),
    })),
  }));
}

const jsonTree = mapToTree(apiResponse);
const selectedPerson = ref<string | number | null>(null);

// --- Controlled expansion -------------------------------------------------
// The bound array is the single source of truth: the toolbar writes to it, the
// tree renders it, and it is what you would persist and restore.
const expandedFiles = ref<(string | number)[]>(["src"]);

// Imperative API, reached through a template ref — for the actions a bound
// array is clumsy for, like expanding every node without walking the tree
// yourself, or revealing a search hit's ancestors.
const treeRef = ref<InstanceType<typeof CuiTreeView> | null>(null);
const search = ref("");

function revealMatch() {
  const term = search.value.trim().toLowerCase();
  if (!term) return;
  const walk = (nodes: TreeNode[]): TreeNode | undefined => {
    for (const node of nodes) {
      if (node.label.toLowerCase().includes(term)) return node;
      const hit = node.children && walk(node.children);
      if (hit) return hit;
    }
    return undefined;
  };
  const match = walk(fileTree);
  if (match) treeRef.value?.reveal(match.id);
}
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Tree View</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        An expandable hierarchical list for file explorers, org charts, navigation menus,
        and any nested data. Supports single/multiple selection, connecting lines,
        icons, and custom node rendering via scoped slot.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'nodes', type: 'TreeNode[]', default: '—', description: 'Tree data (required)' },
          { name: 'modelValue', type: 'string | number | array | null', default: 'null', description: 'Selected node id(s)' },
          { name: 'multiple', type: 'boolean', default: 'false', description: 'Allow multiple selection' },
          { name: 'expanded', type: '(string | number)[]', default: '—', description: 'Expanded node ids (v-model:expanded). Pass it and expansion is controlled; omit it and the tree manages its own' },
          { name: 'defaultExpanded', type: '(string | number)[]', default: '—', description: 'Initially expanded node ids — read once, ignored when `expanded` is passed' },
          { name: 'expandAll', type: 'boolean', default: 'false', description: 'Expand every node by default — read once, ignored when `expanded` is passed' },
          { name: 'showLines', type: 'boolean', default: 'true', description: 'Show connecting lines' },
          { name: 'selectable', type: 'boolean', default: 'true', description: 'Allow selection (false = expand-only)' },
          { name: 'animated', type: 'boolean', default: 'true', description: 'Animate expand/collapse' },
          { name: 'size', type: 'sm | md | lg', default: 'md', description: 'Size' },
          { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the component' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Events</h2>
      <EventTable
        :events="[
          { name: 'update:modelValue', payload: 'string | number | Array | null', description: 'Fires when selection changes (v-model)' },
          { name: 'node-click', payload: 'TreeNode', description: 'Fires when a selectable node is clicked' },
          { name: 'update:expanded', payload: '(string | number)[]', description: 'Fires whenever expansion changes (v-model:expanded)' },
          { name: 'node-expand', payload: 'TreeNode, boolean', description: 'Fires when a single node is expanded or collapsed. Bulk changes report through update:expanded instead' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Methods</h2>
      <p class="mb-4" style="color: var(--cui-text-secondary);">
        Reached through a template ref. Each one works whether expansion is controlled
        (<code class="cui-code">v-model:expanded</code>) or not — when it is controlled they
        emit <code class="cui-code">update:expanded</code> rather than moving the tree themselves.
      </p>
      <MethodTable
        :methods="[
          { name: 'expand', signature: '(id) => void', description: 'Expand one node. No-op if already expanded' },
          { name: 'collapse', signature: '(id) => void', description: 'Collapse one node. No-op if already collapsed' },
          { name: 'toggleExpand', signature: '(id) => void', description: 'Flip a single node between expanded and collapsed' },
          { name: 'expandAll', signature: '() => void', description: 'Expand every node that has children, at any depth' },
          { name: 'collapseAll', signature: '() => void', description: 'Collapse everything' },
          { name: 'reveal', signature: '(id) => void', description: 'Expand every ancestor of a node so it becomes visible — for jumping to a search hit' },
          { name: 'isExpanded', signature: '(id) => boolean', description: 'Whether a node id is currently expanded' },
          { name: 'expandedIds', signature: '() => (string | number)[]', description: 'The ids currently expanded' },
          { name: 'el', signature: 'HTMLElement', description: 'The root element' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Keyboard</h2>
      <p class="mb-4" style="color: var(--cui-text-secondary);">
        The tree is a single tab stop with roving focus, per the ARIA tree pattern &mdash; one
        <code class="cui-code">Tab</code> reaches it however many nodes it holds, and the arrow keys
        move within it. Disabled nodes are skipped.
      </p>
      <PropTable
        :props="[
          { name: 'Down / Up', type: 'key', default: '-', description: 'Next / previous visible node, crossing depth boundaries' },
          { name: 'Right', type: 'key', default: '-', description: 'Collapsed parent: expand. Expanded parent: move to its first child. Leaf: nothing' },
          { name: 'Left', type: 'key', default: '-', description: 'Expanded parent: collapse. Otherwise: move to the parent' },
          { name: 'Home / End', type: 'key', default: '-', description: 'First / last visible node' },
          { name: 'Enter / Space', type: 'key', default: '-', description: 'Same as clicking the row: selects, or toggles when selectable is false' },
          { name: 'Asterisk', type: 'key', default: '-', description: 'Expand every sibling at the current level' },
          { name: 'Typing', type: 'key', default: '-', description: 'Jump to the next node whose label starts with what you type. The buffer accumulates for about 600ms, so typing continues the search rather than restarting it' },
        ]"
      />

      <p class="mb-4 mt-6" style="color: var(--cui-text-secondary);">
        Pointer and keyboard share one notion of the current node, so clicking a row and then
        pressing <code class="cui-code">Tab</code> away and back resumes where you left off.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Accessibility</h2>
      <CuiCard variant="outline">
        <CuiCardBody>
          <CuiStack spacing="2">
            <div>
              <code class="cui-code">role="tree"</code> on the container, with
              <code class="cui-code">aria-multiselectable</code> when
              <code class="cui-code">multiple</code> is set.
            </div>
            <div>
              <code class="cui-code">role="treeitem"</code> per node, carrying
              <code class="cui-code">aria-expanded</code> (parents only),
              <code class="cui-code">aria-selected</code> (when selectable),
              <code class="cui-code">aria-disabled</code>, and
              <code class="cui-code">aria-level</code> /
              <code class="cui-code">aria-setsize</code> /
              <code class="cui-code">aria-posinset</code>.
            </div>
            <div>
              <code class="cui-code">role="group"</code> on each children wrapper, so nesting depth
              is conveyed rather than merely drawn.
            </div>
            <div>
              The focus ring is drawn on the row, not on the
              <code class="cui-code">treeitem</code> element &mdash; that element has to wrap the
              whole subtree to contain the child group, so outlining it would box in every
              descendant.
            </div>
          </CuiStack>
        </CuiCardBody>
      </CuiCard>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Controlled expansion -->
        <Example title="Controlled expansion" :code="`&lt;script setup&gt;
const expanded = ref([&#39;src&#39;])
const tree = ref()
&lt;/script&gt;

&lt;template&gt;
  &lt;CuiButton @click=&quot;tree.expandAll()&quot;&gt;Expand all&lt;/CuiButton&gt;
  &lt;CuiButton @click=&quot;tree.collapseAll()&quot;&gt;Collapse all&lt;/CuiButton&gt;
  &lt;CuiButton @click=&quot;tree.reveal(&#39;Input.vue&#39;)&quot;&gt;Reveal&lt;/CuiButton&gt;

  &lt;CuiTreeView ref=&quot;tree&quot; v-model:expanded=&quot;expanded&quot; :nodes=&quot;fileTree&quot; /&gt;
&lt;/template&gt;`">
          <CuiStack spacing="4">
            <CuiFlex gap="2" class="items-center flex-wrap">
              <CuiButton size="sm" @click="treeRef?.expandAll()">Expand all</CuiButton>
              <CuiButton size="sm" @click="treeRef?.collapseAll()">Collapse all</CuiButton>
              <CuiInput
                v-model="search"
                size="sm"
                placeholder="Find a file…"
                style="width: 12rem;"
                @keyup.enter="revealMatch"
              />
              <CuiButton size="sm" color="primary" @click="revealMatch">Reveal</CuiButton>
            </CuiFlex>

            <CuiFlex gap="4" class="items-start">
              <CuiCard variant="outline" style="width: 18rem;">
                <CuiCardBody>
                  <CuiTreeView ref="treeRef" v-model:expanded="expandedFiles" :nodes="fileTree" />
                </CuiCardBody>
              </CuiCard>
              <div class="text-sm" style="color: var(--cui-text-secondary);">
                <div>
                  Expanded:
                  <code class="cui-code">{{ expandedFiles.length ? expandedFiles.join(", ") : "none" }}</code>
                </div>
                <div style="margin-top: 0.75rem; font-size: 0.75rem; color: var(--cui-text-tertiary);">
                  The array is the source of truth — the toolbar writes to it, the tree renders it,
                  and it is what you would persist and restore. <code class="cui-code">reveal()</code>
                  expands the ancestors of a match without you having to work out the path.
                </div>
              </div>
            </CuiFlex>
          </CuiStack>
        </Example>

        <!-- File explorer -->
        <Example title="File Explorer" :code="`<CuiTreeView
  v-model=&quot;selectedFile&quot;
  :nodes=&quot;fileTree&quot;
  :default-expanded=&quot;['src', 'components']&quot;
/>`">
          <CuiFlex gap="4" class="items-start">
            <CuiCard variant="outline" style="width: 18rem;">
              <CuiCardBody>
                <CuiTreeView
                  v-model="selectedFile"
                  :nodes="fileTree"
                  :default-expanded="['src', 'components']"
                />
              </CuiCardBody>
            </CuiCard>
            <div class="text-sm" style="color: var(--cui-text-secondary);">
              Selected: <code class="cui-code">{{ selectedFile ?? 'none' }}</code>
            </div>
          </CuiFlex>
        </Example>

        <!-- Org chart with multi-select -->
        <Example title="Org Chart (Multi-Select)" :code="`<CuiTreeView
  v-model=&quot;selectedOrg&quot;
  :nodes=&quot;orgTree&quot;
  multiple
  expand-all
/>`">
          <CuiFlex gap="4" class="items-start">
            <CuiCard variant="outline" style="width: 20rem;">
              <CuiCardBody>
                <CuiTreeView
                  v-model="selectedOrg"
                  :nodes="orgTree"
                  multiple
                  expand-all
                />
              </CuiCardBody>
            </CuiCard>
            <div class="text-sm" style="color: var(--cui-text-secondary);">
              Selected: <code class="cui-code">{{ selectedOrg }}</code>
            </div>
          </CuiFlex>
        </Example>

        <!-- Navigation menu -->
        <Example title="Navigation Menu (No Lines)" :code="`<CuiTreeView
  v-model=&quot;selectedNav&quot;
  :nodes=&quot;navTree&quot;
  :show-lines=&quot;false&quot;
  :default-expanded=&quot;['products', 'orders']&quot;
  size=&quot;sm&quot;
/>`">
          <CuiCard variant="outline" style="width: 16rem;">
            <CuiCardBody>
              <CuiTreeView
                v-model="selectedNav"
                :nodes="navTree"
                :show-lines="false"
                :default-expanded="['products', 'orders']"
                size="sm"
              />
            </CuiCardBody>
          </CuiCard>
        </Example>

        <!-- Expand only (no selection) -->
        <Example title="Expand Only (Not Selectable)" :code="`<CuiTreeView
  :nodes=&quot;fileTree&quot;
  :selectable=&quot;false&quot;
  expand-all
  size=&quot;sm&quot;
/>`">
          <CuiCard variant="outline" style="width: 18rem;">
            <CuiCardBody>
              <CuiTreeView
                :nodes="fileTree"
                :selectable="false"
                expand-all
                size="sm"
              />
            </CuiCardBody>
          </CuiCard>
        </Example>

        <!-- Custom node slot -->
        <Example title="Custom Node Slot">
          <CuiCard variant="outline" style="width: 22rem;">
            <CuiCardBody>
              <CuiTreeView :nodes="orgTree" expand-all :selectable="false">
                <template #node="{ node, depth }">
                  <CuiFlex gap="2" class="items-center">
                    <span>{{ node.label }}</span>
                    <CuiBadge v-if="depth === 0" color="primary" size="sm">CEO</CuiBadge>
                    <CuiBadge v-else-if="node.disabled" color="secondary" size="sm">Inactive</CuiBadge>
                  </CuiFlex>
                </template>
              </CuiTreeView>
            </CuiCardBody>
          </CuiCard>
        </Example>

        <!-- JSON data-bound -->
        <Example title="Data-Bound from JSON API" :code="`// API response
const apiResponse = { departments: [
  { id: 'eng', name: 'Engineering', headCount: 24,
    teams: [
      { id: 'frontend', name: 'Frontend', headCount: 8,
        members: [{ id: 'fe-1', name: 'Alice', role: 'Lead' }]
      }
    ]
  }
]};

// Transform to TreeNode[]
function mapToTree(data) {
  return data.departments.map(dept => ({
    id: dept.id,
    label: dept.name + ' (' + dept.headCount + ')',
    icon: 'buildings',
    children: dept.teams.map(team => ({
      id: team.id,
      label: team.name,
      icon: 'users',
      children: team.members.map(m => ({
        id: m.id, label: m.name, icon: 'user'
      }))
    }))
  }));
}

<CuiTreeView :nodes=&quot;mapToTree(apiResponse)&quot; />`">
          <CuiFlex gap="4" class="items-start">
            <CuiCard variant="outline" style="width: 22rem;">
              <CuiCardBody>
                <CuiTreeView
                  v-model="selectedPerson"
                  :nodes="jsonTree"
                  expand-all
                >
                  <template #node="{ node, selected }">
                    <CuiFlex gap="2" class="items-center">
                      <span :style="{ fontWeight: selected ? '600' : '400' }">{{ node.label }}</span>
                      <CuiBadge v-if="node.role" size="sm" :color="node.role === 'Lead' ? 'primary' : node.role === 'Senior' ? 'success' : 'secondary'">
                        {{ node.role }}
                      </CuiBadge>
                    </CuiFlex>
                  </template>
                </CuiTreeView>
              </CuiCardBody>
            </CuiCard>
            <div class="text-sm" style="color: var(--cui-text-secondary);">
              <div>Selected: <code class="cui-code">{{ selectedPerson ?? 'none' }}</code></div>
              <div style="margin-top: 0.75rem; font-size: 0.75rem; color: var(--cui-text-tertiary);">
                Tree is built by mapping a flat JSON API response into the TreeNode[] structure
                using a simple transform function.
              </div>
            </div>
          </CuiFlex>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { CuiBadge, CuiCard, CuiCardBody, CuiFlex, CuiStack, CuiTreeView, type TreeNode } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
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
          { name: 'defaultExpanded', type: '(string | number)[]', default: '—', description: 'Initially expanded node ids' },
          { name: 'expandAll', type: 'boolean', default: 'false', description: 'Expand all nodes by default' },
          { name: 'showLines', type: 'boolean', default: 'true', description: 'Show connecting lines' },
          { name: 'selectable', type: 'boolean', default: 'true', description: 'Allow selection (false = expand-only)' },
          { name: 'size', type: 'sm | md | lg', default: 'md', description: 'Size' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- File explorer -->
        <Example title="File Explorer">
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
        <Example title="Org Chart (Multi-Select)">
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
        <Example title="Navigation Menu (No Lines)">
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
        <Example title="Expand Only (Not Selectable)">
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

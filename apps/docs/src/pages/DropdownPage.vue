<script setup lang="ts">
import { ref } from "vue";
import {
  CuiButton,
  CuiDropdown,
  CuiDropdownCheckItem,
  CuiDropdownDivider,
  CuiDropdownHeader,
  CuiDropdownItem,
  CuiDropdownMenu,
  CuiDropdownRadioGroup,
  CuiDropdownRadioItem,
  CuiDropdownSub,
  CuiDropdownTrigger,
  CuiFlex,
  CuiIcon,
  CuiStack,
} from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const showGrid = ref(true);
const showSidebar = ref(true);
const sortBy = ref("name");
const theme = ref("system");
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Dropdown</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Floating menu with action items, check items, radio groups, headers,
        dividers, and nested sub-menus. Built with sub-components.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">CuiDropdown Props</h2>
      <PropTable
        :props="[
          { name: 'trigger', type: 'click | hover | hover-focus', default: 'click', description: 'How the dropdown is triggered' },
          { name: 'placement', type: 'bottom | top | left | right | ...', default: 'bottom', description: 'Preferred placement of the menu' },
          { name: 'pinned', type: 'boolean', default: 'false', description: 'Keep dropdown anchored to trigger on scroll instead of closing' },
          { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state — prevents opening' },
          { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the component (v-show)' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Sub-Components</h2>
      <PropTable
        :props="[
          { name: 'CuiDropdownTrigger', type: 'wrapper', default: '—', description: 'Wraps the element that opens the menu' },
          { name: 'CuiDropdownMenu', type: 'panel', default: '—', description: 'The floating menu panel. minWidth prop (default 12rem)' },
          { name: 'CuiDropdownItem', type: 'action', default: '—', description: 'Action item. #icon slot, shortcut + description props, emits select' },
          { name: 'CuiDropdownCheckItem', type: 'toggle', default: '—', description: 'Toggleable checkbox item. v-model boolean' },
          { name: 'CuiDropdownRadioGroup', type: 'group', default: '—', description: 'Single-select group. v-model string | number' },
          { name: 'CuiDropdownRadioItem', type: 'option', default: '—', description: 'Radio item within a group. value prop' },
          { name: 'CuiDropdownSub', type: 'nested', default: '—', description: 'Sub-menu. Inherits parent trigger, optional trigger override. #menu slot for items.' },
          { name: 'CuiDropdownDivider', type: 'separator', default: '—', description: 'Horizontal line separator' },
          { name: 'CuiDropdownHeader', type: 'label', default: '—', description: 'Non-interactive group label' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic -->
        <Example title="Basic Action Menu" :code="`<CuiDropdown>
  <CuiDropdownTrigger>
    <CuiButton>Options</CuiButton>
  </CuiDropdownTrigger>
  <CuiDropdownMenu>
    <CuiDropdownItem @select=&quot;...&quot;>Edit</CuiDropdownItem>
    <CuiDropdownItem @select=&quot;...&quot;>Delete</CuiDropdownItem>
  </CuiDropdownMenu>
</CuiDropdown>`">
          <CuiDropdown>
            <CuiDropdownTrigger>
              <CuiButton>Options</CuiButton>
            </CuiDropdownTrigger>
            <CuiDropdownMenu>
              <CuiDropdownItem>Edit</CuiDropdownItem>
              <CuiDropdownItem>Duplicate</CuiDropdownItem>
              <CuiDropdownDivider />
              <CuiDropdownItem>Archive</CuiDropdownItem>
              <CuiDropdownItem>Delete</CuiDropdownItem>
            </CuiDropdownMenu>
          </CuiDropdown>
        </Example>

        <!-- With Icons + Shortcuts -->
        <Example title="Icons &amp; Keyboard Shortcuts" :code="`<CuiDropdown>
  <CuiDropdownTrigger>
    <CuiButton variant=&quot;outline&quot;>Edit Menu</CuiButton>
  </CuiDropdownTrigger>
  <CuiDropdownMenu>
    <CuiDropdownItem shortcut=&quot;Ctrl+Z&quot;>
      <template #icon><CuiIcon name=&quot;arrow-counter-clockwise&quot; size=&quot;sm&quot; /></template>
      Undo
    </CuiDropdownItem>
    <CuiDropdownItem shortcut=&quot;Ctrl+C&quot;>
      <template #icon><CuiIcon name=&quot;copy&quot; size=&quot;sm&quot; /></template>
      Copy
    </CuiDropdownItem>
  </CuiDropdownMenu>
</CuiDropdown>`">
          <CuiDropdown>
            <CuiDropdownTrigger>
              <CuiButton variant="outline">
                <template #prefix><CuiIcon name="list" size="sm" /></template>
                Edit Menu
              </CuiButton>
            </CuiDropdownTrigger>
            <CuiDropdownMenu>
              <CuiDropdownItem shortcut="Ctrl+Z">
                <template #icon><CuiIcon name="arrow-counter-clockwise" size="sm" /></template>
                Undo
              </CuiDropdownItem>
              <CuiDropdownItem shortcut="Ctrl+Y">
                <template #icon><CuiIcon name="arrow-clockwise" size="sm" /></template>
                Redo
              </CuiDropdownItem>
              <CuiDropdownDivider />
              <CuiDropdownItem shortcut="Ctrl+X">
                <template #icon><CuiIcon name="scissors" size="sm" /></template>
                Cut
              </CuiDropdownItem>
              <CuiDropdownItem shortcut="Ctrl+C">
                <template #icon><CuiIcon name="copy" size="sm" /></template>
                Copy
              </CuiDropdownItem>
              <CuiDropdownItem shortcut="Ctrl+V">
                <template #icon><CuiIcon name="clipboard" size="sm" /></template>
                Paste
              </CuiDropdownItem>
            </CuiDropdownMenu>
          </CuiDropdown>
        </Example>

        <!-- With Descriptions -->
        <Example title="Items with Descriptions" :code="`<CuiDropdownMenu min-width=&quot;16rem&quot;>
  <CuiDropdownItem description=&quot;Start with an empty canvas&quot;>
    <template #icon><CuiIcon name=&quot;file-plus&quot; size=&quot;sm&quot; /></template>
    Blank Project
  </CuiDropdownItem>
</CuiDropdownMenu>`">
          <CuiDropdown>
            <CuiDropdownTrigger>
              <CuiButton variant="solid">New...</CuiButton>
            </CuiDropdownTrigger>
            <CuiDropdownMenu min-width="16rem">
              <CuiDropdownItem description="Start with an empty canvas">
                <template #icon><CuiIcon name="file-plus" size="sm" /></template>
                Blank Project
              </CuiDropdownItem>
              <CuiDropdownItem description="Use a pre-built starting point">
                <template #icon><CuiIcon name="folder-open" size="sm" /></template>
                From Template
              </CuiDropdownItem>
              <CuiDropdownItem description="Clone an existing repository">
                <template #icon><CuiIcon name="git-branch" size="sm" /></template>
                Import from Git
              </CuiDropdownItem>
            </CuiDropdownMenu>
          </CuiDropdown>
        </Example>

        <!-- Check Items -->
        <Example title="Check Items (toggle)" :code="`<CuiDropdown>
  <CuiDropdownTrigger>
    <CuiButton variant=&quot;outline&quot;>View</CuiButton>
  </CuiDropdownTrigger>
  <CuiDropdownMenu>
    <CuiDropdownHeader>Show / Hide</CuiDropdownHeader>
    <CuiDropdownCheckItem v-model=&quot;showGrid&quot;>Grid Lines</CuiDropdownCheckItem>
    <CuiDropdownCheckItem v-model=&quot;showSidebar&quot;>Sidebar</CuiDropdownCheckItem>
  </CuiDropdownMenu>
</CuiDropdown>`">
          <CuiStack spacing="2">
            <CuiDropdown>
              <CuiDropdownTrigger>
                <CuiButton variant="outline">
                  <template #prefix><CuiIcon name="sliders" size="sm" /></template>
                  View
                </CuiButton>
              </CuiDropdownTrigger>
              <CuiDropdownMenu>
                <CuiDropdownHeader>Show / Hide</CuiDropdownHeader>
                <CuiDropdownCheckItem v-model="showGrid">Grid Lines</CuiDropdownCheckItem>
                <CuiDropdownCheckItem v-model="showSidebar">Sidebar</CuiDropdownCheckItem>
              </CuiDropdownMenu>
            </CuiDropdown>
            <div class="text-sm text-surface-500">Grid: {{ showGrid }}, Sidebar: {{ showSidebar }}</div>
          </CuiStack>
        </Example>

        <!-- Radio Items -->
        <Example title="Radio Items (single select)" :code="`<CuiDropdownMenu>
  <CuiDropdownHeader>Sort By</CuiDropdownHeader>
  <CuiDropdownRadioGroup v-model=&quot;sortBy&quot;>
    <CuiDropdownRadioItem value=&quot;name&quot;>Name</CuiDropdownRadioItem>
    <CuiDropdownRadioItem value=&quot;date&quot;>Date</CuiDropdownRadioItem>
    <CuiDropdownRadioItem value=&quot;size&quot;>Size</CuiDropdownRadioItem>
  </CuiDropdownRadioGroup>
</CuiDropdownMenu>`">
          <CuiStack spacing="2">
            <CuiDropdown>
              <CuiDropdownTrigger>
                <CuiButton variant="outline">Sort: {{ sortBy }}</CuiButton>
              </CuiDropdownTrigger>
              <CuiDropdownMenu>
                <CuiDropdownHeader>Sort By</CuiDropdownHeader>
                <CuiDropdownRadioGroup v-model="sortBy">
                  <CuiDropdownRadioItem value="name">Name</CuiDropdownRadioItem>
                  <CuiDropdownRadioItem value="date">Date</CuiDropdownRadioItem>
                  <CuiDropdownRadioItem value="size">Size</CuiDropdownRadioItem>
                  <CuiDropdownRadioItem value="type">Type</CuiDropdownRadioItem>
                </CuiDropdownRadioGroup>
              </CuiDropdownMenu>
            </CuiDropdown>
            <div class="text-sm text-surface-500">Sort by: {{ sortBy }}</div>
          </CuiStack>
        </Example>

        <!-- Sub-menus -->
        <Example title="Sub-Menus (nested)" :code="`<CuiDropdownMenu>
  <CuiDropdownItem>Profile</CuiDropdownItem>
  <CuiDropdownSub>
    Theme
    <template #menu>
      <CuiDropdownRadioGroup v-model=&quot;theme&quot;>
        <CuiDropdownRadioItem value=&quot;light&quot;>Light</CuiDropdownRadioItem>
        <CuiDropdownRadioItem value=&quot;dark&quot;>Dark</CuiDropdownRadioItem>
      </CuiDropdownRadioGroup>
    </template>
  </CuiDropdownSub>
</CuiDropdownMenu>`">
          <CuiDropdown>
            <CuiDropdownTrigger>
              <CuiButton variant="outline">
                <template #prefix><CuiIcon name="gear" size="sm" /></template>
                Settings
              </CuiButton>
            </CuiDropdownTrigger>
            <CuiDropdownMenu>
              <CuiDropdownItem>
                <template #icon><CuiIcon name="user" size="sm" /></template>
                Profile
              </CuiDropdownItem>
              <CuiDropdownSub>
                <template #icon><CuiIcon name="palette" size="sm" /></template>
                Theme
                <template #menu>
                  <CuiDropdownRadioGroup v-model="theme">
                    <CuiDropdownRadioItem value="light">Light</CuiDropdownRadioItem>
                    <CuiDropdownRadioItem value="dark">Dark</CuiDropdownRadioItem>
                    <CuiDropdownRadioItem value="system">System</CuiDropdownRadioItem>
                  </CuiDropdownRadioGroup>
                </template>
              </CuiDropdownSub>
              <CuiDropdownSub>
                <template #icon><CuiIcon name="translate" size="sm" /></template>
                Language
                <template #menu>
                  <CuiDropdownItem>English</CuiDropdownItem>
                  <CuiDropdownItem>Spanish</CuiDropdownItem>
                  <CuiDropdownItem>French</CuiDropdownItem>
                  <CuiDropdownItem>German</CuiDropdownItem>
                </template>
              </CuiDropdownSub>
              <CuiDropdownDivider />
              <CuiDropdownItem shortcut="Ctrl+Q">
                <template #icon><CuiIcon name="sign-out" size="sm" /></template>
                Sign Out
              </CuiDropdownItem>
            </CuiDropdownMenu>
          </CuiDropdown>
        </Example>

        <!-- Hover trigger -->
        <Example title="Hover Trigger" :code="`<CuiDropdown trigger=&quot;hover&quot;>
  <CuiDropdownTrigger>
    <CuiButton variant=&quot;outline&quot;>Hover me</CuiButton>
  </CuiDropdownTrigger>
  <CuiDropdownMenu>
    <CuiDropdownItem>Quick action 1</CuiDropdownItem>
  </CuiDropdownMenu>
</CuiDropdown>`">
          <CuiFlex gap="3">
            <CuiDropdown trigger="hover">
              <CuiDropdownTrigger>
                <CuiButton variant="outline">Hover me</CuiButton>
              </CuiDropdownTrigger>
              <CuiDropdownMenu>
                <CuiDropdownItem>Quick action 1</CuiDropdownItem>
                <CuiDropdownItem>Quick action 2</CuiDropdownItem>
                <CuiDropdownItem>Quick action 3</CuiDropdownItem>
              </CuiDropdownMenu>
            </CuiDropdown>
            <CuiDropdown trigger="click">
              <CuiDropdownTrigger>
                <CuiButton variant="outline">Click me</CuiButton>
              </CuiDropdownTrigger>
              <CuiDropdownMenu>
                <CuiDropdownItem>Action 1</CuiDropdownItem>
                <CuiDropdownItem>Action 2</CuiDropdownItem>
              </CuiDropdownMenu>
            </CuiDropdown>
          </CuiFlex>
        </Example>

        <!-- Disabled items -->
        <Example title="Disabled Items" :code="`<CuiDropdownMenu>
  <CuiDropdownItem>Edit</CuiDropdownItem>
  <CuiDropdownItem disabled>Move (no permission)</CuiDropdownItem>
  <CuiDropdownDivider />
  <CuiDropdownItem disabled>Delete (locked)</CuiDropdownItem>
</CuiDropdownMenu>`">
          <CuiDropdown>
            <CuiDropdownTrigger>
              <CuiButton variant="outline">Actions</CuiButton>
            </CuiDropdownTrigger>
            <CuiDropdownMenu>
              <CuiDropdownItem>Edit</CuiDropdownItem>
              <CuiDropdownItem>Duplicate</CuiDropdownItem>
              <CuiDropdownItem disabled>Move (no permission)</CuiDropdownItem>
              <CuiDropdownDivider />
              <CuiDropdownItem disabled>Delete (locked)</CuiDropdownItem>
            </CuiDropdownMenu>
          </CuiDropdown>
        </Example>

        <!-- Mixed: real-world context menu -->
        <Example title="Real-World: Context Menu" :code="`<CuiDropdown>
  <CuiDropdownTrigger>
    <CuiButton variant=&quot;ghost&quot; size=&quot;sm&quot;>
      <CuiIcon name=&quot;dots-three&quot; size=&quot;md&quot; weight=&quot;bold&quot; />
    </CuiButton>
  </CuiDropdownTrigger>
  <CuiDropdownMenu min-width=&quot;14rem&quot;>
    <CuiDropdownItem shortcut=&quot;Enter&quot;>
      <template #icon><CuiIcon name=&quot;eye&quot; size=&quot;sm&quot; /></template>
      Open
    </CuiDropdownItem>
    <CuiDropdownDivider />
    <CuiDropdownItem>
      <template #icon><CuiIcon name=&quot;trash&quot; size=&quot;sm&quot; /></template>
      Delete
    </CuiDropdownItem>
  </CuiDropdownMenu>
</CuiDropdown>`">
          <CuiDropdown>
            <CuiDropdownTrigger>
              <CuiButton variant="ghost" size="sm">
                <CuiIcon name="dots-three" size="md" weight="bold" />
              </CuiButton>
            </CuiDropdownTrigger>
            <CuiDropdownMenu min-width="14rem">
              <CuiDropdownItem shortcut="Enter">
                <template #icon><CuiIcon name="eye" size="sm" /></template>
                Open
              </CuiDropdownItem>
              <CuiDropdownItem shortcut="Ctrl+E">
                <template #icon><CuiIcon name="pencil" size="sm" /></template>
                Edit
              </CuiDropdownItem>
              <CuiDropdownDivider />
              <CuiDropdownItem>
                <template #icon><CuiIcon name="copy" size="sm" /></template>
                Duplicate
              </CuiDropdownItem>
              <CuiDropdownItem>
                <template #icon><CuiIcon name="arrow-square-out" size="sm" /></template>
                Open in New Tab
              </CuiDropdownItem>
              <CuiDropdownDivider />
              <CuiDropdownItem>
                <template #icon><CuiIcon name="archive" size="sm" /></template>
                Archive
              </CuiDropdownItem>
              <CuiDropdownItem disabled>
                <template #icon><CuiIcon name="trash" size="sm" /></template>
                Delete
              </CuiDropdownItem>
            </CuiDropdownMenu>
          </CuiDropdown>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>
